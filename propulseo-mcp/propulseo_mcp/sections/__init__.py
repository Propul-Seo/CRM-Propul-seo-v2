"""Enregistrement des outils MCP nommés, regroupés par section du CRM.

Chaque module de section expose `register(mcp)`. On les branche ici.
Toutes les tables du registre restent aussi pilotables via les outils génériques
`db_*` (db_select / db_get / db_insert / db_update / db_delete + describe_table).
"""
from __future__ import annotations

from mcp.server.fastmcp import FastMCP

from . import (
    comptabilite,
    communication,
    crm,
    dashboard,
    parametres,
    portails,
    procedures,
    projets,
    taches,
)


def register_all_sections(mcp: FastMCP) -> None:
    crm.register(mcp)
    projets.register(mcp)
    comptabilite.register(mcp)
    procedures.register(mcp)
    taches.register(mcp)
    communication.register(mcp)
    portails.register(mcp)
    parametres.register(mcp)
    dashboard.register(mcp)
