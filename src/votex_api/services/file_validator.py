"""File upload validation, magic byte checking, and EXIF metadata stripping."""

import hashlib
import io
import os
import re
import secrets
from pathlib import Path
from typing import List, Tuple
from fastapi import HTTPException, UploadFile
from PIL import Image
from votex_api.config import get_settings

settings = get_settings()

# Allowed extensions and standard MIME types
ALLOWED_EXTENSIONS = {
    ".wav": "audio/wav",
    ".mp3": "audio/mpeg",
    ".m4a": "audio/mp4",
    ".ogg": "audio/ogg",
    ".flac": "audio/flac",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".txt": "text/plain",
    ".md": "text/markdown",
}

DISALLOWED_EXTENSIONS = {
    ".svg", ".html", ".htm", ".exe", ".sh", ".bat", ".cmd", ".vbs",
    ".py", ".js", ".php", ".zip", ".tar", ".gz", ".7z", ".rar",
}


def sanitize_filename(filename: str) -> str:
    """Sanitize display filename by stripping path characters and control chars."""
    basename = os.path.basename(filename)
    safe = re.sub(r"[^A-Za-z0-9_.\- ]+", "_", basename).strip()
    return safe[:100] if safe else "file"


def verify_magic_bytes(data: bytes, ext: str) -> str:
    """Verify file magic bytes against the claimed extension. Returns canonical MIME type."""
    if len(data) < 4:
        raise HTTPException(status_code=422, detail="File too small or empty")

    header = data[:32]

    if ext == ".pdf":
        if header.startswith(b"%PDF"):
            return "application/pdf"
    elif ext == ".png":
        if header.startswith(b"\x89PNG\r\n\x1a\n"):
            return "image/png"
    elif ext in (".jpg", ".jpeg"):
        if header.startswith(b"\xff\xd8\xff"):
            return "image/jpeg"
    elif ext == ".webp":
        if header.startswith(b"RIFF") and b"WEBP" in header[:16]:
            return "image/webp"
    elif ext == ".wav":
        if header.startswith(b"RIFF") and b"WAVE" in header[:16]:
            return "audio/wav"
    elif ext == ".flac":
        if header.startswith(b"fLaC"):
            return "audio/flac"
    elif ext == ".ogg":
        if header.startswith(b"OggS"):
            return "audio/ogg"
    elif ext == ".mp3":
        if header.startswith(b"ID3") or header[:2] in (b"\xff\xfb", b"\xff\xf3", b"\xff\xf2"):
            return "audio/mpeg"
    elif ext == ".m4a":
        if b"ftyp" in header[:16]:
            return "audio/mp4"
    elif ext in (".txt", ".md"):
        # Verify valid UTF-8
        try:
            data[:4096].decode("utf-8")
            return "text/plain" if ext == ".txt" else "text/markdown"
        except UnicodeDecodeError:
            raise HTTPException(status_code=422, detail="Text file must be valid UTF-8 encoded")

    raise HTTPException(status_code=422, detail=f"File content does not match extension '{ext}'")


def strip_image_exif(data: bytes, ext: str) -> bytes:
    """Strips EXIF and location metadata from raster images."""
    if ext not in (".png", ".jpg", ".jpeg", ".webp"):
        return data

    try:
        with Image.open(io.BytesIO(data)) as img:
            out_buf = io.BytesIO()
            fmt = "JPEG" if ext in (".jpg", ".jpeg") else ("PNG" if ext == ".png" else "WEBP")
            # Re-saving creates an image without original EXIF tags
            img.save(out_buf, format=fmt)
            return out_buf.getvalue()
    except Exception:
        return data


async def validate_and_save_upload(
    upload_file: UploadFile,
    target_dir: Path,
) -> Tuple[str, str, str, int, str]:
    """
    Validates single uploaded file and writes it to target_dir.
    Returns: (original_name, stored_name, mime_type, size_bytes, sha256_hash)
    """
    raw_name = upload_file.filename or "upload"
    original_name = sanitize_filename(raw_name)
    ext = os.path.splitext(original_name)[1].lower()

    if ext in DISALLOWED_EXTENSIONS:
        raise HTTPException(status_code=422, detail=f"File extension '{ext}' is forbidden for security")

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=422, detail=f"Unsupported file format '{ext}'")

    data = await upload_file.read()
    size_bytes = len(data)

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if size_bytes > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File '{original_name}' exceeds maximum limit of {settings.MAX_FILE_SIZE_MB} MB",
        )

    mime_type = verify_magic_bytes(data, ext)

    # Strip image EXIF if applicable
    clean_data = strip_image_exif(data, ext)
    sha256 = hashlib.sha256(clean_data).hexdigest()

    # Generate safe randomized filename in sandbox
    stored_name = f"{secrets.token_hex(8)}_{original_name}"
    target_path = target_dir / stored_name

    target_dir.mkdir(parents=True, exist_ok=True)
    target_path.write_bytes(clean_data)

    return original_name, stored_name, mime_type, len(clean_data), sha256
