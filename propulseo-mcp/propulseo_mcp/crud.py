"""Logique CRUD haut-niveau : validation, dry-run, confirmation des suppressions.

Toutes les fonctions retournent un dict JSON-sérialisable destiné à être renvoyé
tel quel par un outil MCP. Le champ `status` indique l'issue :
  - "ok"           : opération de lecture/écriture réellement effectuée
  - "dry_run"      : écriture simulée (MCP_DRY_RUN=true) — rien n'a été modifié
  - "confirm_required" : modification (update) ou suppression (delete) en attente
                         de confirm=true — un aperçu/diff est renvoyé, rien n'est écrit
  - "error"        : opération refusée (validation/opération non autorisée)
"""
from __future__ import annotations

from typing import Any

from .client import PostgRESTError, SupabaseRestClient
from .config import Settings
from .registry import TableSpec, get_spec

# Opérateurs PostgREST reconnus en tête de valeur de filtre (ex. "gte.100").
_PG_OPERATORS = {
    "eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "is", "in",
    "cs", "cd", "fts", "plfts", "phfts", "wfts", "not",
}


class ValidationError(ValueError):
    """Erreur de validation d'un payload (colonne inconnue, enum, champ manquant)."""


# ---------------------------------------------------------------------------
# Outils internes
# ---------------------------------------------------------------------------

def _format_filter_value(value: Any) -> str:
    """Transforme une valeur de filtre en clause PostgREST.

    - "gte.100", "ilike.*acme*", "in.(a,b)" => utilisé tel quel (opérateur explicite)
    - autre valeur scalaire                  => "eq.<valeur>" (égalité)
    - None                                   => "is.null"
    """
    if value is None:
        return "is.null"
    if isinstance(value, bool):
        return f"eq.{str(value).lower()}"
    if isinstance(value, str):
        prefix = value.split(".", 1)[0]
        if prefix in _PG_OPERATORS:
            return value
        return f"eq.{value}"
    return f"eq.{value}"


# Clés logiques PostgREST dont la valeur est déjà une clause complète.
_RESERVED_KEYS = {"or", "and", "not"}


def build_filters(raw: dict[str, Any] | None) -> dict[str, str]:
    """Construit le dict de filtres PostgREST à partir d'un dict {colonne: valeur}.

    Les clés logiques (`or`, `and`, `not`) sont laissées intactes : leur valeur
    est supposée déjà au format PostgREST, ex. or="(name.ilike.*x*,email.ilike.*x*)".
    """
    if not raw:
        return {}
    out: dict[str, str] = {}
    for col, val in raw.items():
        out[col] = str(val) if col in _RESERVED_KEYS else _format_filter_value(val)
    return out


def _coerce_value(col_name: str, py_type: str, value: Any) -> Any:
    """Coercition douce d'une valeur selon le type attendu de la colonne."""
    if value is None:
        return None
    try:
        if py_type == "int":
            return int(value)
        if py_type == "float":
            return float(value)
        if py_type == "bool":
            if isinstance(value, bool):
                return value
            return str(value).strip().lower() in {"1", "true", "yes", "oui", "on"}
        if py_type == "array" and not isinstance(value, list):
            raise ValidationError(f"'{col_name}' doit être une liste.")
        # json/str : laissés tels quels
        return value
    except (ValueError, TypeError) as exc:
        raise ValidationError(f"'{col_name}' : valeur invalide pour le type {py_type} ({exc}).") from exc


def validate_payload(spec: TableSpec, data: dict[str, Any], *, partial: bool) -> dict[str, Any]:
    """Valide et nettoie un payload d'écriture contre le schéma de la table.

    - rejette les colonnes inconnues, gérées (id/created_at/...) ou chiffrées ;
    - vérifie l'appartenance aux enums ;
    - en création (partial=False), exige les colonnes NOT NULL sans défaut ;
    - coercition de type douce (int/float/bool/array).
    """
    writable = {c.name: c for c in spec.writable_columns}
    cleaned: dict[str, Any] = {}

    for key, value in data.items():
        col = writable.get(key)
        if col is None:
            # Colonne inconnue OU non inscriptible (gérée/chiffrée)
            if spec.column(key) is not None:
                raise ValidationError(
                    f"Colonne '{key}' non modifiable (gérée automatiquement ou chiffrée)."
                )
            raise ValidationError(
                f"Colonne inconnue '{key}' pour '{spec.table}'. "
                f"Colonnes acceptées : {', '.join(sorted(writable))}."
            )
        if col.enum_values and value is not None and value not in col.enum_values:
            raise ValidationError(
                f"'{key}' = '{value}' invalide. Valeurs autorisées : {', '.join(col.enum_values)}."
            )
        cleaned[key] = _coerce_value(key, col.py_type, value)

    if not partial:
        missing = [c for c in spec.required_create_columns if c not in cleaned]
        if missing:
            raise ValidationError(
                f"Champs obligatoires manquants pour créer un(e) {spec.label} : {', '.join(missing)}."
            )
    elif not cleaned:
        raise ValidationError("Aucune colonne à modifier n'a été fournie.")

    return cleaned


def _ensure_op(spec: TableSpec, op: str) -> None:
    if op not in spec.ops:
        raise ValidationError(
            f"Opération '{op}' non autorisée sur '{spec.table}' "
            f"(autorisées : {', '.join(spec.ops)})."
        )


# ---------------------------------------------------------------------------
# Opérations exposées
# ---------------------------------------------------------------------------

