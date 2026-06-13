"""Section Projets — outils nommés et typés (`projets_*`).

Tables couvertes (cf. registry.py) :
  - projects_v2            : projets (actifs + terminés via is_archived)   CRUD complet
  - checklist_items_v2     : items de checklist                            CRUD complet
  - project_invoices_v2    : factures de projet                            CRUD complet
  - project_follow_ups_v2  : suivis / relances                             CRUD complet
  - project_briefs_v2      : briefs                                        CRUD complet
  - project_contacts       : liaison projet<->contact                      CRUD complet
  - project_activities_v2  : fil d'activité                                list/get/create/delete
  - project_documents_v2   : métadonnées de documents                      list/get/create/delete
  - project_accesses_v2    : accès (identifiants chiffrés)                 lecture seule (*_enc masqués)
  - archived_projects      : archive annuelle des projets terminés         lecture seule

Toutes les écritures passent par op_create/op_update/op_delete : le dry-run global,
le diff + confirm=true (update/delete) s'appliquent automatiquement.
"""
from __future__ import annotations

from typing import Any, Literal

from mcp.server.fastmcp import FastMCP

from .. import crud
from ..context import get_context
from ._helpers import compact

# Enum réel (project_contact_role) — cf. schemas.ENUM_VALUES.
ProjectContactRole = Literal["primary", "decision_maker", "technical", "billing", "other"]

# NB : projects_v2.status / priority sont des colonnes TEXT (pas des enums en base).
# Valeurs usuelles documentées dans les docstrings ; on accepte une chaîne libre.


