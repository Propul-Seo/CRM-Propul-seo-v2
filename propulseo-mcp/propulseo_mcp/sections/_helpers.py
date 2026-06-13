"""Petits utilitaires partagés par les sections."""
from __future__ import annotations

from typing import Any


def compact(**kwargs: Any) -> dict[str, Any]:
    """Ne conserve que les arguments réellement fournis (non None)."""
    return {k: v for k, v in kwargs.items() if v is not None}
