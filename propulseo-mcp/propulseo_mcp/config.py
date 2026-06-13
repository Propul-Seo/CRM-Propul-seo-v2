"""Chargement et validation de la configuration depuis l'environnement (.env).

Aucun secret n'est codé en dur : tout vient des variables d'environnement.
"""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel, Field, field_validator

# Charge le .env à la racine du projet MCP (parent du package), via un chemin
# ABSOLU calculé depuis ce fichier. Ainsi la config est trouvée quel que soit le
# répertoire courant utilisé par Claude Desktop/Code — pas besoin de mettre le
# secret dans la configuration JSON du client MCP.
# override=False : on ne masque pas des variables déjà définies dans l'environnement.
_PROJECT_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(dotenv_path=_PROJECT_ROOT / ".env", override=False)
load_dotenv(override=False)  # filet de sécurité : .env dans le cwd s'il existe


def _as_bool(value: str | None, default: bool) -> bool:
    """Convertit une variable d'env texte en booléen de façon tolérante."""
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on", "oui"}


class Settings(BaseModel):
    """Réglages du serveur MCP, validés au démarrage."""

    supabase_url: str = Field(..., description="URL du projet Supabase")
    service_role_key: str = Field(..., description="Clé service_role (secret)")
    schema_name: str = Field(default="public")
    dry_run: bool = Field(default=True)
    http_timeout: float = Field(default=30.0, gt=0)
    max_retries: int = Field(default=2, ge=0, le=5)

    @field_validator("supabase_url")
    @classmethod
    def _check_url(cls, v: str) -> str:
        v = v.strip().rstrip("/")
        if not v.startswith("https://"):
            raise ValueError("SUPABASE_URL doit commencer par https://")
        return v

    @property
    def rest_url(self) -> str:
        """Base de l'API REST PostgREST."""
        return f"{self.supabase_url}/rest/v1"


class ConfigError(RuntimeError):
    """Erreur de configuration (variable manquante ou invalide)."""


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Construit les réglages depuis l'environnement (mis en cache).

    Lève ConfigError avec un message clair si une variable obligatoire manque,
    pour éviter un crash cryptique au premier appel d'outil.
    """
    url = os.environ.get("SUPABASE_URL", "").strip()
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()

    missing = []
    if not url:
        missing.append("SUPABASE_URL")
    if not key:
        missing.append("SUPABASE_SERVICE_ROLE_KEY")
    if missing:
        raise ConfigError(
            "Variables d'environnement manquantes : "
            + ", ".join(missing)
            + ". Copiez .env.example en .env et renseignez-les."
        )

    try:
        return Settings(
            supabase_url=url,
            service_role_key=key,
            schema_name=os.environ.get("SUPABASE_SCHEMA", "public").strip() or "public",
            dry_run=_as_bool(os.environ.get("MCP_DRY_RUN"), default=True),
            http_timeout=float(os.environ.get("MCP_HTTP_TIMEOUT", "30") or 30),
            max_retries=int(os.environ.get("MCP_MAX_RETRIES", "2") or 2),
        )
    except (ValueError, TypeError) as exc:
        raise ConfigError(f"Configuration invalide : {exc}") from exc
