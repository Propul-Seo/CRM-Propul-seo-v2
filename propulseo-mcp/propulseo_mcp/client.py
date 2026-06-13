"""Couche d'accès HTTP à l'API REST Supabase (PostgREST).

Cette classe ne fait QUE des appels HTTP bruts (select/insert/update/delete).
La logique métier (dry-run, confirmation, validation) vit dans `crud.py`.

Authentification : clé service_role passée à la fois dans `apikey` et
`Authorization: Bearer ...` (PostgREST exige les deux). service_role ignore les
RLS — c'est le choix retenu pour ce MCP interne.
"""
from __future__ import annotations

import time
from typing import Any

import httpx

from .config import Settings


class PostgRESTError(RuntimeError):
    """Erreur renvoyée par PostgREST (4xx/5xx) ou réseau, message lisible."""

    def __init__(self, status: int | None, message: str, *, details: str | None = None,
                 hint: str | None = None, code: str | None = None) -> None:
        self.status = status
        self.message = message
        self.details = details
        self.hint = hint
        self.code = code
        parts = [f"HTTP {status}" if status else "Erreur réseau", message]
        if details:
            parts.append(f"détails: {details}")
        if hint:
            parts.append(f"piste: {hint}")
        super().__init__(" — ".join(p for p in parts if p))


class SupabaseRestClient:
    """Client minimal et robuste pour PostgREST."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client = httpx.Client(
            base_url=settings.rest_url,
            timeout=settings.http_timeout,
            headers={
                "apikey": settings.service_role_key,
                "Authorization": f"Bearer {settings.service_role_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                # Schéma ciblé (utile si schema != public)
                "Accept-Profile": settings.schema_name,
                "Content-Profile": settings.schema_name,
                "X-Client-Info": "propulseo-mcp/0.1.0",
            },
        )

    def close(self) -> None:
        self._client.close()

    # ---- Cœur : exécution avec retry léger -------------------------------

    def _request(self, method: str, path: str, *, params: dict | None = None,
                 json: Any | None = None, prefer: str | None = None) -> httpx.Response:
        headers = {"Prefer": prefer} if prefer else None
        last_exc: Exception | None = None
        attempts = self._settings.max_retries + 1

        for attempt in range(attempts):
            try:
                resp = self._client.request(method, path, params=params, json=json, headers=headers)
            except httpx.TransportError as exc:  # DNS, connexion, timeout réseau
                last_exc = exc
                if attempt < attempts - 1:
                    time.sleep(0.4 * (attempt + 1))
                    continue
                raise PostgRESTError(None, f"échec réseau après {attempts} tentatives: {exc}") from exc

            # Retry uniquement sur 5xx (erreurs serveur transitoires)
            if resp.status_code >= 500 and attempt < attempts - 1:
                time.sleep(0.4 * (attempt + 1))
                continue

            if resp.status_code >= 400:
                self._raise_from_response(resp)
            return resp

        # Théoriquement inatteignable
        raise PostgRESTError(None, f"échec inattendu: {last_exc}")

    @staticmethod
    def _raise_from_response(resp: httpx.Response) -> None:
        body: dict[str, Any] = {}
        try:
            body = resp.json()
        except Exception:
            pass
        message = body.get("message") or resp.text or "erreur PostgREST"
        raise PostgRESTError(
            resp.status_code,
            message,
            details=body.get("details"),
            hint=body.get("hint"),
            code=body.get("code"),
        )

    @staticmethod
    def _json(resp: httpx.Response) -> Any:
        if not resp.content:
            return None
        try:
            return resp.json()
        except Exception:
            return None

    # ---- Opérations CRUD --------------------------------------------------

    def select(self, table: str, *, columns: str = "*", filters: dict[str, str] | None = None,
               order: str | None = None, limit: int | None = None, offset: int | None = None,
               count: bool = False) -> tuple[list[dict], int | None]:
        """SELECT. `filters` = {colonne: "op.valeur"} déjà formaté PostgREST.

        Retourne (lignes, total) ; total non-None seulement si count=True.
        """
        params: dict[str, Any] = {"select": columns}
        if filters:
            params.update(filters)
        if order:
            params["order"] = order
        if limit is not None:
            params["limit"] = limit
        if offset is not None:
            params["offset"] = offset

        prefer = "count=exact" if count else None
        resp = self._request("GET", f"/{table}", params=params, prefer=prefer)
        rows = self._json(resp) or []
        total = None
        if count:
            # En-tête Content-Range: "0-9/42"
            content_range = resp.headers.get("content-range", "")
            if "/" in content_range:
                tail = content_range.split("/")[-1]
                total = int(tail) if tail.isdigit() else None
        return rows, total

    def insert(self, table: str, data: dict | list[dict]) -> list[dict]:
        """INSERT, retourne la/les ligne(s) créée(s)."""
        resp = self._request("POST", f"/{table}", json=data, prefer="return=representation")
        return self._json(resp) or []

    def update(self, table: str, filters: dict[str, str], data: dict) -> list[dict]:
        """UPDATE filtré (PATCH), retourne la/les ligne(s) modifiée(s)."""
        resp = self._request("PATCH", f"/{table}", params=filters, json=data,
                             prefer="return=representation")
        return self._json(resp) or []

    def delete(self, table: str, filters: dict[str, str]) -> list[dict]:
        """DELETE filtré, retourne la/les ligne(s) supprimée(s)."""
        resp = self._request("DELETE", f"/{table}", params=filters,
                             prefer="return=representation")
        return self._json(resp) or []

    def ping(self) -> bool:
        """Vérifie la connexion (lecture légère sur `users`)."""
        self._request("GET", "/users", params={"select": "id", "limit": 1})
        return True
