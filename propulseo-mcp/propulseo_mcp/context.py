"""Contexte partagé du serveur : réglages + client HTTP, initialisés à la demande."""
from __future__ import annotations

from dataclasses import dataclass

from .client import SupabaseRestClient
from .config import Settings, get_settings


@dataclass
class ServerContext:
    settings: Settings
    client: SupabaseRestClient


_ctx: ServerContext | None = None


def get_context() -> ServerContext:
    """Construit (une seule fois) le contexte serveur. Lève ConfigError si .env incomplet."""
    global _ctx
    if _ctx is None:
        settings = get_settings()
        _ctx = ServerContext(settings=settings, client=SupabaseRestClient(settings))
    return _ctx
