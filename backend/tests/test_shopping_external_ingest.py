"""Tests for the external shopping item ingest (Tada integration).

Covers the upsert service method, DTO validation, and the shared API-key
auth dependency.
"""

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.api.auth.api_key import get_integration_user
from app.core.auth_config import AuthSettings
from app.dtos.shopping_dtos import ExternalItemUpsertDTO
from app.models.shopping_item import ShoppingItem
from app.models.user import User
from app.services.shopping import ShoppingService


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def service(db_session: Session, test_user: User) -> ShoppingService:
    return ShoppingService(db_session, test_user.id)


def make_dto(**overrides) -> ExternalItemUpsertDTO:
    data = {"name": "Paper Towels", "source": "tada", "category": "household"}
    data.update(overrides)
    return ExternalItemUpsertDTO(**data)


# ---------------------------------------------------------------------------
# DTO validation
# ---------------------------------------------------------------------------

class TestExternalItemUpsertDTO:
    def test_valid_minimal_payload(self):
        dto = ExternalItemUpsertDTO(name="Dish Soap", source="tada")
        assert dto.name == "Dish Soap"
        assert dto.quantity is None
        assert dto.category is None

    def test_name_is_stripped(self):
        dto = make_dto(name="  Sponges  ")
        assert dto.name == "Sponges"

    def test_category_normalized_to_lowercase(self):
        dto = make_dto(category="  Household ")
        assert dto.category == "household"

    @pytest.mark.parametrize("source", ["recipe", "manual"])
    def test_reserved_sources_rejected(self, source):
        with pytest.raises(ValidationError):
            make_dto(source=source)

    @pytest.mark.parametrize("source", ["Tada", "ta da", "-tada", ""])
    def test_invalid_source_slugs_rejected(self, source):
        with pytest.raises(ValidationError):
            make_dto(source=source)

    def test_negative_quantity_rejected(self):
        with pytest.raises(ValidationError):
            make_dto(quantity=-1)


# ---------------------------------------------------------------------------
# Upsert service method
# ---------------------------------------------------------------------------

class TestUpsertExternalItem:
    def test_creates_new_item(self, service: ShoppingService, test_user: User):
        result = service.upsert_external_item(make_dto(quantity=2))
        assert result is not None

        item, created = result
        assert created is True
        assert item.ingredient_name == "Paper Towels"
        assert item.quantity == 2
        assert item.source == "tada"
        assert item.category == "household"
        assert item.have is False

    def test_quantity_defaults_to_one(self, service: ShoppingService):
        item, _ = service.upsert_external_item(make_dto())
        assert item.quantity == 1.0

    def test_repeat_push_updates_instead_of_duplicating(
        self, service: ShoppingService, db_session: Session, test_user: User
    ):
        first, created_first = service.upsert_external_item(make_dto(quantity=1))
        second, created_second = service.upsert_external_item(make_dto(quantity=3))

        assert created_first is True
        assert created_second is False
        assert second.id == first.id
        assert second.quantity == 3

        rows = (
            db_session.query(ShoppingItem)
            .filter(ShoppingItem.user_id == test_user.id)
            .all()
        )
        assert len(rows) == 1

    def test_dedupe_is_case_insensitive_on_name(self, service: ShoppingService):
        first, _ = service.upsert_external_item(make_dto(name="Paper Towels"))
        second, created = service.upsert_external_item(make_dto(name="paper towels"))
        assert created is False
        assert second.id == first.id

    def test_repush_unchecks_completed_item(
        self, service: ShoppingService, db_session: Session
    ):
        item, _ = service.upsert_external_item(make_dto())
        db_item = db_session.get(ShoppingItem, item.id)
        db_item.have = True
        db_session.flush()

        repushed, created = service.upsert_external_item(make_dto())
        assert created is False
        assert repushed.have is False

    def test_repush_without_optional_fields_preserves_existing(
        self, service: ShoppingService
    ):
        service.upsert_external_item(make_dto(quantity=5, category="household"))
        repushed, _ = service.upsert_external_item(
            ExternalItemUpsertDTO(name="Paper Towels", source="tada")
        )
        assert repushed.quantity == 5
        assert repushed.category == "household"

    def test_same_name_different_source_creates_separate_items(
        self, service: ShoppingService
    ):
        _, created_first = service.upsert_external_item(make_dto(source="tada"))
        _, created_second = service.upsert_external_item(make_dto(source="otherapp"))
        assert created_first is True
        assert created_second is True

    def test_does_not_collide_with_manual_item_of_same_name(
        self, service: ShoppingService, db_session: Session, test_user: User
    ):
        from app.dtos.shopping_dtos import ManualItemCreateDTO

        service.add_manual_item(
            ManualItemCreateDTO(ingredient_name="Paper Towels", quantity=1)
        )
        _, created = service.upsert_external_item(make_dto())
        assert created is True

        rows = (
            db_session.query(ShoppingItem)
            .filter(
                ShoppingItem.user_id == test_user.id,
                ShoppingItem.ingredient_name == "Paper Towels",
            )
            .all()
        )
        assert len(rows) == 2

    def test_items_are_scoped_to_integration_user(
        self, db_session: Session, test_user: User, second_user: User
    ):
        ShoppingService(db_session, test_user.id).upsert_external_item(make_dto())
        _, created = ShoppingService(db_session, second_user.id).upsert_external_item(
            make_dto()
        )
        # Same (name, source) may exist once per user
        assert created is True


# ---------------------------------------------------------------------------
# API-key auth dependency
# ---------------------------------------------------------------------------

def make_settings(**overrides) -> AuthSettings:
    values = {"integration_api_key": "test-key", "integration_user_id": 1}
    values.update(overrides)
    return AuthSettings(_env_file=None, **values)


class TestGetIntegrationUser:
    def test_valid_key_returns_configured_user(
        self, db_session: Session, test_user: User
    ):
        settings = make_settings(integration_user_id=test_user.id)
        user = get_integration_user("test-key", db_session, settings)
        assert user.id == test_user.id

    def test_missing_key_rejected(self, db_session: Session, test_user: User):
        settings = make_settings(integration_user_id=test_user.id)
        with pytest.raises(HTTPException) as exc:
            get_integration_user(None, db_session, settings)
        assert exc.value.status_code == 401

    def test_wrong_key_rejected(self, db_session: Session, test_user: User):
        settings = make_settings(integration_user_id=test_user.id)
        with pytest.raises(HTTPException) as exc:
            get_integration_user("wrong-key", db_session, settings)
        assert exc.value.status_code == 401

    def test_unconfigured_key_returns_503(self, db_session: Session):
        settings = make_settings(integration_api_key=None)
        with pytest.raises(HTTPException) as exc:
            get_integration_user("test-key", db_session, settings)
        assert exc.value.status_code == 503

    def test_unknown_target_user_returns_503(self, db_session: Session):
        settings = make_settings(integration_user_id=999999)
        with pytest.raises(HTTPException) as exc:
            get_integration_user("test-key", db_session, settings)
        assert exc.value.status_code == 503
