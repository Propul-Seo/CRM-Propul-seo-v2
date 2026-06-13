"""Registre des tables du CRM : schéma exact + métadonnées.

Le schéma (RAW_SCHEMA) est transcrit tel quel depuis l'introspection de la base
ERP (information_schema.columns). Format d'une colonne : "nom:type[!][=def]"
  - "!"    => NOT NULL
  - "=def" => possède une valeur par défaut côté base

Le parseur en déduit les colonnes obligatoires à la création, les colonnes
gérées automatiquement (exclues des écritures) et les colonnes chiffrées (`*_enc`,
exclues en lecture comme en écriture pour ne pas corrompre les credentials).
"""
from __future__ import annotations

from dataclasses import dataclass, field

from .schemas import ENUM_COLUMNS, ENUM_VALUES

# Colonnes gérées par la base / triggers : jamais demandées en écriture.
MANAGED_COLUMNS = {"id", "created_at", "updated_at"}

# Jeux d'opérations autorisées par table.
FULL = ("list", "get", "create", "update", "delete")
RO = ("list", "get")
LGC = ("list", "get", "create")
LGCD = ("list", "get", "create", "delete")
LGCU = ("list", "get", "create", "update")
LGU = ("list", "get", "update")

# table -> (section, singulier, pluriel, libellé, opérations)
TABLE_META: dict[str, tuple[str, str, str, str, tuple[str, ...]]] = {
    # --- CRM ---
    "contacts": ("crm", "contact", "contacts", "Contact", FULL),
    "clients": ("crm", "client", "clients", "Client", FULL),
    "crmerp_leads": ("crm", "lead", "leads", "Lead (CRM ERP)", FULL),
    "leads": ("crm", "pipeline_lead", "pipeline_leads", "Lead (pipeline)", FULL),
    "lead_notes": ("crm", "lead_note", "lead_notes", "Note de lead", LGCD),
    "contact_activities": ("crm", "contact_activity", "contact_activities", "Activité contact", FULL),
    "crmerp_activities": ("crm", "lead_activity", "lead_activities", "Activité lead ERP", LGCD),
    "crm_bot_one_records": ("crm", "bot_one_record", "bot_one_records", "Fiche CRM Bot One", FULL),
    "crm_bot_one_activities": ("crm", "bot_one_activity", "bot_one_activities", "Activité Bot One", LGCD),
    "crm_columns": ("crm", "crm_column", "crm_columns", "Colonne CRM", FULL),
    "crm_bot_one_columns": ("crm", "bot_one_column", "bot_one_columns", "Colonne Bot One", FULL),
    # --- Projets ---
    "projects_v2": ("projets", "project", "projects", "Projet", FULL),
    "checklist_items_v2": ("projets", "checklist_item", "checklist_items", "Item de checklist", FULL),
    "project_activities_v2": ("projets", "project_activity", "project_activities", "Activité projet", LGCD),
    "project_documents_v2": ("projets", "project_document", "project_documents", "Document projet", LGCD),
    "project_briefs_v2": ("projets", "project_brief", "project_briefs", "Brief projet", FULL),
    "project_invoices_v2": ("projets", "project_invoice", "project_invoices", "Facture projet", FULL),
    "project_follow_ups_v2": ("projets", "project_follow_up", "project_follow_ups", "Suivi projet", FULL),
    "project_contacts": ("projets", "project_contact", "project_contacts", "Contact de projet", FULL),
    "project_accesses_v2": ("projets", "project_access", "project_accesses", "Accès projet (chiffré)", RO),
    "archived_projects": ("projets", "archived_project", "archived_projects", "Projet archivé", RO),
    # --- Comptabilité ---
    "accounting_entries": ("compta", "entry", "entries", "Écriture comptable", FULL),
    "revenue_allocations": ("compta", "revenue_allocation", "revenue_allocations", "Ventilation de revenu", FULL),
    "partners": ("compta", "partner", "partners", "Partenaire", FULL),
    "partner_transactions": ("compta", "partner_transaction", "partner_transactions", "Transaction partenaire", FULL),
    "monthly_accounting_metrics": ("compta", "monthly_metric", "monthly_metrics", "Métrique mensuelle", RO),
    "archived_accounting_entries": ("compta", "archived_entry", "archived_entries", "Écriture archivée", RO),
    # --- Procédures ---
    "procedures": ("procedures", "procedure", "procedures", "Procédure", FULL),
    "procedure_categories": ("procedures", "category", "categories", "Catégorie de procédure", FULL),
    "procedure_revisions": ("procedures", "revision", "revisions", "Révision de procédure", LGC),
    # --- Tâches ---
    "tasks": ("taches", "task", "tasks", "Tâche", FULL),
    "task_comments": ("taches", "task_comment", "task_comments", "Commentaire de tâche", LGCD),
    "personal_tasks": ("taches", "personal_task", "personal_tasks", "Tâche personnelle", FULL),
    "comm_tasks": ("taches", "comm_task", "comm_tasks", "Tâche communication", FULL),
    "archived_tasks": ("taches", "archived_task", "archived_tasks", "Tâche archivée", RO),
    # --- Communication ---
    "posts": ("comm", "post", "posts", "Post", FULL),
    "post_assets": ("comm", "post_asset", "post_assets", "Média de post", LGCD),
    "post_comments": ("comm", "post_comment", "post_comments", "Commentaire de post", LGCD),
    "post_metrics": ("comm", "post_metric", "post_metrics", "Métrique de post", FULL),
    "client_posts": ("comm", "client_post", "client_posts", "Post client", FULL),
    # --- Portails clients ---
    "agency_accesses": ("portails", "agency_access", "agency_accesses", "Accès agence (chiffré)", RO),
    "brief_invitations": ("portails", "brief_invitation", "brief_invitations", "Invitation brief", LGCU),
    # --- Dashboard ---
    "dashboard_metrics": ("dashboard", "dashboard_metric", "dashboard_metrics", "Métrique dashboard", RO),
    "yearly_stats": ("dashboard", "yearly_stat", "yearly_stats", "Statistique annuelle", RO),
    # --- Paramètres ---
    "company_settings": ("parametres", "company_setting", "company_settings", "Paramètres société", LGU),
    "users": ("parametres", "user", "users", "Utilisateur", LGU),
    "user_profiles": ("parametres", "user_profile", "user_profiles", "Profil utilisateur", LGU),
    "user_permissions": ("parametres", "user_permission", "user_permissions", "Permissions utilisateur", LGU),
    "notification_settings": ("parametres", "notification_setting", "notification_settings", "Réglages notifications", FULL),
}

