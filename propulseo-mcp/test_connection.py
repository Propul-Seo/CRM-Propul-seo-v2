#!/usr/bin/env python3
"""Test de connexion AVANT de brancher le MCP.

Vérifie que la configuration (.env) est correcte, que l'authentification
service_role fonctionne, et liste quelques objets pour confirmer l'accès lecture.

Usage :
    python test_connection.py
"""
from __future__ import annotations

import sys

from propulseo_mcp.client import PostgRESTError, SupabaseRestClient
from propulseo_mcp.config import ConfigError, get_settings
from propulseo_mcp.crud import op_list


def main() -> int:
    print("=== Test de connexion — MCP Propul'SEO CRM ===\n")

    # 1. Configuration
    try:
        settings = get_settings()
    except ConfigError as exc:
        print(f"[X] Configuration : {exc}")
        print("    -> Copiez .env.example en .env et renseignez SUPABASE_SERVICE_ROLE_KEY.")
        return 1

    masked = settings.supabase_url[:28] + "…"
    print(f"[OK] Config chargée")
    print(f"     URL      : {masked}")
    print(f"     Schéma   : {settings.schema_name}")
    print(f"     Dry-run  : {settings.dry_run}  "
          f"({'écritures simulées' if settings.dry_run else 'ÉCRITURES RÉELLES'})\n")

    client = SupabaseRestClient(settings)

    # 2. Authentification / connexion
    try:
        client.ping()
        print("[OK] Authentification service_role : connexion réussie.\n")
    except PostgRESTError as exc:
        print(f"[X] Connexion échouée : {exc}")
        print("    -> Vérifiez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.")
        return 1

    # 3. Lecture d'un objet réel
    try:
        res = op_list(client, "contacts", limit=3, columns="id,name,email,status")
        print(f"[OK] Lecture 'contacts' : {res['total']} au total, "
              f"{res['count']} affiché(s) :")
        for row in res["rows"]:
            print(f"     - {row.get('name')}  <{row.get('email')}>  [{row.get('status')}]")
    except PostgRESTError as exc:
        print(f"[X] Lecture échouée : {exc}")
        return 1

    print("\n=== Tout est OK. Le MCP est prêt à être branché. ===")
    client.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
