"""Section Portails clients — outils nommés et typés (`portails_*`).

Tables couvertes (cf. registry.py) :
  - agency_accesses    : accès/credentials de l'agence (chiffrés)  lecture seule (*_enc masqués)
  - brief_invitations  : invitations à remplir un brief            list/get/create/update

NB : les accès AU NIVEAU PROJET (portail client d'un projet) sont gérés dans la
section Projets : `projets_list_accesses` / `projets_get_access` (table
project_accesses_v2), ainsi que l'activation portail via `projets_update_project`
(champs portal_* exotiques via l'outil générique db_update).
"""
from __future__ import annotations

from typing import Any

from mcp.server.fastmcp import FastMCP

from .. import crud
from ..context import get_context
from ._helpers import compact


def register(mcp: FastMCP) -> None:
    # ===================== ACCÈS AGENCE (agency_accesses) — LECTURE SEULE =====================

    @mcp.tool()
    def portails_list_agency_accesses(category: str | None = None, status: str | None = None,
                                      limit: int = 100, offset: int = 0) -> dict[str, Any]:
        """Liste les accès de l'agence (table `agency_accesses`).

        LECTURE SEULE : les identifiants/mots de passe (`*_enc`) sont chiffrés en base
        et volontairement masqués/non modifiables via ce MCP.
        """
        filters: dict[str, Any] = {}
        if category:
            filters["category"] = category
        if status:
            filters["status"] = status
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "agency_accesses", filters=filters,
                              order="created_at.desc", limit=limit, offset=offset)

    @mcp.tool()
    def portails_get_agency_access(access_id: str) -> dict[str, Any]:
        """Détail d'un accès agence (sans les champs chiffrés) par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "agency_accesses", access_id)

    # ===================== INVITATIONS BRIEF (brief_invitations) — list/get/create/update ======

    @mcp.tool()
    def portails_list_brief_invitations(status: str | None = None, project_id: str | None = None,
                                        limit: int = 50, offset: int = 0) -> dict[str, Any]:
        """Liste les invitations de brief (table `brief_invitations`)."""
        filters: dict[str, Any] = {}
        if status:
            filters["status"] = status
        if project_id:
            filters["project_id"] = project_id
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "brief_invitations", filters=filters,
                              order="created_at.desc", limit=limit, offset=offset)

    @mcp.tool()
    def portails_get_brief_invitation(invitation_id: str) -> dict[str, Any]:
        """Détail d'une invitation de brief par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "brief_invitations", invitation_id)

    @mcp.tool()
    def portails_create_brief_invitation(project_id: str | None = None,
                                         company_name: str | None = None, status: str | None = None,
                                         short_code: str | None = None) -> dict[str, Any]:
        """Crée une invitation de brief. Aucun champ strictement obligatoire (token auto-généré)."""
        ctx = get_context()
        data = compact(project_id=project_id, company_name=company_name, status=status,
                       short_code=short_code)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "brief_invitations", data)

    @mcp.tool()
    def portails_update_brief_invitation(invitation_id: str, status: str | None = None,
                                         company_name: str | None = None,
                                         submitted_at: str | None = None,
                                         short_code: str | None = None,
                                         confirm: bool = False) -> dict[str, Any]:
        """Modifie une invitation de brief. confirm=true requis (sauf dry-run).

        (Pas de suppression : table en list/get/create/update uniquement.)
        """
        ctx = get_context()
        data = compact(status=status, company_name=company_name, submitted_at=submitted_at,
                       short_code=short_code)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "brief_invitations",
                              invitation_id, data, confirm=confirm)
