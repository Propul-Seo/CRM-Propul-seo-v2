"""Serveur MCP Propul'SEO CRM (stdio).

Expose deux familles d'outils :
  1. Outils GÉNÉRIQUES (préfixe `db_`) : CRUD + découverte sur n'importe quelle
     table connue du registre. Disponibles immédiatement sur toutes les sections.
  2. Outils NOMMÉS par section (ex. `crm_create_contact`) : ergonomiques, typés,
     ajoutés section par section.

Lancement : `python -m propulseo_mcp.server`  (ou via la config MCP de Claude).
"""
from __future__ import annotations

from typing import Any

from mcp.server.fastmcp import FastMCP

from . import crud
from .context import get_context
from .registry import REGISTRY, get_spec

mcp = FastMCP("Propul'SEO CRM")


# ===========================================================================
# OUTILS DE DÉCOUVERTE
# ===========================================================================

@mcp.tool()
def server_status() -> dict[str, Any]:
    """État du serveur MCP : mode dry-run, URL Supabase (masquée), connexion.

    À appeler en premier pour vérifier que la configuration est correcte et
    savoir si les écritures seront réelles (dry_run=false) ou simulées (true).
    """
    ctx = get_context()
    url = ctx.settings.supabase_url
    masked = url[:24] + "…" if len(url) > 24 else url
    connected = False
    error = None
    try:
        connected = ctx.client.ping()
    except Exception as exc:  # noqa: BLE001
        error = str(exc)
    return {
        "status": "ok",
        "dry_run": ctx.settings.dry_run,
        "supabase_url": masked,
        "schema": ctx.settings.schema_name,
        "connected": connected,
        "error": error,
        "tables_count": len(REGISTRY),
        "note": "dry_run=true => aucune écriture réelle (insert/update/delete simulés).",
    }


@mcp.tool()
def list_tables(section: str | None = None) -> dict[str, Any]:
    """Liste les tables pilotables, regroupées par section.

    Args:
        section: filtre optionnel (crm, projets, compta, procedures, taches,
                 comm, portails, dashboard, parametres).
    """
    out: dict[str, list[dict[str, Any]]] = {}
    for spec in REGISTRY.values():
        if section and spec.section != section:
            continue
        out.setdefault(spec.section, []).append({
            "table": spec.table,
            "label": spec.label,
            "ops": list(spec.ops),
        })
    return {"status": "ok", "sections": out}


@mcp.tool()
def describe_table(table: str) -> dict[str, Any]:
    """Décrit le schéma d'une table : colonnes, types, obligatoires, enums.

    Indispensable avant un `db_insert`/`db_update` pour connaître les colonnes
    acceptées et les valeurs d'enum autorisées.
    """
    try:
        spec = get_spec(table)
    except KeyError as exc:
        return {"status": "error", "error": str(exc).strip('"')}
    return {
        "status": "ok",
        "table": spec.table,
        "section": spec.section,
        "label": spec.label,
        "ops": list(spec.ops),
        "required_on_create": spec.required_create_columns,
        "columns": [
            {
                "name": c.name,
                "type": c.py_type,
                "pg_type": c.pg_type,
                "required_on_create": c.required_create,
                "enum": list(c.enum_values) if c.enum_values else None,
                "writable": (c.name not in {"id", "created_at", "updated_at"}) and not c.sensitive,
                "encrypted": c.sensitive,
            }
            for c in spec.columns
        ],
    }


# ===========================================================================
# OUTILS CRUD GÉNÉRIQUES
# ===========================================================================

@mcp.tool()
def db_select(table: str, filters: dict[str, Any] | None = None,
              order: str | None = None, limit: int = 50, offset: int = 0,
              columns: str | None = None) -> dict[str, Any]:
    """Liste des lignes d'une table avec filtres, tri et pagination.

    Args:
        table: nom exact de la table (voir `list_tables`).
        filters: {colonne: valeur}. Égalité par défaut. Opérateurs PostgREST
            possibles en préfixe : "gte.100", "ilike.*acme*", "in.(a,b)",
            "is.null". Clé logique possible : {"or": "(name.ilike.*x*,email.ilike.*x*)"}.
        order: ex. "created_at.desc" ou "name.asc".
        limit: 1..1000 (défaut 50). offset: pagination.
        columns: liste CSV de colonnes ; par défaut toutes (hors colonnes chiffrées).
    """
    ctx = get_context()
    return crud.safe_call(crud.op_list, ctx.client, table, filters=filters,
                          order=order, limit=limit, offset=offset, columns=columns)


@mcp.tool()
def db_get(table: str, id: str, columns: str | None = None) -> dict[str, Any]:
    """Récupère une ligne unique par son id (uuid)."""
    ctx = get_context()
    return crud.safe_call(crud.op_get, ctx.client, table, id, columns=columns)


@mcp.tool()
def db_insert(table: str, data: dict[str, Any]) -> dict[str, Any]:
    """Crée une ligne. Respecte MCP_DRY_RUN (simulation si actif).

    Utilisez `describe_table` pour connaître les colonnes obligatoires et enums.
    `data` = {colonne: valeur}. Les colonnes gérées (id, created_at, updated_at)
    et chiffrées sont refusées.
    """
    ctx = get_context()
    return crud.safe_call(crud.op_create, ctx.client, ctx.settings, table, data)


@mcp.tool()
def db_update(table: str, id: str, data: dict[str, Any], confirm: bool = False) -> dict[str, Any]:
    """Modifie une ligne par id, avec garde-fous.

    Sécurité (même logique que db_delete) :
      - sans `confirm=true` : renvoie le **diff avant/après** (status="confirm_required")
        sans rien écrire ;
      - avec `confirm=true` : applique la modification — SAUF si MCP_DRY_RUN est actif,
        auquel cas l'opération reste simulée (status="dry_run").
    `data` = {colonne: valeur} ; seules les colonnes fournies sont modifiées.
    """
    ctx = get_context()
    return crud.safe_call(crud.op_update, ctx.client, ctx.settings, table, id, data, confirm=confirm)


@mcp.tool()
def db_delete(table: str, id: str, confirm: bool = False) -> dict[str, Any]:
    """Supprime une ligne par id.

    Sécurité : sans `confirm=true`, renvoie d'abord un résumé de la ligne qui
    SERAIT supprimée (status="confirm_required") sans rien supprimer. Avec
    `confirm=true`, supprime réellement — sauf si MCP_DRY_RUN est actif.
    """
    ctx = get_context()
    return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, table, id, confirm=confirm)


# ===========================================================================
# OUTILS NOMMÉS PAR SECTION
# ===========================================================================
from .sections import register_all_sections  # noqa: E402

register_all_sections(mcp)


def main() -> None:
    """Point d'entrée : démarre le serveur MCP en transport stdio."""
    import logging
    # Logs MCP/HTTP propres : on garde avertissements et erreurs, on coupe le INFO
    # (sinon chaque requête PostgREST est journalisée sur stderr → bruit côté client).
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("mcp").setLevel(logging.WARNING)
    mcp.run()


if __name__ == "__main__":
    main()