def register(mcp: FastMCP) -> None:
    # ===================== PROJETS (projects_v2) =====================

    @mcp.tool()
    def projets_list_projects(search: str | None = None, status: str | None = None,
                              client_id: str | None = None, assigned_to: str | None = None,
                              archived: bool | None = None, limit: int = 50,
                              offset: int = 0) -> dict[str, Any]:
        """Liste les projets (table `projects_v2`).

        Args:
            search: recherche texte sur le nom du projet / nom du client.
            status: filtre statut (libre ; usuels : planning, in_progress, review, completed, on_hold).
            client_id: uuid du client.
            assigned_to: uuid du responsable.
            archived: False = projets ACTIFS, True = projets TERMINÉS/archivés, None = tous.
            limit/offset: pagination.
        """
        filters: dict[str, Any] = {}
        if status:
            filters["status"] = status
        if client_id:
            filters["client_id"] = client_id
        if assigned_to:
            filters["assigned_to"] = assigned_to
        if archived is not None:
            filters["is_archived"] = archived
        if search:
            term = f"*{search}*"
            filters["or"] = f"(name.ilike.{term},client_name.ilike.{term})"
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "projects_v2", filters=filters,
                              order="created_at.desc", limit=limit, offset=offset)

    @mcp.tool()
    def projets_get_project(project_id: str) -> dict[str, Any]:
        """Détail d'un projet par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "projects_v2", project_id)

    @mcp.tool()
    def projets_create_project(name: str, client_id: str | None = None,
                               client_name: str | None = None, description: str | None = None,
                               status: str | None = None, priority: str | None = None,
                               assigned_to: str | None = None, assigned_name: str | None = None,
                               start_date: str | None = None, end_date: str | None = None,
                               budget: float | None = None, progress: int | None = None,
                               category: str | None = None, presta_type: list[str] | None = None,
                               comm_status: str | None = None, erp_status: str | None = None,
                               next_action_label: str | None = None,
                               next_action_due: str | None = None) -> dict[str, Any]:
        """Crée un projet (table `projects_v2`). Seul `name` est obligatoire.

        status usuels : planning, in_progress, review, completed, on_hold.
        priority usuels : low, medium, high, urgent. Dates au format ISO (YYYY-MM-DD).
        """
        ctx = get_context()
        data = compact(name=name, client_id=client_id, client_name=client_name,
                       description=description, status=status, priority=priority,
                       assigned_to=assigned_to, assigned_name=assigned_name,
                       start_date=start_date, end_date=end_date, budget=budget,
                       progress=progress, category=category, presta_type=presta_type,
                       comm_status=comm_status, erp_status=erp_status,
                       next_action_label=next_action_label, next_action_due=next_action_due)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "projects_v2", data)

    @mcp.tool()
    def projets_update_project(project_id: str, name: str | None = None,
                               client_id: str | None = None, client_name: str | None = None,
                               description: str | None = None, status: str | None = None,
                               priority: str | None = None, assigned_to: str | None = None,
                               assigned_name: str | None = None, start_date: str | None = None,
                               end_date: str | None = None, budget: float | None = None,
                               progress: int | None = None, category: str | None = None,
                               presta_type: list[str] | None = None, comm_status: str | None = None,
                               erp_status: str | None = None, next_action_label: str | None = None,
                               next_action_due: str | None = None, completed_at: str | None = None,
                               is_archived: bool | None = None,
                               confirm: bool = False) -> dict[str, Any]:
        """Modifie un projet (champs fournis seulement).

        Pour clôturer/archiver : is_archived=true (+ completed_at).
        Champs « portail » avancés (portal_*, siret, company_data...) : passer par db_update.
        Sans confirm=true : renvoie le diff. Avec confirm=true : applique (sauf dry-run).
        """
        ctx = get_context()
        data = compact(name=name, client_id=client_id, client_name=client_name,
                       description=description, status=status, priority=priority,
                       assigned_to=assigned_to, assigned_name=assigned_name,
                       start_date=start_date, end_date=end_date, budget=budget,
                       progress=progress, category=category, presta_type=presta_type,
                       comm_status=comm_status, erp_status=erp_status,
                       next_action_label=next_action_label, next_action_due=next_action_due,
                       completed_at=completed_at, is_archived=is_archived)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "projects_v2",
                              project_id, data, confirm=confirm)

    @mcp.tool()
    def projets_delete_project(project_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime un projet. Renvoie d'abord un résumé ; exige confirm=true.

        Astuce : pour « terminer » un projet sans le détruire, préférez
        projets_update_project(is_archived=true).
        """
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "projects_v2",
                              project_id, confirm=confirm)

    # ===================== CHECKLIST (checklist_items_v2) =====================

    @mcp.tool()
    def projets_list_checklist_items(project_id: str, status: str | None = None,
                                     phase: str | None = None, limit: int = 100,
                                     offset: int = 0) -> dict[str, Any]:
        """Liste les items de checklist d'un projet (table `checklist_items_v2`)."""
        filters: dict[str, Any] = {"project_id": project_id}
        if status:
            filters["status"] = status
        if phase:
            filters["phase"] = phase
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "checklist_items_v2", filters=filters,
                              order="sort_order.asc", limit=limit, offset=offset)

    @mcp.tool()
    def projets_get_checklist_item(item_id: str) -> dict[str, Any]:
        """Détail d'un item de checklist par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "checklist_items_v2", item_id)

    @mcp.tool()
    def projets_create_checklist_item(project_id: str, title: str, description: str | None = None,
                                      phase: str | None = None, status: str | None = None,
                                      priority: str | None = None, assigned_to: str | None = None,
                                      assigned_name: str | None = None, due_date: str | None = None,
                                      parent_task_id: str | None = None,
                                      sort_order: int | None = None) -> dict[str, Any]:
        """Crée un item de checklist. Obligatoires : project_id, title."""
        ctx = get_context()
        data = compact(project_id=project_id, title=title, description=description, phase=phase,
                       status=status, priority=priority, assigned_to=assigned_to,
                       assigned_name=assigned_name, due_date=due_date,
                       parent_task_id=parent_task_id, sort_order=sort_order)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "checklist_items_v2", data)

    @mcp.tool()
    def projets_update_checklist_item(item_id: str, title: str | None = None,
                                      description: str | None = None, phase: str | None = None,
                                      status: str | None = None, priority: str | None = None,
                                      assigned_to: str | None = None, assigned_name: str | None = None,
                                      due_date: str | None = None, sort_order: int | None = None,
                                      confirm: bool = False) -> dict[str, Any]:
        """Modifie un item de checklist. Sans confirm=true : diff ; avec : applique (sauf dry-run)."""
        ctx = get_context()
        data = compact(title=title, description=description, phase=phase, status=status,
                       priority=priority, assigned_to=assigned_to, assigned_name=assigned_name,
                       due_date=due_date, sort_order=sort_order)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "checklist_items_v2",
                              item_id, data, confirm=confirm)

    @mcp.tool()
    def projets_delete_checklist_item(item_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime un item de checklist. Exige confirm=true."""
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "checklist_items_v2",
                              item_id, confirm=confirm)

    # ===================== FACTURES (project_invoices_v2) =====================

    @mcp.tool()
    def projets_list_invoices(project_id: str, status: str | None = None,
                              limit: int = 100, offset: int = 0) -> dict[str, Any]:
        """Liste les factures d'un projet (table `project_invoices_v2`)."""
        filters: dict[str, Any] = {"project_id": project_id}
        if status:
            filters["status"] = status
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "project_invoices_v2", filters=filters,
                              order="date.desc", limit=limit, offset=offset)

    @mcp.tool()
    def projets_get_invoice(invoice_id: str) -> dict[str, Any]:
        """Détail d'une facture de projet par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "project_invoices_v2", invoice_id)

    @mcp.tool()
    def projets_create_invoice(project_id: str, label: str, amount: float | None = None,
                               status: str | None = None, date: str | None = None,
                               due_date: str | None = None, notes: str | None = None) -> dict[str, Any]:
        """Crée une facture de projet. Obligatoires : project_id, label.

        status usuels : draft, sent, paid, overdue, cancelled. Montant en euros.
        """
        ctx = get_context()
        data = compact(project_id=project_id, label=label, amount=amount, status=status,
                       date=date, due_date=due_date, notes=notes)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "project_invoices_v2", data)

    @mcp.tool()
    def projets_update_invoice(invoice_id: str, label: str | None = None, amount: float | None = None,
                               status: str | None = None, date: str | None = None,
                               due_date: str | None = None, notes: str | None = None,
                               confirm: bool = False) -> dict[str, Any]:
        """Modifie une facture de projet. Sans confirm=true : diff ; avec : applique (sauf dry-run)."""
        ctx = get_context()
        data = compact(label=label, amount=amount, status=status, date=date,
                       due_date=due_date, notes=notes)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "project_invoices_v2",
                              invoice_id, data, confirm=confirm)

    @mcp.tool()
    def projets_delete_invoice(invoice_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime une facture de projet. Exige confirm=true."""
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "project_invoices_v2",
                              invoice_id, confirm=confirm)

    # ===================== SUIVIS / RELANCES (project_follow_ups_v2) =====================

    @mcp.tool()
    def projets_list_follow_ups(project_id: str, limit: int = 100, offset: int = 0) -> dict[str, Any]:
        """Liste les suivis/relances d'un projet (table `project_follow_ups_v2`)."""
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "project_follow_ups_v2",
                              filters={"project_id": project_id}, order="date.desc",
                              limit=limit, offset=offset)

    @mcp.tool()
    def projets_get_follow_up(follow_up_id: str) -> dict[str, Any]:
        """Détail d'un suivi de projet par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "project_follow_ups_v2", follow_up_id)

    @mcp.tool()
    def projets_create_follow_up(project_id: str, summary: str, type: str | None = None,
                                 date: str | None = None, follow_up_action: str | None = None,
                                 follow_up_date: str | None = None, follow_up_done: bool | None = None,
                                 assigned_to: str | None = None,
                                 assigned_name: str | None = None) -> dict[str, Any]:
        """Crée un suivi/relance. Obligatoires : project_id, summary."""
        ctx = get_context()
        data = compact(project_id=project_id, summary=summary, type=type, date=date,
                       follow_up_action=follow_up_action, follow_up_date=follow_up_date,
                       follow_up_done=follow_up_done, assigned_to=assigned_to,
                       assigned_name=assigned_name)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "project_follow_ups_v2", data)

    @mcp.tool()
    def projets_update_follow_up(follow_up_id: str, summary: str | None = None, type: str | None = None,
                                 date: str | None = None, follow_up_action: str | None = None,
                                 follow_up_date: str | None = None, follow_up_done: bool | None = None,
                                 assigned_to: str | None = None, assigned_name: str | None = None,
                                 confirm: bool = False) -> dict[str, Any]:
        """Modifie un suivi de projet. Sans confirm=true : diff ; avec : applique (sauf dry-run)."""
        ctx = get_context()
        data = compact(summary=summary, type=type, date=date, follow_up_action=follow_up_action,
                       follow_up_date=follow_up_date, follow_up_done=follow_up_done,
                       assigned_to=assigned_to, assigned_name=assigned_name)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "project_follow_ups_v2",
                              follow_up_id, data, confirm=confirm)

    @mcp.tool()
    def projets_delete_follow_up(follow_up_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime un suivi de projet. Exige confirm=true."""
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "project_follow_ups_v2",
                              follow_up_id, confirm=confirm)

    # ===================== BRIEFS (project_briefs_v2) =====================

    @mcp.tool()
    def projets_list_briefs(project_id: str, limit: int = 50, offset: int = 0) -> dict[str, Any]:
        """Liste les briefs d'un projet (table `project_briefs_v2`)."""
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "project_briefs_v2",
                              filters={"project_id": project_id}, order="created_at.desc",
                              limit=limit, offset=offset)

    @mcp.tool()
    def projets_get_brief(brief_id: str) -> dict[str, Any]:
        """Détail d'un brief par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "project_briefs_v2", brief_id)

    @mcp.tool()
    def projets_create_brief(project_id: str, objective: str | None = None,
                             target_audience: str | None = None, pages: str | None = None,
                             techno: str | None = None, design_references: str | None = None,
                             notes: str | None = None, status: str | None = None) -> dict[str, Any]:
        """Crée un brief de projet. Obligatoire : project_id."""
        ctx = get_context()
        data = compact(project_id=project_id, objective=objective, target_audience=target_audience,
                       pages=pages, techno=techno, design_references=design_references,
                       notes=notes, status=status)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "project_briefs_v2", data)

    @mcp.tool()
    def projets_update_brief(brief_id: str, objective: str | None = None,
                             target_audience: str | None = None, pages: str | None = None,
                             techno: str | None = None, design_references: str | None = None,
                             notes: str | None = None, status: str | None = None,
                             submitted_at: str | None = None, confirm: bool = False) -> dict[str, Any]:
        """Modifie un brief. Sans confirm=true : diff ; avec : applique (sauf dry-run)."""
        ctx = get_context()
        data = compact(objective=objective, target_audience=target_audience, pages=pages,
                       techno=techno, design_references=design_references, notes=notes,
                       status=status, submitted_at=submitted_at)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "project_briefs_v2",
                              brief_id, data, confirm=confirm)

    @mcp.tool()
    def projets_delete_brief(brief_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime un brief. Exige confirm=true."""
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "project_briefs_v2",
                              brief_id, confirm=confirm)

    # ===================== LIAISON PROJET<->CONTACT (project_contacts) =====================

    @mcp.tool()
    def projets_list_project_contacts(project_id: str, limit: int = 100,
                                      offset: int = 0) -> dict[str, Any]:
        """Liste les contacts liés à un projet (table `project_contacts`)."""
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "project_contacts",
                              filters={"project_id": project_id}, order="created_at.desc",
                              limit=limit, offset=offset)

    @mcp.tool()
    def projets_get_project_contact(link_id: str) -> dict[str, Any]:
        """Détail d'une liaison projet<->contact par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "project_contacts", link_id)

    @mcp.tool()
    def projets_link_contact(project_id: str, contact_id: str,
                             role: ProjectContactRole = "primary",
                             notes: str | None = None) -> dict[str, Any]:
        """Lie un contact à un projet. Obligatoires : project_id, contact_id.

        role : primary, decision_maker, technical, billing, other.
        """
        ctx = get_context()
        data = compact(project_id=project_id, contact_id=contact_id, role=role, notes=notes)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "project_contacts", data)

    @mcp.tool()
    def projets_update_project_contact(link_id: str, role: ProjectContactRole | None = None,
                                       notes: str | None = None,
                                       confirm: bool = False) -> dict[str, Any]:
        """Modifie une liaison projet<->contact (rôle/notes). confirm=true requis (sauf dry-run)."""
        ctx = get_context()
        data = compact(role=role, notes=notes)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "project_contacts",
                              link_id, data, confirm=confirm)

    @mcp.tool()
    def projets_unlink_contact(link_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime une liaison projet<->contact. Exige confirm=true."""
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "project_contacts",
                              link_id, confirm=confirm)

    # ===================== FIL D'ACTIVITÉ (project_activities_v2) =====================

    @mcp.tool()
    def projets_list_activities(project_id: str, limit: int = 100, offset: int = 0) -> dict[str, Any]:
        """Liste le fil d'activité d'un projet (table `project_activities_v2`)."""
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "project_activities_v2",
                              filters={"project_id": project_id}, order="created_at.desc",
                              limit=limit, offset=offset)

    @mcp.tool()
    def projets_get_activity(activity_id: str) -> dict[str, Any]:
        """Détail d'une activité de projet par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "project_activities_v2", activity_id)

    @mcp.tool()
    def projets_create_activity(project_id: str, content: str, type: str | None = None,
                                author_name: str | None = None, user_id: str | None = None,
                                visible_to_client: bool | None = None,
                                metadata: dict | None = None) -> dict[str, Any]:
        """Ajoute une activité au fil d'un projet. Obligatoires : project_id, content."""
        ctx = get_context()
        data = compact(project_id=project_id, content=content, type=type, author_name=author_name,
                       user_id=user_id, visible_to_client=visible_to_client, metadata=metadata)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "project_activities_v2", data)

    @mcp.tool()
    def projets_delete_activity(activity_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime une activité de projet. Exige confirm=true."""
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "project_activities_v2",
                              activity_id, confirm=confirm)

    # ===================== DOCUMENTS (project_documents_v2) =====================

    @mcp.tool()
    def projets_list_documents(project_id: str, limit: int = 100, offset: int = 0) -> dict[str, Any]:
        """Liste les documents d'un projet (métadonnées ; table `project_documents_v2`)."""
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "project_documents_v2",
                              filters={"project_id": project_id}, order="created_at.desc",
                              limit=limit, offset=offset)

    @mcp.tool()
    def projets_get_document(document_id: str) -> dict[str, Any]:
        """Détail d'un document de projet par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "project_documents_v2", document_id)

    @mcp.tool()
    def projets_create_document(project_id: str, name: str, category: str | None = None,
                                version: str | None = None, file_path: str | None = None,
                                file_size: int | None = None, mime_type: str | None = None,
                                uploaded_by: str | None = None,
                                uploader_name: str | None = None) -> dict[str, Any]:
        """Enregistre la MÉTADONNÉE d'un document. Obligatoires : project_id, name.

        Ne téléverse pas le binaire (Supabase Storage non géré) : `file_path` doit
        référencer un fichier déjà présent dans le bucket.
        """
        ctx = get_context()
        data = compact(project_id=project_id, name=name, category=category, version=version,
                       file_path=file_path, file_size=file_size, mime_type=mime_type,
                       uploaded_by=uploaded_by, uploader_name=uploader_name)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "project_documents_v2", data)

    @mcp.tool()
    def projets_delete_document(document_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime la métadonnée d'un document. Exige confirm=true."""
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "project_documents_v2",
                              document_id, confirm=confirm)

    # ===================== ACCÈS (project_accesses_v2) — LECTURE SEULE =====================

    @mcp.tool()
    def projets_list_accesses(project_id: str, limit: int = 100, offset: int = 0) -> dict[str, Any]:
        """Liste les accès d'un projet (table `project_accesses_v2`).

        LECTURE SEULE : les identifiants/mots de passe (`*_enc`) sont chiffrés en base
        et volontairement masqués/non modifiables via ce MCP.
        """
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "project_accesses_v2",
                              filters={"project_id": project_id}, order="created_at.desc",
                              limit=limit, offset=offset)

    @mcp.tool()
    def projets_get_access(access_id: str) -> dict[str, Any]:
        """Détail d'un accès projet (sans les champs chiffrés) par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "project_accesses_v2", access_id)

    # ===================== ARCHIVE (archived_projects) — LECTURE SEULE =====================

    @mcp.tool()
    def projets_list_archived_projects(year: int | None = None, limit: int = 100,
                                       offset: int = 0) -> dict[str, Any]:
        """Liste les projets archivés par année (table `archived_projects`, lecture seule)."""
        filters: dict[str, Any] = {}
        if year is not None:
            filters["year"] = year
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "archived_projects", filters=filters,
                              order="archived_at.desc", limit=limit, offset=offset)

    @mcp.tool()
    def projets_get_archived_project(archived_id: str) -> dict[str, Any]:
        """Détail d'un projet archivé par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "archived_projects", archived_id)