# Schéma brut transcrit depuis la base (information_schema.columns).
RAW_SCHEMA: dict[str, str] = {
    "contacts": "id:uuid!=def, user_id:uuid, name:text!, email:text!, phone:text, company:text, sector:text, status:USER-DEFINED!=def, total_revenue:numeric=def, assigned_to:uuid, source:text, lead_score:integer=def, notes:ARRAY, tags:ARRAY, created_at:timestamp with time zone=def, updated_at:timestamp with time zone=def, project_price:numeric, next_activity_date:date, website:text, no_show:character varying=def, converted_to_project_id:uuid",
    "clients": "id:uuid!=def, user_id:uuid!, name:text!, email:text!, phone:text!, address:text!, sector:text!, status:USER-DEFINED!=def, total_revenue:numeric=def, assigned_to:uuid, created_at:timestamp with time zone=def, updated_at:timestamp with time zone=def, last_contact:timestamp with time zone=def",
    "crmerp_leads": "id:uuid!=def, created_at:timestamp with time zone!=def, updated_at:timestamp with time zone!=def, company_name:text, contact_name:text, email:text, phone:text, source:text, status:text!=def, assignee_id:uuid, notes:text, last_activity_at:timestamp with time zone, converted_to_project_id:uuid",
    "leads": "id:uuid!=def, company_name:text!, contact_name:text, email:text, phone:text, value:numeric, status:text=def, source:text, assigned_to:uuid, notes:text, created_at:timestamp with time zone=def, updated_at:timestamp with time zone=def, position:integer=def, pipeline_stage:text=def",
    "lead_notes": "id:uuid!=def, lead_id:uuid!, note:text!, created_by:uuid!, created_at:timestamp with time zone=def",
    "contact_activities": "id:uuid!=def, contact_id:uuid!, user_id:uuid, type:USER-DEFINED!, title:text!, description:text, activity_date:timestamp with time zone!, duration_minutes:integer, status:USER-DEFINED!=def, outcome:text, follow_up_required:boolean=def, next_action:text, created_at:timestamp with time zone=def, updated_at:timestamp with time zone=def",
    "crmerp_activities": "id:uuid!=def, created_at:timestamp with time zone!=def, lead_id:uuid!, type:text!, content:text, created_by:uuid, metadata:jsonb=def",
    "crm_bot_one_records": "id:uuid!=def, user_id:uuid, data:jsonb!=def, created_at:timestamp with time zone=def, updated_at:timestamp with time zone=def, status:character varying=def, tags:ARRAY=def, next_activity_date:timestamp with time zone",
    "crm_bot_one_activities": "id:uuid!=def, bot_one_record_id:uuid!, title:text!, description:text, activity_date:timestamp with time zone!, type:text!, status:text!, created_at:timestamp with time zone!=def, updated_at:timestamp with time zone!=def",
    "crm_columns": "id:uuid!=def, column_id:text!, title:text!, color:text!, header_color:text!, sort_order:integer!=def, is_active:boolean!=def, created_at:timestamp with time zone=def, updated_at:timestamp with time zone=def, position:integer!",
    "crm_bot_one_columns": "id:uuid!=def, user_id:uuid, column_name:character varying!, column_type:character varying!, column_order:integer=def, is_required:boolean=def, default_value:text, options:jsonb, validation_rules:jsonb, created_at:timestamp with time zone=def, is_default:boolean=def",
    "projects_v2": "id:uuid!=def, user_id:uuid, client_id:uuid, client_name:text!=def, name:text!, description:text, status:text!=def, priority:text!=def, assigned_to:uuid, assigned_name:text, start_date:date, end_date:date, budget:numeric, progress:integer=def, category:text, presta_type:ARRAY=def, completion_score:integer=def, last_activity_at:timestamp with time zone=def, completed_at:timestamp with time zone, is_archived:boolean!=def, created_at:timestamp with time zone!=def, updated_at:timestamp with time zone!=def, portal_token:uuid, portal_enabled:boolean=def, next_action_label:text, next_action_due:date, siret:character varying, company_data:jsonb, company_enriched_at:timestamp with time zone, ai_summary:jsonb, ai_summary_generated_at:timestamp with time zone, brief_token:uuid, brief_token_enabled:boolean=def, brief_short_code:text, portal_short_code:text, portal_expires_at:timestamp with time zone, comm_status:text, erp_status:text, portal_visible:boolean=def, portal_phase:text, portal_url_slug:text, portal_activated_at:timestamp with time zone, portal_deactivated_at:timestamp with time zone, portal_deactivation_reason:text, portal_next_milestone_label:text, portal_next_milestone_date:date, portal_published_hours_worked:numeric=def, portal_progress_percent:integer=def, portal_brand_logo_url:text, portal_brand_primary_color:text, client_address:text, client_vat_number:text, client_represented_by:text, portal_client_email:text, portal_activated_by:uuid, portal_last_invite_sent_at:timestamp with time zone, portal_previous_client_email:text, client_first_name:text, client_phone:text, client_company:text, archived_at:timestamp with time zone, legacy_project_id:uuid",
    "checklist_items_v2": "id:uuid!=def, project_id:uuid!, parent_task_id:uuid, title:text!, description:text, phase:text!=def, status:text!=def, priority:text!=def, assigned_to:uuid, assigned_name:text, due_date:date, sort_order:integer=def, created_at:timestamp with time zone!=def, updated_at:timestamp with time zone!=def",
    "project_activities_v2": "id:uuid!=def, project_id:uuid!, user_id:uuid, author_name:text, type:text!=def, content:text!, is_auto:boolean!=def, metadata:jsonb=def, created_at:timestamp with time zone!=def, visible_to_client:boolean!=def",
    "project_documents_v2": "id:uuid!=def, project_id:uuid!, name:text!, category:text!=def, version:text, file_path:text, file_size:integer, mime_type:text, uploaded_by:uuid, uploader_name:text, created_at:timestamp with time zone!=def",
    "project_briefs_v2": "id:uuid!=def, project_id:uuid!, objective:text, target_audience:text, pages:text, techno:text, design_references:text, notes:text, status:text!=def, created_at:timestamp with time zone!=def, updated_at:timestamp with time zone!=def, submitted_at:timestamp with time zone",
    "project_invoices_v2": "id:uuid!=def, project_id:uuid!, label:text!, amount:numeric!=def, status:text!=def, date:date, due_date:date, notes:text, created_at:timestamp with time zone!=def, updated_at:timestamp with time zone!=def",
    "project_follow_ups_v2": "id:uuid!=def, project_id:uuid!, type:text!=def, date:timestamp with time zone!=def, summary:text!, follow_up_action:text, follow_up_date:date, follow_up_done:boolean!=def, assigned_to:uuid, assigned_name:text, created_at:timestamp with time zone!=def",
    "project_contacts": "id:uuid!=def, project_id:uuid!, contact_id:uuid!, role:USER-DEFINED!=def, notes:text, created_at:timestamp with time zone!=def, updated_at:timestamp with time zone!=def",
    "project_accesses_v2": "id:uuid!=def, project_id:uuid!, category:text!=def, label:text!, url:text, status:text!=def, detected_from_email:boolean!=def, created_at:timestamp with time zone!=def, updated_at:timestamp with time zone!=def, provided_by:text, expires_at:timestamp with time zone, login_enc:bytea, password_enc:bytea, notes_enc:bytea",
    "archived_projects": "id:uuid!=def, year:integer!, user_id:uuid!, original_id:uuid, name:character varying, client_id:uuid, client_name:character varying, status:character varying, start_date:date, end_date:date, budget:numeric, total_amount:numeric, assigned_to:uuid, archived_at:timestamp with time zone=def, original_data:jsonb",
    "accounting_entries": "id:uuid!=def, type:character varying!, amount:numeric!, description:text!, category:character varying, entry_date:date!, month_key:character varying!, created_by:uuid, created_at:timestamp with time zone=def, updated_at:timestamp with time zone=def, responsible_user_id:uuid, responsible_user_name:text, revenue_category:text, revenue_sous_categorie:text, payment_status:text!=def, due_date:date, payment_date:date, project_id:uuid",
    "revenue_allocations": "id:uuid!=def, entry_id:uuid!, revenue_category:text!, revenue_sous_categorie:text, amount:numeric!, created_at:timestamp with time zone=def",
    "partners": "id:uuid!=def, name:character varying!, email:character varying, phone:character varying, share_percentage:numeric!, is_active:boolean=def, created_at:timestamp with time zone=def, updated_at:timestamp with time zone=def",
    "partner_transactions": "id:uuid!=def, accounting_entry_id:uuid, partner_id:uuid, amount:numeric!, transaction_type:character varying!, description:text, created_at:timestamp with time zone=def, updated_at:timestamp with time zone=def",
    "monthly_accounting_metrics": "id:uuid!=def, month:character varying!, month_label:character varying!, total_revenue:numeric=def, total_expenses:numeric=def, net_result:numeric=def, revenue_count:integer=def, expense_count:integer=def, is_current_month:boolean=def, is_closed:boolean=def, closed_at:timestamp with time zone, created_at:timestamp with time zone=def, updated_at:timestamp with time zone=def",
    "archived_accounting_entries": "id:uuid!=def, year:integer!, user_id:uuid!, original_id:uuid, entry_date:date, description:text, amount:numeric, type:character varying, category:character varying, month_key:character varying, client_id:uuid, created_by:uuid, archived_at:timestamp with time zone=def, original_data:jsonb",
    "procedures": "id:uuid!=def, title:text!, slug:text!, category_id:uuid, tags:ARRAY!=def, content:jsonb!=def, content_text:text, summary:text, author_id:uuid, updated_by:uuid, is_pinned:boolean!=def, is_archived:boolean!=def, created_at:timestamp with time zone!=def, updated_at:timestamp with time zone!=def",
    "procedure_categories": "id:uuid!=def, name:text!, slug:text!, icon:text, color:text, sort_order:integer!=def, created_at:timestamp with time zone!=def",
    "procedure_revisions": "id:uuid!=def, procedure_id:uuid!, title:text!, content:jsonb!, content_text:text, summary:text, change_note:text, edited_by:uuid, edited_at:timestamp with time zone!=def",
    "tasks": "id:uuid!=def, title:text!, description:text, status:text=def, priority:text=def, due_date:timestamp with time zone, assigned_to:uuid, project_id:uuid, created_at:timestamp with time zone=def, updated_at:timestamp with time zone=def, category:character varying=def, user_id:uuid",
    "task_comments": "id:uuid!=def, task_id:uuid!, user_id:uuid!, content:text!, attachments:ARRAY, created_at:timestamp with time zone=def, updated_at:timestamp with time zone=def",
    "personal_tasks": "id:uuid!=def, title:text!, description:text, status:text!=def, priority:text!=def, tags:ARRAY=def, deadline:date, assigned_to:uuid, created_by:uuid=def, created_at:timestamp with time zone=def, updated_at:timestamp with time zone=def",
    "comm_tasks": "id:uuid!=def, project_id:uuid!, title:text!, description:text, status:text!=def, priority:text!=def, due_date:date, due_hour:smallint, assigned_to:uuid, created_at:timestamp with time zone!=def, updated_at:timestamp with time zone!=def",
    "archived_tasks": "id:uuid!=def, year:integer!, user_id:uuid!, original_id:uuid, title:character varying, project_id:uuid, client_id:uuid, status:character varying, assigned_to:uuid, completed_at:date, archived_at:timestamp with time zone=def, original_data:jsonb",
    "posts": "id:uuid!=def, title:text!, type:text!, platform:text!, status:text!=def, strategic_angle:text, hook:text, content:text, objective:text, scheduled_at:timestamp with time zone, published_at:timestamp with time zone, responsible_user_id:uuid, client_id:uuid, created_at:timestamp with time zone!=def, updated_at:timestamp with time zone!=def, external_url:text, external_id:text",
    "post_assets": "id:uuid!=def, post_id:uuid!, asset_url:text, storage_path:text, asset_type:text!, file_name:text, created_at:timestamp with time zone!=def",
    "post_comments": "id:uuid!=def, post_id:uuid!, author_id:uuid!, comment:text!, created_at:timestamp with time zone!=def",
    "post_metrics": "id:uuid!=def, post_id:uuid!, impressions:integer=def, reach:integer=def, engagement:integer=def, clicks:integer=def, shares:integer=def, comments_count:integer=def, saves:integer=def, leads_count:integer=def, revenue:numeric=def, engagement_rate:numeric, performance_score:numeric=def, source:text=def, measured_at:timestamp with time zone=def, created_at:timestamp with time zone=def, updated_at:timestamp with time zone=def",
    "client_posts": "id:uuid!=def, title:text!, type:text!=def, platform:text!=def, status:text!=def, strategic_angle:text, hook:text, content:text, objective:text, scheduled_at:timestamp with time zone, published_at:timestamp with time zone, responsible_user_id:uuid, client_id:uuid, created_at:timestamp with time zone!=def, updated_at:timestamp with time zone!=def",
    "agency_accesses": "id:uuid!=def, category:text!, label:text!, url:text, login_enc:bytea, password_enc:bytea, notes_enc:bytea, status:text!=def, provided_by:text, expires_at:timestamp with time zone, created_at:timestamp with time zone!=def, updated_at:timestamp with time zone!=def",
    "brief_invitations": "id:uuid!=def, token:uuid!=def, company_name:text, status:text!=def, created_at:timestamp with time zone!=def, submitted_at:timestamp with time zone, project_id:uuid, short_code:text",
    "dashboard_metrics": "id:uuid!=def, month:date!, total_revenue:integer!=def, total_expenses:integer!=def, net_result:integer!=def, created_at:timestamp with time zone=def",
    "yearly_stats": "id:uuid!=def, user_id:uuid!, year:integer!, total_income:numeric=def, total_expenses:numeric=def, net_profit:numeric=def, projects_completed:integer=def, tasks_completed:integer=def, new_clients:integer=def, stats_data:jsonb, created_at:timestamp with time zone=def, updated_at:timestamp with time zone=def",
    "company_settings": "id:uuid!=def, company_name:text!=def, company_logo:text, company_address:text, company_phone:text, company_email:text, company_website:text, tax_number:text, default_currency:text=def, default_tax_rate:numeric=def, invoice_prefix:text=def, quote_prefix:text=def, fiscal_year_start:integer=def, settings:jsonb, created_at:timestamp with time zone=def, updated_at:timestamp with time zone=def",
    "users": "id:uuid!=def, auth_user_id:uuid, name:text!, email:text!, avatar_url:text, phone:text, position:text, bio:text, timezone:text=def, language:text=def, is_active:boolean=def, last_login:timestamp with time zone, created_at:timestamp with time zone=def, updated_at:timestamp with time zone=def, role:USER-DEFINED!=def, can_view_dashboard:boolean=def, can_view_leads:boolean=def, can_view_projects:boolean=def, can_view_tasks:boolean=def, can_view_chat:boolean=def, can_view_finance:boolean=def, can_view_settings:boolean=def, can_edit_leads:boolean=def, can_create_projects:boolean=def, can_edit_projects:boolean=def, can_assign_tasks:boolean=def, can_view_crm_bot_one:boolean=def, can_view_crm_erp:boolean=def, can_view_communication:boolean=def, can_view_procedures:boolean!=def, portal_enabled:boolean=def, portal_linked_project_id:uuid, portal_last_login_at:timestamp with time zone, onboarding_completed:boolean!=def",
    "user_profiles": "id:uuid!, name:text!, role:USER-DEFINED!=def, avatar_url:text, phone:text, company:text=def, position:text, bio:text, timezone:text=def, language:text=def, is_active:boolean=def, created_at:timestamp with time zone=def, updated_at:timestamp with time zone=def",
    "user_permissions": "id:uuid!=def, user_id:uuid!, can_view_dashboard:boolean=def, can_view_leads:boolean=def, can_view_projects:boolean=def, can_view_tasks:boolean=def, can_view_chat:boolean=def, can_view_finance:boolean=def, can_view_settings:boolean=def, can_create_leads:boolean=def, can_edit_leads:boolean=def, can_delete_leads:boolean=def, can_create_projects:boolean=def, can_edit_projects:boolean=def, can_assign_tasks:boolean=def, can_view_financial_data:boolean=def, granted_by:uuid, granted_at:timestamp with time zone=def, updated_at:timestamp with time zone=def",
    "notification_settings": "id:uuid!=def, user_id:uuid!, email_notifications:boolean=def, push_notifications:boolean=def, sms_notifications:boolean=def, task_reminders:boolean=def, deadline_alerts:boolean=def, client_updates:boolean=def, marketing_emails:boolean=def, weekly_reports:boolean=def, notification_frequency:text=def, quiet_hours_start:time without time zone=def, quiet_hours_end:time without time zone=def, created_at:timestamp with time zone=def, updated_at:timestamp with time zone=def",
}


