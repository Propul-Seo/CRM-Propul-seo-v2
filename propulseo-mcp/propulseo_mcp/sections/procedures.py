"""Section Procédures — outils nommés et typés (`procedures_*`).

Tables couvertes (cf. registry.py) :
  - procedures           : procédures internes (contenu jsonb)   CRUD complet
  - procedure_categories : catégories                            CRUD complet
  - procedure_revisions  : historique des révisions              list/get/create

Le champ `content` est du JSON (objet de l'éditeur riche) ; `content_text` en est
la version texte indexable.
"""
from __future__ import annotations

from typing import Any

from mcp.server.fastmcp import FastMCP

from .. import crud
from ..context import get_context
from ._helpers import compact


def register(mcp: FastMCP) -> None:
    # ===================== PROCÉDURES (procedures) =====================

    @mcp.tool()
    def procedures_list(search: str | None = None, category_id: str | None = None,
                        is_pinned: bool | None = None, is_archived: bool | None = None,
                        limit: int = 50, offset: int = 0) -> dict[str, Any]:
        """Liste les procédures (table `procedures`).

        Args:
            search: recherche texte sur le titre / résumé.
            category_id: uuid de catégorie.
            is_pinned / is_archived: filtres booléens.
        """
        filters: dict[str, Any] = {}
        if category_id:
            filters["category_id"] = category_id
        if is_pinned is not None:
            filters["is_pinned"] = is_pinned
        if is_archived is not None:
            filters["is_archived"] = is_archived
        if search:
            term = f"*{search}*"
            filters["or"] = f"(title.ilike.{term},summary.ilike.{term})"
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "procedures", filters=filters,
                              order="updated_at.desc", limit=limit, offset=offset)

    @mcp.tool()
    def procedures_get(procedure_id: str) -> dict[str, Any]:
        """Détail d'une procédure par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "procedures", procedure_id)

    @mcp.tool()
    def procedures_create(title: str, slug: str, category_id: str | None = None,
                          tags: list[str] | None = None, content: dict | None = None,
                          content_text: str | None = None, summary: str | None = None,
                          author_id: str | None = None, is_pinned: bool | None = None,
                          is_archived: bool | None = None) -> dict[str, Any]:
        """Crée une procédure. Obligatoires : title, slug.

        `content` = objet JSON (document éditeur). `tags` = liste de mots-clés.
        """
        ctx = get_context()
        data = compact(title=title, slug=slug, category_id=category_id, tags=tags,
                       content=content, content_text=content_text, summary=summary,
                       author_id=author_id, is_pinned=is_pinned, is_archived=is_archived)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "procedures", data)

    @mcp.tool()
    def procedures_update(procedure_id: str, title: str | None = None, slug: str | None = None,
                          category_id: str | None = None, tags: list[str] | None = None,
                          content: dict | None = None, content_text: str | None = None,
                          summary: str | None = None, updated_by: str | None = None,
                          is_pinned: bool | None = None, is_archived: bool | None = None,
                          confirm: bool = False) -> dict[str, Any]:
        """Modifie une procédure. Sans confirm=true : diff ; avec : applique (sauf dry-run)."""
        ctx = get_context()
        data = compact(title=title, slug=slug, category_id=category_id, tags=tags,
                       content=content, content_text=content_text, summary=summary,
                       updated_by=updated_by, is_pinned=is_pinned, is_archived=is_archived)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "procedures",
                              procedure_id, data, confirm=confirm)

    @mcp.tool()
    def procedures_delete(procedure_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime une procédure. Exige confirm=true.

        Astuce : pour la masquer sans la détruire, préférez procedures_update(is_archived=true).
        """
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "procedures",
                              procedure_id, confirm=confirm)

    # ===================== CATÉGORIES (procedure_categories) =====================

    @mcp.tool()
    def procedures_list_categories(limit: int = 50, offset: int = 0) -> dict[str, Any]:
        """Liste les catégories de procédures (table `procedure_categories`)."""
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "procedure_categories",
                              order="sort_order.asc", limit=limit, offset=offset)

    @mcp.tool()
    def procedures_get_category(category_id: str) -> dict[str, Any]:
        """Détail d'une catégorie de procédure par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "procedure_categories", category_id)

    @mcp.tool()
    def procedures_create_category(name: str, slug: str, icon: str | None = None,
                                   color: str | None = None,
                                   sort_order: int | None = None) -> dict[str, Any]:
        """Crée une catégorie de procédure. Obligatoires : name, slug."""
        ctx = get_context()
        data = compact(name=name, slug=slug, icon=icon, color=color, sort_order=sort_order)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "procedure_categories", data)

    @mcp.tool()
    def procedures_update_category(category_id: str, name: str | None = None, slug: str | None = None,
                                   icon: str | None = None, color: str | None = None,
                                   sort_order: int | None = None,
                                   confirm: bool = False) -> dict[str, Any]:
        """Modifie une catégorie. confirm=true requis (sauf dry-run)."""
        ctx = get_context()
        data = compact(name=name, slug=slug, icon=icon, color=color, sort_order=sort_order)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "procedure_categories",
                              category_id, data, confirm=confirm)

    @mcp.tool()
    def procedures_delete_category(category_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime une catégorie de procédure. Exige confirm=true."""
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "procedure_categories",
                              category_id, confirm=confirm)

    # ===================== RÉVISIONS (procedure_revisions) — list/get/create =====================

    @mcp.tool()
    def procedures_list_revisions(procedure_id: str, limit: int = 50,
                                  offset: int = 0) -> dict[str, Any]:
        """Liste l'historique des révisions d'une procédure (table `procedure_revisions`)."""
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "procedure_revisions",
                              filters={"procedure_id": procedure_id}, order="edited_at.desc",
                              limit=limit, offset=offset)

    @mcp.tool()
    def procedures_get_revision(revision_id: str) -> dict[str, Any]:
        """Détail d'une révision par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "procedure_revisions", revision_id)

    @mcp.tool()
    def procedures_create_revision(procedure_id: str, title: str, content: dict,
                                   content_text: str | None = None, summary: str | None = None,
                                   change_note: str | None = None,
                                   edited_by: str | None = None) -> dict[str, Any]:
        """Crée une révision (instantané) d'une procédure. Obligatoires : procedure_id, title, content."""
        ctx = get_context()
        data = compact(procedure_id=procedure_id, title=title, content=content,
                       content_text=content_text, summary=summary, change_note=change_note,
                       edited_by=edited_by)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "procedure_revisions", data)
