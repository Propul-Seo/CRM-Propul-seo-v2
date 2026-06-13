"""Section CRM — outils nommés et typés (contacts, clients, leads, activités).

Implémentation de référence : les autres sections suivront le même patron.
Chaque outil délègue à la couche `crud` (validation + dry-run + confirmation).
"""
from __future__ import annotations

from typing import Any, Literal

from mcp.server.fastmcp import FastMCP

from .. import crud
from ..context import get_context

# Enums réels de la base (cf. schemas.ENUM_VALUES).
ContactStatus = Literal[
    "prospect", "proposition_envoyee", "meeting_booke", "offre_envoyee",
    "en_attente", "signe", "presentation_envoyee", "prospects", "signes",
    "en_negociation",
]
ActivityType = Literal["call", "email", "meeting", "note", "task"]
ActivityStatus = Literal["scheduled", "completed", "cancelled"]


def _compact(**kwargs: Any) -> dict[str, Any]:
    """Ne conserve que les arguments réellement fournis (non None)."""
    return {k: v for k, v in kwargs.items() if v is not None}


def register(mcp: FastMCP) -> None:
    # ===================== CONTACTS =====================

    @mcp.tool()
    def crm_list_contacts(search: str | None = None, status: ContactStatus | None = None,
                          assigned_to: str | None = None, limit: int = 50,
                          offset: int = 0) -> dict[str, Any]:
        """Liste les contacts du CRM (table `contacts`).

        Args:
            search: recherche texte sur nom / email / société (insensible à la casse).
            status: filtre sur le statut pipeline.
            assigned_to: uuid de l'utilisateur assigné.
            limit/offset: pagination.
        """
        filters: dict[str, Any] = {}
        if status:
            filters["status"] = status
        if assigned_to:
            filters["assigned_to"] = assigned_to
        if search:
            term = f"*{search}*"
            filters["or"] = f"(name.ilike.{term},email.ilike.{term},company.ilike.{term})"
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "contacts", filters=filters,
                              order="created_at.desc", limit=limit, offset=offset)

    @mcp.tool()
    def crm_get_contact(contact_id: str) -> dict[str, Any]:
        """Détail d'un contact par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "contacts", contact_id)

    @mcp.tool()
    def crm_create_contact(name: str, email: str, phone: str | None = None,
                           company: str | None = None, sector: str | None = None,
                           status: ContactStatus = "prospect", source: str | None = None,
                           website: str | None = None, lead_score: int | None = None,
                           project_price: float | None = None, tags: list[str] | None = None,
                           notes: list[str] | None = None,
                           assigned_to: str | None = None) -> dict[str, Any]:
        """Crée un contact. Obligatoires : name, email. (Respecte le dry-run.)"""
        ctx = get_context()
        data = _compact(name=name, email=email, phone=phone, company=company,
                        sector=sector, status=status, source=source, website=website,
                        lead_score=lead_score, project_price=project_price, tags=tags,
                        notes=notes, assigned_to=assigned_to)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "contacts", data)

    @mcp.tool()
    def crm_update_contact(contact_id: str, name: str | None = None, email: str | None = None,
                           phone: str | None = None, company: str | None = None,
                           sector: str | None = None, status: ContactStatus | None = None,
                           source: str | None = None, website: str | None = None,
                           lead_score: int | None = None, project_price: float | None = None,
                           tags: list[str] | None = None, notes: list[str] | None = None,
                           assigned_to: str | None = None,
                           next_activity_date: str | None = None,
                           confirm: bool = False) -> dict[str, Any]:
        """Modifie un contact (seuls les champs fournis sont mis à jour).

        Sans confirm=true : renvoie le diff avant/après (confirm_required) sans écrire.
        Avec confirm=true : applique — sauf si MCP_DRY_RUN actif (simulation).
        """
        ctx = get_context()
        data = _compact(name=name, email=email, phone=phone, company=company, sector=sector,
                        status=status, source=source, website=website, lead_score=lead_score,
                        project_price=project_price, tags=tags, notes=notes,
                        assigned_to=assigned_to, next_activity_date=next_activity_date)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "contacts",
                              contact_id, data, confirm=confirm)

    @mcp.tool()
    def crm_delete_contact(contact_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime un contact. Renvoie d'abord un résumé ; exige confirm=true pour exécuter."""
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "contacts",
                              contact_id, confirm=confirm)

    # ===================== CLIENTS =====================

    @mcp.tool()
    def crm_list_clients(search: str | None = None, status: ContactStatus | None = None,
                         limit: int = 50, offset: int = 0) -> dict[str, Any]:
        """Liste les clients (table `clients`)."""
        filters: dict[str, Any] = {}
        if status:
            filters["status"] = status
        if search:
            term = f"*{search}*"
            filters["or"] = f"(name.ilike.{term},email.ilike.{term})"
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "clients", filters=filters,
                              order="created_at.desc", limit=limit, offset=offset)

    @mcp.tool()
    def crm_get_client(client_id: str) -> dict[str, Any]:
        """Détail d'un client par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "clients", client_id)

    @mcp.tool()
    def crm_create_client(user_id: str, name: str, email: str, phone: str, address: str,
                          sector: str, status: ContactStatus = "prospect",
                          total_revenue: float | None = None,
                          assigned_to: str | None = None) -> dict[str, Any]:
        """Crée un client. Obligatoires : user_id, name, email, phone, address, sector."""
        ctx = get_context()
        data = _compact(user_id=user_id, name=name, email=email, phone=phone, address=address,
                        sector=sector, status=status, total_revenue=total_revenue,
                        assigned_to=assigned_to)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "clients", data)

    @mcp.tool()
    def crm_update_client(client_id: str, name: str | None = None, email: str | None = None,
                          phone: str | None = None, address: str | None = None,
                          sector: str | None = None, status: ContactStatus | None = None,
                          total_revenue: float | None = None,
                          assigned_to: str | None = None,
                          confirm: bool = False) -> dict[str, Any]:
        """Modifie un client (champs fournis seulement).

        Sans confirm=true : renvoie le diff avant/après (confirm_required) sans écrire.
        Avec confirm=true : applique — sauf si MCP_DRY_RUN actif (simulation).
        """
        ctx = get_context()
        data = _compact(name=name, email=email, phone=phone, address=address, sector=sector,
                        status=status, total_revenue=total_revenue, assigned_to=assigned_to)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "clients",
                              client_id, data, confirm=confirm)

    @mcp.tool()
    def crm_delete_client(client_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime un client. Exige confirm=true pour exécuter."""
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "clients",
                              client_id, confirm=confirm)

    # ===================== LEADS (CRM ERP) =====================

    @mcp.tool()
    def crm_list_leads(search: str | None = None, status: str | None = None,
                       limit: int = 50, offset: int = 0) -> dict[str, Any]:
        """Liste les leads du CRM ERP (table `crmerp_leads`)."""
        filters: dict[str, Any] = {}
        if status:
            filters["status"] = status
        if search:
            term = f"*{search}*"
            filters["or"] = f"(company_name.ilike.{term},contact_name.ilike.{term},email.ilike.{term})"
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "crmerp_leads", filters=filters,
                              order="created_at.desc", limit=limit, offset=offset)

    @mcp.tool()
    def crm_get_lead(lead_id: str) -> dict[str, Any]:
        """Détail d'un lead CRM ERP par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "crmerp_leads", lead_id)

    @mcp.tool()
    def crm_create_lead(company_name: str | None = None, contact_name: str | None = None,
                        email: str | None = None, phone: str | None = None,
                        source: str | None = None, status: str = "new",
                        assignee_id: str | None = None,
                        notes: str | None = None) -> dict[str, Any]:
        """Crée un lead CRM ERP (table `crmerp_leads`). `status` libre (défaut 'new')."""
        ctx = get_context()
        data = _compact(company_name=company_name, contact_name=contact_name, email=email,
                        phone=phone, source=source, status=status, assignee_id=assignee_id,
                        notes=notes)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "crmerp_leads", data)

    @mcp.tool()
    def crm_update_lead(lead_id: str, company_name: str | None = None,
                        contact_name: str | None = None, email: str | None = None,
                        phone: str | None = None, source: str | None = None,
                        status: str | None = None, assignee_id: str | None = None,
                        notes: str | None = None, confirm: bool = False) -> dict[str, Any]:
        """Modifie un lead CRM ERP (champs fournis seulement).

        Sans confirm=true : renvoie le diff avant/après (confirm_required) sans écrire.
        Avec confirm=true : applique — sauf si MCP_DRY_RUN actif (simulation).
        """
        ctx = get_context()
        data = _compact(company_name=company_name, contact_name=contact_name, email=email,
                        phone=phone, source=source, status=status, assignee_id=assignee_id,
                        notes=notes)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "crmerp_leads",
                              lead_id, data, confirm=confirm)

    @mcp.tool()
    def crm_delete_lead(lead_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime un lead CRM ERP. Exige confirm=true."""
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "crmerp_leads",
                              lead_id, confirm=confirm)

    # ===================== ACTIVITÉS DE CONTACT =====================

    @mcp.tool()
    def crm_list_contact_activities(contact_id: str, limit: int = 50,
                                    offset: int = 0) -> dict[str, Any]:
        """Liste les activités d'un contact (appels, emails, rdv...) par contact_id."""
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "contact_activities",
                              filters={"contact_id": contact_id},
                              order="activity_date.desc", limit=limit, offset=offset)

    @mcp.tool()
    def crm_log_contact_activity(contact_id: str, type: ActivityType, title: str,
                                 activity_date: str, description: str | None = None,
                                 status: ActivityStatus = "completed",
                                 duration_minutes: int | None = None,
                                 outcome: str | None = None,
                                 follow_up_required: bool | None = None,
                                 next_action: str | None = None,
                                 user_id: str | None = None) -> dict[str, Any]:
        """Journalise une activité sur un contact.

        Obligatoires : contact_id, type (call/email/meeting/note/task), title,
        activity_date (ISO 8601, ex. "2026-06-13T14:30:00Z").
        """
        ctx = get_context()
        data = _compact(contact_id=contact_id, type=type, title=title,
                        activity_date=activity_date, description=description, status=status,
                        duration_minutes=duration_minutes, outcome=outcome,
                        follow_up_required=follow_up_required, next_action=next_action,
                        user_id=user_id)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "contact_activities", data)