def _pg_to_py(pgtype: str) -> str:
    """Mappe un type PostgreSQL vers une étiquette de type Python simple."""
    t = pgtype.strip()
    if t in {"integer", "smallint", "bigint"}:
        return "int"
    if t in {"numeric", "double precision", "real"}:
        return "float"
    if t == "boolean":
        return "bool"
    if t in {"jsonb", "json"}:
        return "json"
    if t == "ARRAY":
        return "array"
    # uuid, text, character varying, USER-DEFINED, date, timestamp*, time* -> texte
    return "str"


@dataclass(frozen=True)
class ColumnSpec:
    name: str
    pg_type: str
    py_type: str            # "str" | "int" | "float" | "bool" | "json" | "array"
    required_create: bool   # NOT NULL sans valeur par défaut
    has_default: bool
    sensitive: bool         # colonne chiffrée (*_enc) -> jamais lue ni écrite
    enum_values: tuple[str, ...] | None


@dataclass(frozen=True)
class TableSpec:
    table: str
    section: str
    singular: str
    plural: str
    label: str
    ops: tuple[str, ...]
    columns: tuple[ColumnSpec, ...]

    def column(self, name: str) -> ColumnSpec | None:
        return next((c for c in self.columns if c.name == name), None)

    @property
    def selectable_columns(self) -> list[str]:
        """Colonnes lisibles (exclut les colonnes chiffrées)."""
        return [c.name for c in self.columns if not c.sensitive]

    @property
    def select_clause(self) -> str:
        return ",".join(self.selectable_columns)

    @property
    def writable_columns(self) -> list[ColumnSpec]:
        """Colonnes acceptées en création/modification (exclut gérées + chiffrées)."""
        return [c for c in self.columns if c.name not in MANAGED_COLUMNS and not c.sensitive]

    @property
    def required_create_columns(self) -> list[str]:
        return [c.name for c in self.writable_columns if c.required_create]


