"""Section Comptabilité — outils nommés et typés (`compta_*`).

Tables couvertes (cf. registry.py) :
  - accounting_entries          : écritures (recettes/dépenses)   CRUD complet
  - revenue_allocations         : ventilation de revenus          CRUD complet
  - partners                    : partenaires (parts %)           CRUD complet
  - partner_transactions        : transactions partenaires        CRUD complet
  - monthly_accounting_metrics  : métriques mensuelles            lecture seule
  - archived_accounting_entries : écritures archivées par année   lecture seule
"""
from __future__ import annotations

from typing import Any

from mcp.server.fastmcp import FastMCP

from .. import crud
from ..context import get_context
from ._helpers import compact


def register(mcp: FastMCP) -> None:
    # ===================== ÉCRITURES (accounting_entries) =====================

    @mcp.tool()
    def compta_list_entries(type: str | None = None, category: str | None = None,
                            month_key: str | None = None, payment_status: str | None = None,
                            project_id: str | None = None, search: str | None = None,
                            limit: int = 50, offset: int = 0) -> dict[str, Any]:
        """Liste les écritures comptables (table `accounting_entries`).

        Args:
            type: nature de l'écriture (usuel : 'revenue' / 'expense').
            category: catégorie comptable.
            month_key: mois ciblé (format 'YYYY-MM').
            payment_status: statut de paiement (usuel : pending / paid / overdue).
            project_id: uuid du projet rattaché.
            search: recherche texte sur la description.
        """
        filters: dict[str, Any] = {}
        if type:
            filters["type"] = type
        if category:
            filters["category"] = category
        if month_key:
            filters["month_key"] = month_key
        if payment_status:
            filters["payment_status"] = payment_status
        if project_id:
            filters["project_id"] = project_id
        if search:
            filters["description"] = f"ilike.*{search}*"
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "accounting_entries", filters=filters,
                              order="entry_date.desc", limit=limit, offset=offset)

    @mcp.tool()
    def compta_get_entry(entry_id: str) -> dict[str, Any]:
        """Détail d'une écriture comptable par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "accounting_entries", entry_id)

    @mcp.tool()
    def compta_create_entry(type: str, amount: float, description: str, entry_date: str,
                            month_key: str, category: str | None = None,
                            payment_status: str | None = None, due_date: str | None = None,
                            payment_date: str | None = None, project_id: str | None = None,
                            responsible_user_id: str | None = None,
                            responsible_user_name: str | None = None,
                            revenue_category: str | None = None,
                            revenue_sous_categorie: str | None = None,
                            created_by: str | None = None) -> dict[str, Any]:
        """Crée une écriture comptable.

        Obligatoires : type, amount, description, entry_date (YYYY-MM-DD), month_key (YYYY-MM).
        """
        ctx = get_context()
        data = compact(type=type, amount=amount, description=description, entry_date=entry_date,
                       month_key=month_key, category=category, payment_status=payment_status,
                       due_date=due_date, payment_date=payment_date, project_id=project_id,
                       responsible_user_id=responsible_user_id,
                       responsible_user_name=responsible_user_name,
                       revenue_category=revenue_category,
                       revenue_sous_categorie=revenue_sous_categorie, created_by=created_by)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "accounting_entries", data)

    @mcp.tool()
    def compta_update_entry(entry_id: str, type: str | None = None, amount: float | None = None,
                            description: str | None = None, entry_date: str | None = None,
                            month_key: str | None = None, category: str | None = None,
                            payment_status: str | None = None, due_date: str | None = None,
                            payment_date: str | None = None, project_id: str | None = None,
                            responsible_user_id: str | None = None,
                            responsible_user_name: str | None = None,
                            revenue_category: str | None = None,
                            revenue_sous_categorie: str | None = None,
                            confirm: bool = False) -> dict[str, Any]:
        """Modifie une écriture comptable. Sans confirm=true : diff ; avec : applique (sauf dry-run)."""
        ctx = get_context()
        data = compact(type=type, amount=amount, description=description, entry_date=entry_date,
                       month_key=month_key, category=category, payment_status=payment_status,
                       due_date=due_date, payment_date=payment_date, project_id=project_id,
                       responsible_user_id=responsible_user_id,
                       responsible_user_name=responsible_user_name,
                       revenue_category=revenue_category,
                       revenue_sous_categorie=revenue_sous_categorie)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "accounting_entries",
                              entry_id, data, confirm=confirm)

    @mcp.tool()
    def compta_delete_entry(entry_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime une écriture comptable. Exige confirm=true."""
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "accounting_entries",
                              entry_id, confirm=confirm)

    # ===================== VENTILATIONS (revenue_allocations) =====================

    @mcp.tool()
    def compta_list_revenue_allocations(entry_id: str | None = None, limit: int = 100,
                                        offset: int = 0) -> dict[str, Any]:
        """Liste les ventilations de revenus (table `revenue_allocations`)."""
        filters: dict[str, Any] = {}
        if entry_id:
            filters["entry_id"] = entry_id
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "revenue_allocations", filters=filters,
                              order="created_at.desc", limit=limit, offset=offset)

    @mcp.tool()
    def compta_get_revenue_allocation(allocation_id: str) -> dict[str, Any]:
        """Détail d'une ventilation de revenu par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "revenue_allocations", allocation_id)

    @mcp.tool()
    def compta_create_revenue_allocation(entry_id: str, revenue_category: str, amount: float,
                                         revenue_sous_categorie: str | None = None) -> dict[str, Any]:
        """Crée une ventilation de revenu. Obligatoires : entry_id, revenue_category, amount."""
        ctx = get_context()
        data = compact(entry_id=entry_id, revenue_category=revenue_category, amount=amount,
                       revenue_sous_categorie=revenue_sous_categorie)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "revenue_allocations", data)

    @mcp.tool()
    def compta_update_revenue_allocation(allocation_id: str, revenue_category: str | None = None,
                                         amount: float | None = None,
                                         revenue_sous_categorie: str | None = None,
                                         confirm: bool = False) -> dict[str, Any]:
        """Modifie une ventilation de revenu. confirm=true requis (sauf dry-run)."""
        ctx = get_context()
        data = compact(revenue_category=revenue_category, amount=amount,
                       revenue_sous_categorie=revenue_sous_categorie)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "revenue_allocations",
                              allocation_id, data, confirm=confirm)

    @mcp.tool()
    def compta_delete_revenue_allocation(allocation_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime une ventilation de revenu. Exige confirm=true."""
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "revenue_allocations",
                              allocation_id, confirm=confirm)

    # ===================== PARTENAIRES (partners) =====================

    @mcp.tool()
    def compta_list_partners(is_active: bool | None = None, limit: int = 50,
                             offset: int = 0) -> dict[str, Any]:
        """Liste les partenaires (table `partners`)."""
        filters: dict[str, Any] = {}
        if is_active is not None:
            filters["is_active"] = is_active
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "partners", filters=filters,
                              order="name.asc", limit=limit, offset=offset)

    @mcp.tool()
    def compta_get_partner(partner_id: str) -> dict[str, Any]:
        """Détail d'un partenaire par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "partners", partner_id)

    @mcp.tool()
    def compta_create_partner(name: str, share_percentage: float, email: str | None = None,
                              phone: str | None = None, is_active: bool | None = None) -> dict[str, Any]:
        """Crée un partenaire. Obligatoires : name, share_percentage (en %)."""
        ctx = get_context()
        data = compact(name=name, share_percentage=share_percentage, email=email,
                       phone=phone, is_active=is_active)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "partners", data)

    @mcp.tool()
    def compta_update_partner(partner_id: str, name: str | None = None,
                              share_percentage: float | None = None, email: str | None = None,
                              phone: str | None = None, is_active: bool | None = None,
                              confirm: bool = False) -> dict[str, Any]:
        """Modifie un partenaire. confirm=true requis (sauf dry-run)."""
        ctx = get_context()
        data = compact(name=name, share_percentage=share_percentage, email=email,
                       phone=phone, is_active=is_active)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "partners",
                              partner_id, data, confirm=confirm)

    @mcp.tool()
    def compta_delete_partner(partner_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime un partenaire. Exige confirm=true."""
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "partners",
                              partner_id, confirm=confirm)

    # ===================== TRANSACTIONS PARTENAIRES (partner_transactions) =====================

    @mcp.tool()
    def compta_list_partner_transactions(partner_id: str | None = None,
                                         accounting_entry_id: str | None = None,
                                         limit: int = 100, offset: int = 0) -> dict[str, Any]:
        """Liste les transactions partenaires (table `partner_transactions`)."""
        filters: dict[str, Any] = {}
        if partner_id:
            filters["partner_id"] = partner_id
        if accounting_entry_id:
            filters["accounting_entry_id"] = accounting_entry_id
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "partner_transactions", filters=filters,
                              order="created_at.desc", limit=limit, offset=offset)

    @mcp.tool()
    def compta_get_partner_transaction(transaction_id: str) -> dict[str, Any]:
        """Détail d'une transaction partenaire par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "partner_transactions", transaction_id)

    @mcp.tool()
    def compta_create_partner_transaction(amount: float, transaction_type: str,
                                          partner_id: str | None = None,
                                          accounting_entry_id: str | None = None,
                                          description: str | None = None) -> dict[str, Any]:
        """Crée une transaction partenaire. Obligatoires : amount, transaction_type."""
        ctx = get_context()
        data = compact(amount=amount, transaction_type=transaction_type, partner_id=partner_id,
                       accounting_entry_id=accounting_entry_id, description=description)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "partner_transactions", data)

    @mcp.tool()
    def compta_update_partner_transaction(transaction_id: str, amount: float | None = None,
                                          transaction_type: str | None = None,
                                          partner_id: str | None = None,
                                          accounting_entry_id: str | None = None,
                                          description: str | None = None,
                                          confirm: bool = False) -> dict[str, Any]:
        """Modifie une transaction partenaire. confirm=true requis (sauf dry-run)."""
        ctx = get_context()
        data = compact(amount=amount, transaction_type=transaction_type, partner_id=partner_id,
                       accounting_entry_id=accounting_entry_id, description=description)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "partner_transactions",
                              transaction_id, data, confirm=confirm)

    @mcp.tool()
    def compta_delete_partner_transaction(transaction_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime une transaction partenaire. Exige confirm=true."""
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "partner_transactions",
                              transaction_id, confirm=confirm)

    # ===================== MÉTRIQUES MENSUELLES (lecture seule) =====================

    @mcp.tool()
    def compta_list_monthly_metrics(limit: int = 36, offset: int = 0) -> dict[str, Any]:
        """Liste les métriques comptables mensuelles (table `monthly_accounting_metrics`, lecture seule)."""
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "monthly_accounting_metrics",
                              order="month.desc", limit=limit, offset=offset)

    @mcp.tool()
    def compta_get_monthly_metric(metric_id: str) -> dict[str, Any]:
        """Détail d'une métrique mensuelle par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "monthly_accounting_metrics", metric_id)

    # ===================== ARCHIVES (lecture seule) =====================

    @mcp.tool()
    def compta_list_archived_entries(year: int | None = None, limit: int = 100,
                                     offset: int = 0) -> dict[str, Any]:
        """Liste les écritures comptables archivées (table `archived_accounting_entries`, lecture seule)."""
        filters: dict[str, Any] = {}
        if year is not None:
            filters["year"] = year
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "archived_accounting_entries", filters=filters,
                              order="archived_at.desc", limit=limit, offset=offset)

    @mcp.tool()
    def compta_get_archived_entry(archived_id: str) -> dict[str, Any]:
        """Détail d'une écriture archivée par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "archived_accounting_entries", archived_id)
