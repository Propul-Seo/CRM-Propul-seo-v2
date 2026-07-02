"""Enums partagés (valeurs réelles des types ENUM PostgreSQL du CRM).

Ces valeurs ont été extraites directement de la base ERP (pg_enum).
Utilisées pour la validation et pour documenter les outils.
"""
from __future__ import annotations

# Valeurs exactes des types ENUM de la base (schéma public).
ENUM_VALUES: dict[str, list[str]] = {
    "activity_status": ["scheduled", "completed", "cancelled"],
    "activity_type": ["call", "email", "meeting", "note", "task"],
    # Nettoyé par la migration 303 (2026-07-02) : 4 valeurs mortes retirées,
    # 'perdu' conservé. Ordre funnel.
    "client_status": [
        "prospect", "meeting_booke", "presentation_envoyee", "offre_envoyee",
        "en_attente", "signe", "perdu",
    ],
    "event_type": ["rdv_client", "deadline", "livraison", "suivi", "marketing", "formation"],
    "invoice_status": ["draft", "sent", "paid", "overdue", "cancelled"],
    "project_contact_role": ["primary", "decision_maker", "technical", "billing", "other"],
    "project_status": ["planning", "in_progress", "review", "completed", "on_hold"],
    "task_priority": ["low", "medium", "high", "urgent"],
    "task_status": ["todo", "in_progress", "waiting", "done"],
    "user_role": ["admin", "sales", "marketing", "developer", "manager", "ops"],
}

# Rattachement (table, colonne) -> type ENUM, pour les colonnes USER-DEFINED.
ENUM_COLUMNS: dict[tuple[str, str], str] = {
    ("clients", "status"): "client_status",
    ("contacts", "status"): "client_status",
    ("contact_activities", "status"): "activity_status",
    ("contact_activities", "type"): "activity_type",
    ("project_contacts", "role"): "project_contact_role",
    ("user_profiles", "role"): "user_role",
    ("users", "role"): "user_role",
}
