"""Enregistrement des outils MCP nommés, regroupés par section du CRM.

Chaque module de section expose `register(mcp)`. On les branche ici.
Les sections non encore câblées en outils nommés restent pilotables via les
outils génériques `db_*` (toutes les tables sont dans le registre).
"""
from __future__ import annotations

from mcp.server.fastmcp import FastMCP

from . import crm, projets


def register_all_sections(mcp: FastMCP) -> None:
    crm.register(mcp)
    projets.register(mcp)
    # Sections suivantes (à brancher au fil de l'eau) :
    # comptabilite.register(mcp)
    # procedures.register(mcp)
    # taches.register(mcp)
    # communication.register(mcp)
    # portails.register(mcp)
    # parametres.register(mcp)
