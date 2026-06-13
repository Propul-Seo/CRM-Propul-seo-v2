"""Section Paramètres — outils nommés et typés (`parametres_*`).

Tables couvertes (cf. registry.py) :
  - company_settings      : réglages société (1 ligne)        list/get/update
  - users                 : utilisateurs + droits             list/get/update
  - user_profiles         : profils                            list/get/update
  - user_permissions      : permissions détaillées             list/get/update
  - notification_settings : préférences de notification        CRUD complet

Pas de create/delete sur users/profiles/permissions : la création de comptes passe
par les Edge Functions admin-* (hors périmètre de ce MCP).
"""
from __future__ import annotations

from typing import Any, Literal

from mcp.server.fastmcp import FastMCP

from .. import crud
from ..context import get_context
from ._helpers import compact

# Enum réel (user_role) — cf. schemas.ENUM_VALUES.
UserRole = Literal["admin", "sales", "marketing", "developer", "manager", "ops"]


def register(mcp: FastMCP) -> None:
    # ===================== RÉGLAGES SOCIÉTÉ (company_settings) — list/get/update =====

    @mcp.tool()
    def parametres_get_company_settings() -> dict[str, Any]:
        """Récupère les réglages société (table `company_settings`, ligne unique)."""
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "company_settings", limit=1)

    @mcp.tool()
    def parametres_update_company_settings(settings_id: str, company_name: str | None = None,
                                           company_logo: str | None = None,
                                           company_address: str | None = None,
                                           company_phone: str | None = None,
                                           company_email: str | None = None,
                                           company_website: str | None = None,
                                           tax_number: str | None = None,
                                           default_currency: str | None = None,
                                           default_tax_rate: float | None = None,
                                           invoice_prefix: str | None = None,
                                           quote_prefix: str | None = None,
                                           fiscal_year_start: int | None = None,
                                           settings: dict | None = None,
                                           confirm: bool = False) -> dict[str, Any]:
        """Modifie les réglages société (récupérer l'id via parametres_get_company_settings).

        confirm=true requis (sauf dry-run). `settings` = objet JSON libre.
        """
        ctx = get_context()
        data = compact(company_name=company_name, company_logo=company_logo,
                       company_address=company_address, company_phone=company_phone,
                       company_email=company_email, company_website=company_website,
                       tax_number=tax_number, default_currency=default_currency,
                       default_tax_rate=default_tax_rate, invoice_prefix=invoice_prefix,
                       quote_prefix=quote_prefix, fiscal_year_start=fiscal_year_start,
                       settings=settings)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "company_settings",
                              settings_id, data, confirm=confirm)

    # ===================== UTILISATEURS (users) — list/get/update =====================

    @mcp.tool()
    def parametres_list_users(search: str | None = None, role: UserRole | None = None,
                              is_active: bool | None = None, limit: int = 50,
                              offset: int = 0) -> dict[str, Any]:
        """Liste les utilisateurs (table `users`)."""
        filters: dict[str, Any] = {}
        if role:
            filters["role"] = role
        if is_active is not None:
            filters["is_active"] = is_active
        if search:
            term = f"*{search}*"
            filters["or"] = f"(name.ilike.{term},email.ilike.{term})"
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "users", filters=filters,
                              order="name.asc", limit=limit, offset=offset)

    @mcp.tool()
    def parametres_get_user(user_id: str) -> dict[str, Any]:
        """Détail d'un utilisateur par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "users", user_id)

    @mcp.tool()
    def parametres_update_user(user_id: str, name: str | None = None, email: str | None = None,
                               phone: str | None = None, position: str | None = None,
                               bio: str | None = None, timezone: str | None = None,
                               language: str | None = None, is_active: bool | None = None,
                               role: UserRole | None = None,
                               can_view_dashboard: bool | None = None,
                               can_view_leads: bool | None = None,
                               can_view_projects: bool | None = None,
                               can_view_tasks: bool | None = None,
                               can_view_chat: bool | None = None,
                               can_view_finance: bool | None = None,
                               can_view_settings: bool | None = None,
                               can_edit_leads: bool | None = None,
                               can_create_projects: bool | None = None,
                               can_edit_projects: bool | None = None,
                               can_assign_tasks: bool | None = None,
                               can_view_crm_bot_one: bool | None = None,
                               can_view_crm_erp: bool | None = None,
                               can_view_communication: bool | None = None,
                               can_view_procedures: bool | None = None,
                               portal_enabled: bool | None = None,
                               onboarding_completed: bool | None = None,
                               confirm: bool = False) -> dict[str, Any]:
        """Modifie un utilisateur (profil, rôle, droits can_view_*). confirm=true requis (sauf dry-run)."""
        ctx = get_context()
        data = compact(name=name, email=email, phone=phone, position=position, bio=bio,
                       timezone=timezone, language=language, is_active=is_active, role=role,
                       can_view_dashboard=can_view_dashboard, can_view_leads=can_view_leads,
                       can_view_projects=can_view_projects, can_view_tasks=can_view_tasks,
                       can_view_chat=can_view_chat, can_view_finance=can_view_finance,
                       can_view_settings=can_view_settings, can_edit_leads=can_edit_leads,
                       can_create_projects=can_create_projects, can_edit_projects=can_edit_projects,
                       can_assign_tasks=can_assign_tasks, can_view_crm_bot_one=can_view_crm_bot_one,
                       can_view_crm_erp=can_view_crm_erp, can_view_communication=can_view_communication,
                       can_view_procedures=can_view_procedures, portal_enabled=portal_enabled,
                       onboarding_completed=onboarding_completed)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "users",
                              user_id, data, confirm=confirm)

    # ===================== PROFILS (user_profiles) — list/get/update =====================

    @mcp.tool()
    def parametres_list_user_profiles(role: UserRole | None = None, is_active: bool | None = None,
                                      limit: int = 50, offset: int = 0) -> dict[str, Any]:
        """Liste les profils utilisateurs (table `user_profiles`)."""
        filters: dict[str, Any] = {}
        if role:
            filters["role"] = role
        if is_active is not None:
            filters["is_active"] = is_active
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "user_profiles", filters=filters,
                              order="name.asc", limit=limit, offset=offset)

    @mcp.tool()
    def parametres_get_user_profile(profile_id: str) -> dict[str, Any]:
        """Détail d'un profil utilisateur par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "user_profiles", profile_id)

    @mcp.tool()
    def parametres_update_user_profile(profile_id: str, name: str | None = None,
                                       role: UserRole | None = None, phone: str | None = None,
                                       company: str | None = None, position: str | None = None,
                                       bio: str | None = None, timezone: str | None = None,
                                       language: str | None = None, is_active: bool | None = None,
                                       avatar_url: str | None = None,
                                       confirm: bool = False) -> dict[str, Any]:
        """Modifie un profil utilisateur. confirm=true requis (sauf dry-run)."""
        ctx = get_context()
        data = compact(name=name, role=role, phone=phone, company=company, position=position,
                       bio=bio, timezone=timezone, language=language, is_active=is_active,
                       avatar_url=avatar_url)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "user_profiles",
                              profile_id, data, confirm=confirm)

    # ===================== PERMISSIONS (user_permissions) — list/get/update =====================

    @mcp.tool()
    def parametres_list_user_permissions(user_id: str | None = None, limit: int = 50,
                                         offset: int = 0) -> dict[str, Any]:
        """Liste les permissions détaillées (table `user_permissions`)."""
        filters: dict[str, Any] = {}
        if user_id:
            filters["user_id"] = user_id
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "user_permissions", filters=filters,
                              limit=limit, offset=offset)

    @mcp.tool()
    def parametres_get_user_permission(permission_id: str) -> dict[str, Any]:
        """Détail d'un jeu de permissions par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "user_permissions", permission_id)

    @mcp.tool()
    def parametres_update_user_permission(permission_id: str,
                                          can_view_dashboard: bool | None = None,
                                          can_view_leads: bool | None = None,
                                          can_view_projects: bool | None = None,
                                          can_view_tasks: bool | None = None,
                                          can_view_chat: bool | None = None,
                                          can_view_finance: bool | None = None,
                                          can_view_settings: bool | None = None,
                                          can_create_leads: bool | None = None,
                                          can_edit_leads: bool | None = None,
                                          can_delete_leads: bool | None = None,
                                          can_create_projects: bool | None = None,
                                          can_edit_projects: bool | None = None,
                                          can_assign_tasks: bool | None = None,
                                          can_view_financial_data: bool | None = None,
                                          confirm: bool = False) -> dict[str, Any]:
        """Modifie un jeu de permissions. confirm=true requis (sauf dry-run)."""
        ctx = get_context()
        data = compact(can_view_dashboard=can_view_dashboard, can_view_leads=can_view_leads,
                       can_view_projects=can_view_projects, can_view_tasks=can_view_tasks,
                       can_view_chat=can_view_chat, can_view_finance=can_view_finance,
                       can_view_settings=can_view_settings, can_create_leads=can_create_leads,
                       can_edit_leads=can_edit_leads, can_delete_leads=can_delete_leads,
                       can_create_projects=can_create_projects, can_edit_projects=can_edit_projects,
                       can_assign_tasks=can_assign_tasks, can_view_financial_data=can_view_financial_data)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "user_permissions",
                              permission_id, data, confirm=confirm)

    # ===================== NOTIFICATIONS (notification_settings) — CRUD complet =====

    @mcp.tool()
    def parametres_list_notification_settings(user_id: str | None = None, limit: int = 50,
                                              offset: int = 0) -> dict[str, Any]:
        """Liste les préférences de notification (table `notification_settings`)."""
        filters: dict[str, Any] = {}
        if user_id:
            filters["user_id"] = user_id
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "notification_settings", filters=filters,
                              limit=limit, offset=offset)

    @mcp.tool()
    def parametres_get_notification_setting(setting_id: str) -> dict[str, Any]:
        """Détail d'un jeu de préférences de notification par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "notification_settings", setting_id)

    @mcp.tool()
    def parametres_create_notification_setting(user_id: str, email_notifications: bool | None = None,
                                               push_notifications: bool | None = None,
                                               sms_notifications: bool | None = None,
                                               task_reminders: bool | None = None,
                                               deadline_alerts: bool | None = None,
                                               client_updates: bool | None = None,
                                               marketing_emails: bool | None = None,
                                               weekly_reports: bool | None = None,
                                               notification_frequency: str | None = None,
                                               quiet_hours_start: str | None = None,
                                               quiet_hours_end: str | None = None) -> dict[str, Any]:
        """Crée les préférences de notification d'un utilisateur. Obligatoire : user_id."""
        ctx = get_context()
        data = compact(user_id=user_id, email_notifications=email_notifications,
                       push_notifications=push_notifications, sms_notifications=sms_notifications,
                       task_reminders=task_reminders, deadline_alerts=deadline_alerts,
                       client_updates=client_updates, marketing_emails=marketing_emails,
                       weekly_reports=weekly_reports, notification_frequency=notification_frequency,
                       quiet_hours_start=quiet_hours_start, quiet_hours_end=quiet_hours_end)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "notification_settings", data)

    @mcp.tool()
    def parametres_update_notification_setting(setting_id: str, email_notifications: bool | None = None,
                                               push_notifications: bool | None = None,
                                               sms_notifications: bool | None = None,
                                               task_reminders: bool | None = None,
                                               deadline_alerts: bool | None = None,
                                               client_updates: bool | None = None,
                                               marketing_emails: bool | None = None,
                                               weekly_reports: bool | None = None,
                                               notification_frequency: str | None = None,
                                               quiet_hours_start: str | None = None,
                                               quiet_hours_end: str | None = None,
                                               confirm: bool = False) -> dict[str, Any]:
        """Modifie les préférences de notification. confirm=true requis (sauf dry-run)."""
        ctx = get_context()
        data = compact(email_notifications=email_notifications, push_notifications=push_notifications,
                       sms_notifications=sms_notifications, task_reminders=task_reminders,
                       deadline_alerts=deadline_alerts, client_updates=client_updates,
                       marketing_emails=marketing_emails, weekly_reports=weekly_reports,
                       notification_frequency=notification_frequency, quiet_hours_start=quiet_hours_start,
                       quiet_hours_end=quiet_hours_end)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "notification_settings",
                              setting_id, data, confirm=confirm)

    @mcp.tool()
    def parametres_delete_notification_setting(setting_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime les préférences de notification. Exige confirm=true."""
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "notification_settings",
                              setting_id, confirm=confirm)