def _parse_columns(table: str, raw: str) -> tuple[ColumnSpec, ...]:
    cols: list[ColumnSpec] = []
    for token in raw.split(", "):
        name, _, rest = token.partition(":")
        name = name.strip()
        rest = rest.strip()
        has_default = rest.endswith("=def")
        if has_default:
            rest = rest[:-4]
        not_null = rest.endswith("!")
        if not_null:
            rest = rest[:-1]
        pg_type = rest.strip()
        sensitive = name.endswith("_enc")
        enum_name = ENUM_COLUMNS.get((table, name))
        enum_values = tuple(ENUM_VALUES[enum_name]) if enum_name else None
        required_create = not_null and not has_default and name not in MANAGED_COLUMNS
        cols.append(ColumnSpec(
            name=name,
            pg_type=pg_type,
            py_type=_pg_to_py(pg_type),
            required_create=required_create,
            has_default=has_default,
            sensitive=sensitive,
            enum_values=enum_values,
        ))
    return tuple(cols)


def _build_registry() -> dict[str, TableSpec]:
    registry: dict[str, TableSpec] = {}
    for table, raw in RAW_SCHEMA.items():
        meta = TABLE_META.get(table)
        if not meta:
            continue
        section, singular, plural, label, ops = meta
        registry[table] = TableSpec(
            table=table,
            section=section,
            singular=singular,
            plural=plural,
            label=label,
            ops=ops,
            columns=_parse_columns(table, raw),
        )
    return registry


# Registre prêt à l'emploi.
REGISTRY: dict[str, TableSpec] = _build_registry()


def get_spec(table: str) -> TableSpec:
    spec = REGISTRY.get(table)
    if spec is None:
        known = ", ".join(sorted(REGISTRY))
        raise KeyError(f"Table inconnue '{table}'. Tables disponibles : {known}")
    return spec
