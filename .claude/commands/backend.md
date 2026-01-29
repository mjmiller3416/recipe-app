# Backend Development

Automate backend tasks using the Meal Genie layered architecture.

## Skill Reference

**Always read first:** `.claude/skills/backend-dev/SKILL.md`

For code patterns, reference existing implementations rather than asking for templates.

## Arguments

$ARGUMENTS

## Workflows

| Command | Description |
|---------|-------------|
| `scaffold <type> <name>` | Generate new entity, endpoint, or layer |
| `audit [target]` | Check architecture compliance |
| `migrate <description>` | Create Alembic migration |
| (no args) | Show backend status and suggestions |

### scaffold

**Types:** `entity` (full stack), `endpoint` (route + service + DTOs), `model`, `service`, `dto`

1. Parse name: `shopping-item` → `ShoppingItem` (class), `shopping_item` (file)
2. Check what already exists
3. For `entity`: ask about fields, relationships, constraints
4. Generate bottom-up: Model → Migration → DTOs → Repo → Service → Route
5. Register route in `main.py`
6. Run quick audit checklist from skill file

### audit

**Targets:** file path, module name, feature name (e.g., "recipe"), or "recent" for git diff

1. Identify layer from file location
2. Check layer-specific rules from skill file
3. Report violations with specific fixes
4. Offer to apply fixes

### migrate

1. Run `alembic revision --autogenerate -m "<description>"`
2. Review generated migration for issues
3. Offer to apply with `alembic upgrade head`

### status (no args)

Show: model/service/route counts, migration status, recently modified files, suggested actions.

## File Locations

| Resource | Path |
|----------|------|
| Models | `backend/app/models/` |
| DTOs | `backend/app/dtos/` |
| Repositories | `backend/app/repositories/` |
| Services | `backend/app/services/` |
| Routes | `backend/app/api/` |
| AI module | `backend/app/ai/` |
| Migrations | `backend/app/database/migrations/versions/` |

## Examples

```
/backend                              # Status overview
/backend scaffold entity recipe-tag   # Full stack for new entity
/backend scaffold endpoint bulk-import # New endpoint on existing model
/backend audit recipe_service         # Check specific file
/backend audit recent                 # Check recently modified
/backend migrate add-recipe-source    # Create migration
```