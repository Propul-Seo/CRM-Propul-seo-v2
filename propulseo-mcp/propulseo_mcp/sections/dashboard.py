"""Section Dashboard — outils nommés (`dashboard_*`), lecture seule.

Tables couvertes (cf. registry.py) :
  - dashboard_metrics : métriques mensuelles (CA/dépenses/résultat)  lecture seule
  - yearly_stats      : statistiques annuelles consolidées            lecture seule
"""
from __future__ import annotations

from typing import Any

from mcp.server.fastmcp import FastMCP

from .. import crud
from ..context import get_context


def register(mcp: FastMCP) -> None:
    @mcp.tool()
    def dashboard_list_metrics(limit: int = 36, offset: int = 0) -> dict[str, Any]:
        """Liste les métriques mensuelles du dashboard (table `dashboard_metrics`, lecture seule)."""
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "dashboard_metrics",
                              order="month.desc", limit=limit, offset=offset)

    @mcp.tool()
    def dashboard_get_metric(metric_id: str) -> dict[str, Any]:
        """Détail d'une métrique mensuelle du dashboard par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "dashboard_metrics", metric_id)

    @mcp.tool()
    def dashboard_list_yearly_stats(year: int | None = None, limit: int = 20,
                                    offset: int = 0) -> dict[str, Any]:
        """Liste les statistiques annuelles (table `yearly_stats`, lecture seule)."""
        filters: dict[str, Any] = {}
        if year is not None:
            filters["year"] = year
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "yearly_stats", filters=filters,
                              order="year.desc", limit=limit, offset=offset)

    @mcp.tool()
    def dashboard_get_yearly_stat(stat_id: str) -> dict[str, Any]:
        """Détail d'une statistique annuelle par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "yearly_stats", stat_id)