def op_list(client: SupabaseRestClient, table: str, *, filters: dict | None = None,
            order: str | None = None, limit: int = 50, offset: int = 0,
            columns: str | None = None) -> dict[str, Any]:
    spec = get_spec(table)
    _ensure_op(spec, "list")
    limit = max(1, min(int(limit), 1000))
    select = columns or spec.select_clause
    rows, total = client.select(
        table, columns=select, filters=build_filters(filters),
        order=order, limit=limit, offset=offset, count=True,
    )
    return {"status": "ok", "table": table, "count": len(rows), "total": total,
            "limit": limit, "offset": offset, "rows": rows}


def op_get(client: SupabaseRestClient, table: str, row_id: str,
           columns: str | None = None) -> dict[str, Any]:
    spec = get_spec(table)
    _ensure_op(spec, "get")
    select = columns or spec.select_clause
    rows, _ = client.select(table, columns=select,
                            filters={"id": f"eq.{row_id}"}, limit=1)
    if not rows:
        return {"status": "error", "error": f"Aucun(e) {spec.label} avec id={row_id}."}
    return {"status": "ok", "table": table, "row": rows[0]}


def op_create(client: SupabaseRestClient, settings: Settings, table: str,
              data: dict[str, Any]) -> dict[str, Any]:
    spec = get_spec(table)
    _ensure_op(spec, "create")
    payload = validate_payload(spec, data, partial=False)
    if settings.dry_run:
        return {"status": "dry_run", "action": "create", "table": table,
                "would_insert": payload,
                "message": "Dry-run actif : rien n'a été créé. Passez MCP_DRY_RUN=false pour exécuter."}
    rows = client.insert(table, payload)
    return {"status": "ok", "action": "create", "table": table,
            "row": rows[0] if rows else None}


def _build_diff(current: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    """Diff avant/après limité aux colonnes réellement modifiées par le payload."""
    return {
        col: {"avant": current.get(col), "apres": new_val}
        for col, new_val in payload.items()
        if current.get(col) != new_val
    }


def op_update(client: SupabaseRestClient, settings: Settings, table: str,
              row_id: str, data: dict[str, Any], *, confirm: bool = False) -> dict[str, Any]:
    spec = get_spec(table)
    _ensure_op(spec, "update")
    payload = validate_payload(spec, data, partial=True)

    # 1) On récupère TOUJOURS la ligne ciblée pour produire un aperçu + diff
    #    (lecture seule — ne modifie rien).
    rows, _ = client.select(table, columns=spec.select_clause,
                            filters={"id": f"eq.{row_id}"}, limit=1)
    if not rows:
        return {"status": "error", "error": f"Aucun(e) {spec.label} avec id={row_id}."}
    current = rows[0]
    diff = _build_diff(current, payload)

    if not diff:
        return {"status": "ok", "action": "update", "table": table, "id": row_id,
                "row": current, "diff": {},
                "message": "Aucun changement : les valeurs fournies sont déjà en place."}

    # 2) Garde « confirmation » : sans confirm=true, on montre le diff sans rien écrire.
    if not confirm:
        return {"status": "confirm_required", "action": "update", "table": table,
                "id": row_id, "diff": diff,
                "message": "Modification NON exécutée. Vérifiez le diff (avant/après) puis "
                           "rappelez l'outil avec confirm=true pour appliquer."}

    # 3) Garde globale « dry-run » : même confirmé, rien n'est écrit si dry-run actif.
    if settings.dry_run:
        return {"status": "dry_run", "action": "update", "table": table, "id": row_id,
                "would_update": payload, "diff": diff,
                "message": "Dry-run actif : rien n'a été modifié malgré confirm=true. "
                           "Passez MCP_DRY_RUN=false pour exécuter réellement."}

    # 4) Exécution réelle.
    updated = client.update(table, {"id": f"eq.{row_id}"}, payload)
    if not updated:
        return {"status": "error", "error": f"Aucun(e) {spec.label} avec id={row_id} (rien modifié)."}
    return {"status": "ok", "action": "update", "table": table, "row": updated[0], "diff": diff}


def op_delete(client: SupabaseRestClient, settings: Settings, table: str,
              row_id: str, *, confirm: bool = False) -> dict[str, Any]:
    spec = get_spec(table)
    _ensure_op(spec, "delete")

    # Toujours montrer d'abord ce qui sera supprimé.
    rows, _ = client.select(table, columns=spec.select_clause,
                            filters={"id": f"eq.{row_id}"}, limit=1)
    if not rows:
        return {"status": "error", "error": f"Aucun(e) {spec.label} avec id={row_id}."}
    target = rows[0]

    if not confirm:
        return {"status": "confirm_required", "action": "delete", "table": table,
                "id": row_id, "to_delete": target,
                "message": "Suppression NON exécutée. Rappelez l'outil avec confirm=true pour confirmer."}

    if settings.dry_run:
        return {"status": "dry_run", "action": "delete", "table": table, "id": row_id,
                "would_delete": target,
                "message": "Dry-run actif : rien n'a été supprimé malgré confirm=true. "
                           "Passez MCP_DRY_RUN=false pour exécuter réellement."}

    deleted = client.delete(table, {"id": f"eq.{row_id}"})
    return {"status": "ok", "action": "delete", "table": table, "id": row_id,
            "deleted": deleted[0] if deleted else target}


def safe_call(fn, *args, **kwargs) -> dict[str, Any]:
    """Enveloppe une opération pour transformer les exceptions en réponse propre."""
    try:
        return fn(*args, **kwargs)
    except ValidationError as exc:
        return {"status": "error", "error": str(exc)}
    except PostgRESTError as exc:
        return {"status": "error", "error": str(exc), "code": exc.code}
    except KeyError as exc:
        return {"status": "error", "error": str(exc).strip('"')}
