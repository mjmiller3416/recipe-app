"""app/core/utils/image_utils.py

Image processing utilities for the application.

# ── Internal Index ──────────────────────────────────────────
#
# ── Cache Utils ─────────────────────────────────────────────
# img_cache_get_key()        -> Generate cache key for image
# img_cache_get()            -> Retrieve cached image
# img_cache_set()            -> Store image in cache
# img_cache_clear()          -> Clear cache entries
#
# ── Processor Utils ────────────────────────────────────────
# img_resize_to_size()       -> Resize image to specific size
# img_scale_to_fit()         -> Scale image to fit in bounds
# img_crop_to_square()       -> Crop image to square aspect
# img_apply_rounded_mask()   -> Apply rounded corners
# img_apply_circular_mask()  -> Apply circular mask
#
# ── Validation Utils ───────────────────────────────────────
# img_validate_path()        -> Validate image path exists
# img_validate_format()      -> Check image format support
# img_get_info()             -> Get image dimensions/info
#
# ── Path & Resource Utils ───────────────────────────────────
# img_resolve_path()         -> Resolve app image paths
# img_get_placeholder()      -> Get placeholder pixmap
# img_create_temp_path()     -> Generate temp file path
#
# ── Format & Conversion Utils ───────────────────────────────
# img_convert_format()       -> Convert between formats
# img_save_with_quality()    -> Save with compression
#
# ── AI Integration Utils ────────────────────────────────────
# img_ai_generate_filename() -> Generate AI image filename
# img_ai_slugify()           -> Slugify text for filenames
# img_ai_get_hash()          -> Generate content hash
#
# ── Qt Integration Utils ────────────────────────────────────
# img_qt_to_pixmap()         -> Convert to QPixmap safely
# img_qt_load_safe()         -> Load QPixmap safely from path
# img_qt_apply_round_path()  -> Apply rounded rect path
#
# ── Cropping Utils ─────────────────────────────────────────
# img_calc_scale_factor()    -> Calculate scale between pixmaps
# img_crop_from_scaled_coords()-> Crop original from scaled coords
# img_intersect_bounds()     -> Safe rectangle intersection

"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

import hashlib
import re
import tempfile
import uuid
from pathlib import Path
from typing import Dict, NamedTuple, Optional, Tuple, Union

from PySide6.QtCore import QRect, QRectF, QSize, Qt
from PySide6.QtGui import QColor, QPainter, QPainterPath, QPixmap, QFont, QFontMetrics

from app.config import AppPaths
# NOTE: Do not import from app.style.icon.* at module import time to avoid
# circular imports through core.utils -> image_utils -> style.icon.loader.
# Any icon/theme imports must be inside functions.

__all__ = [
    # Types
    'ImageFormat', 'ImageInfo',

    # Cache Utils
    'img_cache_get_key', 'img_cache_get', 'img_cache_set', 'img_cache_clear',

    # Processor Utils
    'img_resize_to_size', 'img_scale_to_fit', 'img_crop_to_square',
    'img_apply_rounded_mask', 'img_apply_circular_mask',

    # Validation Utils
    'img_validate_path', 'img_validate_format', 'img_get_info',

    # Path & Resource Utils
    'img_resolve_path', 'img_get_placeholder', 'img_create_temp_path',

    # Format & Conversion Utils
    'img_convert_format', 'img_save_with_quality',

    # AI Integration Utils
    'img_ai_generate_filename', 'img_ai_slugify', 'img_ai_get_hash',

    # Qt Integration Utils
    'img_qt_to_pixmap', 'img_qt_load_safe', 'img_qt_apply_round_path',

    # Cropping Utils
    'img_calc_scale_factor', 'img_crop_from_scaled_coords', 'img_intersect_bounds',
]


# ── Types ───────────────────────────────────────────────────────────────────────────────────────────────────
class ImageFormat:
    """Supported image formats."""
    PNG = "PNG"
    JPEG = "JPEG"
    JPG = "JPG"
    WEBP = "WEBP"

    ALL = {PNG, JPEG, JPG, WEBP}
    LOSSY = {JPEG, JPG, WEBP}
    LOSSLESS = {PNG}

class ImageInfo(NamedTuple):
    """Image information tuple."""
    path: Path
    width: int
    height: int
    format: str
    size_bytes: int


# ── Constants ───────────────────────────────────────────────────────────────────────────────────────────────
_SLUG_RE = re.compile(r"[^a-z0-9]+")
_IMAGE_CACHE: Dict[str, QPixmap] = {}
_TEMP_DIR = Path(tempfile.gettempdir()) / "app_image_utils"
_TEMP_DIR.mkdir(parents=True, exist_ok=True)


# ── Cache Utils ─────────────────────────────────────────────────────────────────────────────────────────────
def img_cache_get_key(path: Union[str, Path], size: Optional[Union[int, QSize]] = None,
                     radii: Optional[Tuple[int, int, int, int]] = None) -> str:
    """Generate cache key for image with processing parameters.

    Args:
        path: Image file path
        size: Target size (int for square, QSize for rect)
        radii: Rounded corner radii (tl, tr, br, bl)

    Returns:
        Cache key string
    """
    key_parts = [str(path)]

    if size is not None:
        if isinstance(size, QSize):
            key_parts.append(f"size_{size.width()}x{size.height()}")
        else:
            key_parts.append(f"size_{size}")

    if radii is not None:
        key_parts.append(f"radii_{'_'.join(map(str, radii))}")

    return "|".join(key_parts)

def img_cache_get(key: str) -> Optional[QPixmap]:
    """Retrieve cached image by key.

    Args:
        key: Cache key

    Returns:
        Cached QPixmap or None if not found
    """
    return _IMAGE_CACHE.get(key)

def img_cache_set(key: str, pixmap: QPixmap) -> None:
    """Store image in cache.

    Args:
        key: Cache key
        pixmap: QPixmap to cache
    """
    _IMAGE_CACHE[key] = pixmap

def img_cache_clear(pattern: Optional[str] = None) -> int:
    """Clear cache entries matching pattern.

    Args:
        pattern: Optional pattern to match keys (None = clear all)

    Returns:
        Number of entries cleared
    """
    if pattern is None:
        count = len(_IMAGE_CACHE)
        _IMAGE_CACHE.clear()
        return count

    keys_to_remove = [k for k in _IMAGE_CACHE.keys() if pattern in k]
    for key in keys_to_remove:
        del _IMAGE_CACHE[key]
    return len(keys_to_remove)


# ── Processor Utils ─────────────────────────────────────────────────────────────────────────────────────────
def img_resize_to_size(pixmap: QPixmap, size: Union[int, QSize],
                      keep_aspect: bool = True) -> QPixmap:
    """Resize image to specific size.

    Args:
        pixmap: Source QPixmap
        size: Target size (int for square, QSize for rect)
        keep_aspect: Whether to maintain aspect ratio

    Returns:
        Resized QPixmap
    """
    if pixmap.isNull():
        return QPixmap()

    if isinstance(size, int):
        target_size = QSize(size, size)
    else:
        target_size = size

    aspect_mode = (Qt.KeepAspectRatioByExpanding if keep_aspect
                  else Qt.IgnoreAspectRatio)

    return pixmap.scaled(target_size, aspect_mode, Qt.SmoothTransformation)

def img_scale_to_fit(pixmap: QPixmap, max_width: int, max_height: int) -> QPixmap:
    """Scale image to fit within bounds while maintaining aspect ratio.

    Args:
        pixmap: Source QPixmap
        max_width: Maximum width
        max_height: Maximum height

    Returns:
        Scaled QPixmap
    """
    if pixmap.isNull():
        return QPixmap()

    return pixmap.scaled(
        QSize(max_width, max_height),
        Qt.KeepAspectRatio,
        Qt.SmoothTransformation
    )

def img_crop_to_square(pixmap: QPixmap, size: Optional[int] = None) -> QPixmap:
    """Crop image to square aspect ratio from center.

    Args:
        pixmap: Source QPixmap
        size: Target size (None = use smaller dimension)

    Returns:
        Square-cropped QPixmap
    """
    if pixmap.isNull():
        return QPixmap()

    # Determine crop size
    min_dim = min(pixmap.width(), pixmap.height())
    crop_size = size if size is not None else min_dim

    # Calculate crop position (center)
    x = (pixmap.width() - crop_size) // 2
    y = (pixmap.height() - crop_size) // 2

    return pixmap.copy(x, y, crop_size, crop_size)

def img_apply_rounded_mask(pixmap: QPixmap, radii: Union[int, Tuple[int, int, int, int]]) -> QPixmap:
    """Apply rounded corner mask to image.

    Args:
        pixmap: Source QPixmap
        radii: Corner radii (int for uniform, tuple for per-corner)

    Returns:
        Rounded QPixmap
    """
    if pixmap.isNull():
        return QPixmap()

    if isinstance(radii, int):
        corner_radii = (radii, radii, radii, radii)
    else:
        corner_radii = radii

    # Create rounded pixmap
    rounded = QPixmap(pixmap.size())
    rounded.fill(Qt.transparent)

    painter = QPainter(rounded)
    painter.setRenderHint(QPainter.Antialiasing)

    # Apply rounded path
    path = img_qt_apply_round_path(pixmap.width(), pixmap.height(), corner_radii)
    painter.setClipPath(path)
    painter.drawPixmap(0, 0, pixmap)
    painter.end()

    return rounded

def img_apply_circular_mask(pixmap: QPixmap, diameter: Optional[int] = None) -> QPixmap:
    """Apply circular mask to image.

    Args:
        pixmap: Source QPixmap
        diameter: Target diameter (None = use smaller dimension)

    Returns:
        Circular QPixmap
    """
    if pixmap.isNull():
        return QPixmap()

    # Determine diameter
    min_dim = min(pixmap.width(), pixmap.height())
    circle_diameter = diameter if diameter is not None else min_dim

    # Scale to circle size maintaining aspect ratio
    scaled = img_resize_to_size(pixmap, circle_diameter, keep_aspect=True)

    # Create circular mask
    circular = QPixmap(circle_diameter, circle_diameter)
    circular.fill(Qt.transparent)

    painter = QPainter(circular)
    painter.setRenderHint(QPainter.Antialiasing)

    # Clip to circle
    path = QPainterPath()
    path.addEllipse(0, 0, circle_diameter, circle_diameter)
    painter.setClipPath(path)

    # Draw centered
    x = (circle_diameter - scaled.width()) // 2
    y = (circle_diameter - scaled.height()) // 2
    painter.drawPixmap(x, y, scaled)
    painter.end()

    return circular


# ── Validation Utils ────────────────────────────────────────────────────────────────────────────────────────
def img_validate_path(path: Union[str, Path]) -> bool:
    """Validate that image path exists and is readable.

    Args:
        path: Path to validate

    Returns:
        True if path is valid image file
    """
    if not path:
        return False

    path_obj = Path(path)
    return path_obj.exists() and path_obj.is_file()

def img_validate_format(path: Union[str, Path]) -> bool:
    """Check if image format is supported.

    Args:
        path: Image file path

    Returns:
        True if format is supported
    """
    if not path:
        return False

    suffix = Path(path).suffix.upper().lstrip('.')
    return suffix in ImageFormat.ALL

def img_get_info(path: Union[str, Path]) -> Optional[ImageInfo]:
    """Get image information including dimensions and format.

    Args:
        path: Image file path

    Returns:
        ImageInfo namedtuple or None if invalid
    """
    if not img_validate_path(path):
        return None

    path_obj = Path(path)
    pixmap = QPixmap(str(path_obj))

    if pixmap.isNull():
        return None

    return ImageInfo(
        path=path_obj,
        width=pixmap.width(),
        height=pixmap.height(),
        format=path_obj.suffix.upper().lstrip('.'),
        size_bytes=path_obj.stat().st_size
    )


# ── Path & Resource Utils ───────────────────────────────────────────────────────────────────────────────────
def img_resolve_path(relative_path: str) -> Path:
    """Resolve relative image path to absolute app path.

    Args:
        relative_path: Relative path from app images directory

    Returns:
        Absolute Path object
    """
    if Path(relative_path).is_absolute():
        return Path(relative_path)

    # Try common image directories
    for base_dir in [AppPaths.RECIPE_IMAGES_DIR, AppPaths.ICONS_DIR, AppPaths.USER_PROFILE_DIR]:
        full_path = base_dir / relative_path
        if full_path.exists():
            return full_path

    # Default to recipe images dir
    return AppPaths.RECIPE_IMAGES_DIR / relative_path

def img_get_placeholder(size: Union[int, QSize] = 100,
                       color: QColor | None = None,
                       text: str | None = "No Image") -> QPixmap:
    """Build a themed placeholder pixmap for missing images.

    Uses the Photo icon from the app icon set and theme palette colors so the
    result auto‑matches light/dark themes. Optionally renders a short label.

    Args:
        size: Target pixmap size (int = square, QSize supported).
        color: Optional explicit background QColor. If None, uses themed surface.
        text: Optional label to render under the icon; set None to omit.

    Returns:
        QPixmap: Themed placeholder image.
    """
    # Normalize size
    target_size = QSize(size, size) if isinstance(size, int) else size
    w, h = target_size.width(), target_size.height()

    # Pull colors from the active theme palette (lazy import to avoid cycles)
    try:
        from app.style.theme_controller import Theme  # local import
        palette = Theme.get_current_color_map() or {}
    except Exception:
        palette = {}
    bg_hex = palette.get("surface_container", palette.get("surface_variant", "#CCCCCC"))
    fg_hex = palette.get("on_surface_variant", palette.get("on_surface", "#666666"))

    # Background fill
    pixmap = QPixmap(target_size)
    bg_qcolor = color if isinstance(color, QColor) else QColor(bg_hex)
    pixmap.fill(bg_qcolor)

    # Start painter
    painter = QPainter(pixmap)
    painter.setRenderHint(QPainter.Antialiasing, True)
    painter.setRenderHint(QPainter.TextAntialiasing, True)

    # Compute icon size (~50% of min dimension), leaving room for text
    min_dim = min(w, h)
    has_text = bool(text)
    text_space = int(min_dim * 0.22) if has_text else 0
    icon_side = max(16, int(min_dim * (0.50 if has_text else 0.60)))

    # Compute icon position
    ix, iy = (w - icon_side) // 2, (h - icon_side - text_space) // 2

    # Render themed photo icon using AppIcon (lazy import to avoid cycles)
    try:
        from app.style.icon.icon import AppIcon
        from app.style.icon.config import Name as IconName

        icon_widget = AppIcon(IconName.PHOTO)
        icon_widget.setSize(icon_side, icon_side)
        icon_pix = icon_widget.pixmap()
        if icon_pix is not None:
            painter.drawPixmap(ix, iy, icon_pix)
    except Exception:
        # If icon fails, just skip drawing it
        pass

    # Optional label text
    if has_text:
        painter.setPen(QColor(fg_hex))

        # Scaled font: readable but compact
        font = QFont()
        font.setPointSize(max(8, int(min_dim * 0.11)))
        painter.setFont(font)

        fm = QFontMetrics(font)
        label = text
        # Truncate if overly long for the width
        if fm.horizontalAdvance(label) > int(w * 0.9):
            label = fm.elidedText(label, Qt.ElideRight, int(w * 0.9))

        # Place text centered within reserved text_space under the icon
        text_top = iy + icon_side + max(0, (text_space - fm.height()) // 2)
        painter.drawText(0, text_top, w, fm.height(), Qt.AlignHCenter, label)

    painter.end()
    return pixmap

def img_create_temp_path(prefix: str = "temp_image", suffix: str = ".png") -> Path:
    """Generate temporary file path for image processing.

    Args:
        prefix: Filename prefix
        suffix: File extension

    Returns:
        Temporary file Path
    """
    filename = f"{prefix}_{uuid.uuid4().hex}{suffix}"
    return _TEMP_DIR / filename


# ── Format & Conversion Utils ───────────────────────────────────────────────────────────────────────────────
def img_convert_format(pixmap: QPixmap, target_format: str,
                      quality: int = -1) -> bytes:
    """Convert pixmap to specific format bytes.

    Args:
        pixmap: Source QPixmap
        target_format: Target format (PNG, JPEG, etc.)
        quality: Compression quality (-1 for default)

    Returns:
        Image bytes in target format
    """
    if pixmap.isNull():
        return b""

    # Create temp path for conversion
    temp_path = img_create_temp_path(suffix=f".{target_format.lower()}")

    try:
        success = pixmap.save(str(temp_path), target_format, quality)
        if not success:
            return b""

        return temp_path.read_bytes()
    finally:
        # Clean up temp file
        if temp_path.exists():
            temp_path.unlink()

def img_save_with_quality(pixmap: QPixmap, path: Union[str, Path],
                         quality: int = 90) -> bool:
    """Save pixmap with specific quality settings.

    Args:
        pixmap: Source QPixmap
        path: Output file path
        quality: Quality setting (0-100)

    Returns:
        True if save successful
    """
    if pixmap.isNull():
        return False

    path_obj = Path(path)
    format_str = path_obj.suffix.upper().lstrip('.')

    return pixmap.save(str(path_obj), format_str, quality)


# ── AI Integration Utils ────────────────────────────────────────────────────────────────────────────────────
def img_ai_generate_filename(base_name: str, image_type: str = "standard",
                           size: str = "1024x1024") -> str:
    """Generate filename for AI-generated image.

    Args:
        base_name: Base name (e.g., recipe name)
        image_type: Image type (standard, banner, etc.)
        size: Image dimensions

    Returns:
        Generated filename with hash
    """
    slug = img_ai_slugify(base_name)
    content_hash = img_ai_get_hash(f"{base_name}-{image_type}")
    return f"{slug}-{content_hash}-{image_type}_{size}.png"

def img_ai_slugify(text: str) -> str:
    """Convert text to filesystem-safe slug.

    Args:
        text: Input text

    Returns:
        Slugified string
    """
    slug = text.lower().strip()
    slug = _SLUG_RE.sub("-", slug)
    return slug.strip("-")

def img_ai_get_hash(content: str, length: int = 8) -> str:
    """Generate content hash for uniqueness.

    Args:
        content: Content to hash
        length: Hash length (default 8 chars)

    Returns:
        Hex hash string
    """
    return hashlib.sha1(content.encode("utf-8")).hexdigest()[:length]


# ── Qt Integration Utils ────────────────────────────────────────────────────────────────────────────────────
def img_qt_to_pixmap(source: Union[str, Path, QPixmap]) -> QPixmap:
    """Convert various sources to QPixmap safely.

    Args:
        source: Path string, Path object, or existing QPixmap

    Returns:
        QPixmap (may be null if conversion failed)
    """
    if isinstance(source, QPixmap):
        return source

    if not img_validate_path(source):
        return QPixmap()

    return QPixmap(str(source))

def img_qt_load_safe(path: Union[str, Path]) -> QPixmap:
    """Load QPixmap from path safely, return null pixmap on failure.

    Args:
        path: Image file path

    Returns:
        QPixmap (null if failed to load)
    """
    return QPixmap(str(path))  # Returns null pixmap if loading fails

def img_qt_apply_round_path(width: int, height: int,
                           radii: Tuple[int, int, int, int]) -> QPainterPath:
    """Create rounded rectangle path for clipping.

    Args:
        width: Rectangle width
        height: Rectangle height
        radii: Corner radii (tl, tr, br, bl)

    Returns:
        QPainterPath for rounded rectangle
    """
    tl, tr, br, bl = radii
    rect = QRectF(0, 0, width, height)
    path = QPainterPath()

    # Start from top-left corner
    path.moveTo(rect.left() + tl, rect.top())

    # Top edge to top-right corner
    path.lineTo(rect.right() - tr, rect.top())
    path.quadTo(rect.right(), rect.top(), rect.right(), rect.top() + tr)

    # Right edge to bottom-right corner
    path.lineTo(rect.right(), rect.bottom() - br)
    path.quadTo(rect.right(), rect.bottom(), rect.right() - br, rect.bottom())

    # Bottom edge to bottom-left corner
    path.lineTo(rect.left() + bl, rect.bottom())
    path.quadTo(rect.left(), rect.bottom(), rect.left(), rect.bottom() - bl)

    # Left edge back to top-left corner
    path.lineTo(rect.left(), rect.top() + tl)
    path.quadTo(rect.left(), rect.top(), rect.left() + tl, rect.top())

    path.closeSubpath()
    return path


# ── Cropping Utils ──────────────────────────────────────────────────────────────────────────────────────────
def img_calc_scale_factor(original_pixmap: QPixmap, scaled_pixmap: QPixmap) -> float:
    """Calculate scale factor between original and scaled pixmap.

    Args:
        original_pixmap: Original full-size pixmap
        scaled_pixmap: Scaled-down version

    Returns:
        Scale factor (scaled_size / original_size)
    """
    if original_pixmap.isNull() or scaled_pixmap.isNull():
        return 1.0

    # Determine which dimension was the limiting factor
    if (original_pixmap.width() * scaled_pixmap.height() >
        original_pixmap.height() * scaled_pixmap.width()):
        # Limited by width
        if original_pixmap.width() > 0:
            return scaled_pixmap.width() / original_pixmap.width()
    else:
        # Limited by height
        if original_pixmap.height() > 0:
            return scaled_pixmap.height() / original_pixmap.height()

    return 1.0

def img_crop_from_scaled_coords(original_pixmap: QPixmap, scaled_rect: QRectF,
                              scale_factor: float, force_square: bool = True) -> QPixmap:
    """Crop original pixmap using coordinates from scaled version.

    Args:
        original_pixmap: Original full-size pixmap
        scaled_rect: Crop rectangle in scaled coordinate system
        scale_factor: Scale factor (scaled_size / original_size)
        force_square: Force square crop dimensions

    Returns:
        Cropped pixmap from original
    """
    if original_pixmap.isNull() or scaled_rect.isNull() or scale_factor <= 0:
        return QPixmap()

    # Convert scaled coordinates back to original coordinates
    crop_x_orig = scaled_rect.x() / scale_factor
    crop_y_orig = scaled_rect.y() / scale_factor
    crop_w_orig = scaled_rect.width() / scale_factor
    crop_h_orig = scaled_rect.height() / scale_factor

    # Force square if requested
    if force_square:
        crop_h_orig = crop_w_orig

    # Create integer rect for .copy()
    crop_rect = QRect(
        round(crop_x_orig),
        round(crop_y_orig),
        round(crop_w_orig),
        round(crop_h_orig)
    )

    # Intersect with original bounds to ensure validity
    crop_rect = img_intersect_bounds(crop_rect, original_pixmap.rect())

    if crop_rect.isEmpty() or crop_rect.width() < 1 or crop_rect.height() < 1:
        return QPixmap()

    return original_pixmap.copy(crop_rect)

def img_intersect_bounds(rect: QRect, bounds: QRect) -> QRect:
    """Intersect rectangle with boundary rectangle for safe cropping.

    Args:
        rect: Rectangle to constrain
        bounds: Boundary rectangle

    Returns:
        Rectangle intersected with bounds
    """
    return rect.intersected(bounds)
