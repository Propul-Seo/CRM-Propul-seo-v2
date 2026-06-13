"""Section Communication — outils nommés et typés (`comm_*`).

Tables couvertes (cf. registry.py) :
  - posts         : posts/contenus produits          CRUD complet
  - post_assets   : médias attachés à un post         list/get/create/delete
  - post_comments : commentaires internes sur un post list/get/create/delete
  - post_metrics  : métriques de performance d'un post CRUD complet
  - client_posts  : posts côté client                 CRUD complet

NB : type / platform / status sont des colonnes TEXT (valeurs libres selon l'app).
"""
from __future__ import annotations

from typing import Any

from mcp.server.fastmcp import FastMCP

from .. import crud
from ..context import get_context
from ._helpers import compact


def register(mcp: FastMCP) -> None:
    # ===================== POSTS (posts) =====================

    @mcp.tool()
    def comm_list_posts(search: str | None = None, status: str | None = None,
                        platform: str | None = None, type: str | None = None,
                        client_id: str | None = None, limit: int = 50,
                        offset: int = 0) -> dict[str, Any]:
        """Liste les posts/contenus (table `posts`)."""
        filters: dict[str, Any] = {}
        if status:
            filters["status"] = status
        if platform:
            filters["platform"] = platform
        if type:
            filters["type"] = type
        if client_id:
            filters["client_id"] = client_id
        if search:
            term = f"*{search}*"
            filters["or"] = f"(title.ilike.{term},hook.ilike.{term},content.ilike.{term})"
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "posts", filters=filters,
                              order="created_at.desc", limit=limit, offset=offset)

    @mcp.tool()
    def comm_get_post(post_id: str) -> dict[str, Any]:
        """Détail d'un post par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "posts", post_id)

    @mcp.tool()
    def comm_create_post(title: str, type: str, platform: str, status: str | None = None,
                         strategic_angle: str | None = None, hook: str | None = None,
                         content: str | None = None, objective: str | None = None,
                         scheduled_at: str | None = None, published_at: str | None = None,
                         responsible_user_id: str | None = None, client_id: str | None = None,
                         external_url: str | None = None,
                         external_id: str | None = None) -> dict[str, Any]:
        """Crée un post. Obligatoires : title, type, platform."""
        ctx = get_context()
        data = compact(title=title, type=type, platform=platform, status=status,
                       strategic_angle=strategic_angle, hook=hook, content=content,
                       objective=objective, scheduled_at=scheduled_at, published_at=published_at,
                       responsible_user_id=responsible_user_id, client_id=client_id,
                       external_url=external_url, external_id=external_id)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "posts", data)

    @mcp.tool()
    def comm_update_post(post_id: str, title: str | None = None, type: str | None = None,
                         platform: str | None = None, status: str | None = None,
                         strategic_angle: str | None = None, hook: str | None = None,
                         content: str | None = None, objective: str | None = None,
                         scheduled_at: str | None = None, published_at: str | None = None,
                         responsible_user_id: str | None = None, client_id: str | None = None,
                         external_url: str | None = None, external_id: str | None = None,
                         confirm: bool = False) -> dict[str, Any]:
        """Modifie un post. Sans confirm=true : diff ; avec : applique (sauf dry-run)."""
        ctx = get_context()
        data = compact(title=title, type=type, platform=platform, status=status,
                       strategic_angle=strategic_angle, hook=hook, content=content,
                       objective=objective, scheduled_at=scheduled_at, published_at=published_at,
                       responsible_user_id=responsible_user_id, client_id=client_id,
                       external_url=external_url, external_id=external_id)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "posts",
                              post_id, data, confirm=confirm)

    @mcp.tool()
    def comm_delete_post(post_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime un post. Exige confirm=true."""
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "posts",
                              post_id, confirm=confirm)

    # ===================== MÉDIAS (post_assets) — list/get/create/delete =====================

    @mcp.tool()
    def comm_list_post_assets(post_id: str, limit: int = 100, offset: int = 0) -> dict[str, Any]:
        """Liste les médias d'un post (table `post_assets`)."""
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "post_assets",
                              filters={"post_id": post_id}, order="created_at.asc",
                              limit=limit, offset=offset)

    @mcp.tool()
    def comm_get_post_asset(asset_id: str) -> dict[str, Any]:
        """Détail d'un média de post par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "post_assets", asset_id)

    @mcp.tool()
    def comm_create_post_asset(post_id: str, asset_type: str, asset_url: str | None = None,
                               storage_path: str | None = None,
                               file_name: str | None = None) -> dict[str, Any]:
        """Enregistre la métadonnée d'un média de post. Obligatoires : post_id, asset_type.

        Ne téléverse pas le binaire (Storage non géré) : `asset_url`/`storage_path`
        doivent référencer un fichier déjà présent.
        """
        ctx = get_context()
        data = compact(post_id=post_id, asset_type=asset_type, asset_url=asset_url,
                       storage_path=storage_path, file_name=file_name)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "post_assets", data)

    @mcp.tool()
    def comm_delete_post_asset(asset_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime la métadonnée d'un média de post. Exige confirm=true."""
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "post_assets",
                              asset_id, confirm=confirm)

    # ===================== COMMENTAIRES (post_comments) — list/get/create/delete =====================

    @mcp.tool()
    def comm_list_post_comments(post_id: str, limit: int = 100, offset: int = 0) -> dict[str, Any]:
        """Liste les commentaires internes d'un post (table `post_comments`)."""
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "post_comments",
                              filters={"post_id": post_id}, order="created_at.asc",
                              limit=limit, offset=offset)

    @mcp.tool()
    def comm_get_post_comment(comment_id: str) -> dict[str, Any]:
        """Détail d'un commentaire de post par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "post_comments", comment_id)

    @mcp.tool()
    def comm_create_post_comment(post_id: str, author_id: str, comment: str) -> dict[str, Any]:
        """Ajoute un commentaire interne à un post. Obligatoires : post_id, author_id, comment."""
        ctx = get_context()
        data = compact(post_id=post_id, author_id=author_id, comment=comment)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "post_comments", data)

    @mcp.tool()
    def comm_delete_post_comment(comment_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime un commentaire de post. Exige confirm=true."""
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "post_comments",
                              comment_id, confirm=confirm)

    # ===================== MÉTRIQUES (post_metrics) =====================

    @mcp.tool()
    def comm_list_post_metrics(post_id: str | None = None, limit: int = 100,
                               offset: int = 0) -> dict[str, Any]:
        """Liste les métriques de performance (table `post_metrics`)."""
        filters: dict[str, Any] = {}
        if post_id:
            filters["post_id"] = post_id
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "post_metrics", filters=filters,
                              order="measured_at.desc", limit=limit, offset=offset)

    @mcp.tool()
    def comm_get_post_metric(metric_id: str) -> dict[str, Any]:
        """Détail d'une métrique de post par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "post_metrics", metric_id)

    @mcp.tool()
    def comm_create_post_metric(post_id: str, impressions: int | None = None, reach: int | None = None,
                                engagement: int | None = None, clicks: int | None = None,
                                shares: int | None = None, comments_count: int | None = None,
                                saves: int | None = None, leads_count: int | None = None,
                                revenue: float | None = None, engagement_rate: float | None = None,
                                performance_score: float | None = None, source: str | None = None,
                                measured_at: str | None = None) -> dict[str, Any]:
        """Crée un relevé de métriques pour un post. Obligatoire : post_id."""
        ctx = get_context()
        data = compact(post_id=post_id, impressions=impressions, reach=reach, engagement=engagement,
                       clicks=clicks, shares=shares, comments_count=comments_count, saves=saves,
                       leads_count=leads_count, revenue=revenue, engagement_rate=engagement_rate,
                       performance_score=performance_score, source=source, measured_at=measured_at)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "post_metrics", data)

    @mcp.tool()
    def comm_update_post_metric(metric_id: str, impressions: int | None = None, reach: int | None = None,
                                engagement: int | None = None, clicks: int | None = None,
                                shares: int | None = None, comments_count: int | None = None,
                                saves: int | None = None, leads_count: int | None = None,
                                revenue: float | None = None, engagement_rate: float | None = None,
                                performance_score: float | None = None, source: str | None = None,
                                measured_at: str | None = None, confirm: bool = False) -> dict[str, Any]:
        """Modifie un relevé de métriques. confirm=true requis (sauf dry-run)."""
        ctx = get_context()
        data = compact(impressions=impressions, reach=reach, engagement=engagement, clicks=clicks,
                       shares=shares, comments_count=comments_count, saves=saves,
                       leads_count=leads_count, revenue=revenue, engagement_rate=engagement_rate,
                       performance_score=performance_score, source=source, measured_at=measured_at)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "post_metrics",
                              metric_id, data, confirm=confirm)

    @mcp.tool()
    def comm_delete_post_metric(metric_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime un relevé de métriques. Exige confirm=true."""
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "post_metrics",
                              metric_id, confirm=confirm)

    # ===================== POSTS CLIENT (client_posts) =====================

    @mcp.tool()
    def comm_list_client_posts(search: str | None = None, status: str | None = None,
                               platform: str | None = None, client_id: str | None = None,
                               limit: int = 50, offset: int = 0) -> dict[str, Any]:
        """Liste les posts côté client (table `client_posts`)."""
        filters: dict[str, Any] = {}
        if status:
            filters["status"] = status
        if platform:
            filters["platform"] = platform
        if client_id:
            filters["client_id"] = client_id
        if search:
            term = f"*{search}*"
            filters["or"] = f"(title.ilike.{term},hook.ilike.{term})"
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "client_posts", filters=filters,
                              order="created_at.desc", limit=limit, offset=offset)

    @mcp.tool()
    def comm_get_client_post(post_id: str) -> dict[str, Any]:
        """Détail d'un post client par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "client_posts", post_id)

    @mcp.tool()
    def comm_create_client_post(title: str, type: str | None = None, platform: str | None = None,
                                status: str | None = None, strategic_angle: str | None = None,
                                hook: str | None = None, content: str | None = None,
                                objective: str | None = None, scheduled_at: str | None = None,
                                published_at: str | None = None, responsible_user_id: str | None = None,
                                client_id: str | None = None) -> dict[str, Any]:
        """Crée un post client. Obligatoire : title."""
        ctx = get_context()
        data = compact(title=title, type=type, platform=platform, status=status,
                       strategic_angle=strategic_angle, hook=hook, content=content,
                       objective=objective, scheduled_at=scheduled_at, published_at=published_at,
                       responsible_user_id=responsible_user_id, client_id=client_id)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "client_posts", data)

    @mcp.tool()
    def comm_update_client_post(post_id: str, title: str | None = None, type: str | None = None,
                                platform: str | None = None, status: str | None = None,
                                strategic_angle: str | None = None, hook: str | None = None,
                                content: str | None = None, objective: str | None = None,
                                scheduled_at: str | None = None, published_at: str | None = None,
                                responsible_user_id: str | None = None, client_id: str | None = None,
                                confirm: bool = False) -> dict[str, Any]:
        """Modifie un post client. confirm=true requis (sauf dry-run)."""
        ctx = get_context()
        data = compact(title=title, type=type, platform=platform, status=status,
                       strategic_angle=strategic_angle, hook=hook, content=content,
                       objective=objective, scheduled_at=scheduled_at, published_at=published_at,
                       responsible_user_id=responsible_user_id, client_id=client_id)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "client_posts",
                              post_id, data, confirm=confirm)

    @mcp.tool()
    def comm_delete_client_post(post_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime un post client. Exige confirm=true."""
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "client_posts",
                              post_id, confirm=confirm)
