"""Section Tâches — outils nommés et typés (`taches_*`).

Tables couvertes (cf. registry.py) :
  - tasks          : tâches (liées projet/client)   CRUD complet
  - task_comments  : commentaires de tâche          list/get/create/delete
  - personal_tasks : tâches personnelles             CRUD complet
  - comm_tasks     : tâches de communication         CRUD complet
  - archived_tasks : tâches archivées par année      lecture seule

NB : status/priority sont des colonnes TEXT. Valeurs usuelles :
  status   -> todo, in_progress, waiting, done
  priority -> low, medium, high, urgent
"""
from __future__ import annotations

from typing import Any

from mcp.server.fastmcp import FastMCP

from .. import crud
from ..context import get_context
from ._helpers import compact


def register(mcp: FastMCP) -> None:
    # ===================== TÂCHES (tasks) =====================

    @mcp.tool()
    def taches_list_tasks(status: str | None = None, priority: str | None = None,
                          assigned_to: str | None = None, project_id: str | None = None,
                          search: str | None = None, limit: int = 50,
                          offset: int = 0) -> dict[str, Any]:
        """Liste les tâches (table `tasks`). status usuels : todo, in_progress, waiting, done."""
        filters: dict[str, Any] = {}
        if status:
            filters["status"] = status
        if priority:
            filters["priority"] = priority
        if assigned_to:
            filters["assigned_to"] = assigned_to
        if project_id:
            filters["project_id"] = project_id
        if search:
            term = f"*{search}*"
            filters["or"] = f"(title.ilike.{term},description.ilike.{term})"
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "tasks", filters=filters,
                              order="due_date.asc", limit=limit, offset=offset)

    @mcp.tool()
    def taches_get_task(task_id: str) -> dict[str, Any]:
        """Détail d'une tâche par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "tasks", task_id)

    @mcp.tool()
    def taches_create_task(title: str, description: str | None = None, status: str | None = None,
                           priority: str | None = None, due_date: str | None = None,
                           assigned_to: str | None = None, project_id: str | None = None,
                           category: str | None = None, user_id: str | None = None) -> dict[str, Any]:
        """Crée une tâche. Obligatoire : title. due_date au format ISO (timestamp)."""
        ctx = get_context()
        data = compact(title=title, description=description, status=status, priority=priority,
                       due_date=due_date, assigned_to=assigned_to, project_id=project_id,
                       category=category, user_id=user_id)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "tasks", data)

    @mcp.tool()
    def taches_update_task(task_id: str, title: str | None = None, description: str | None = None,
                           status: str | None = None, priority: str | None = None,
                           due_date: str | None = None, assigned_to: str | None = None,
                           project_id: str | None = None, category: str | None = None,
                           confirm: bool = False) -> dict[str, Any]:
        """Modifie une tâche. Sans confirm=true : diff ; avec : applique (sauf dry-run)."""
        ctx = get_context()
        data = compact(title=title, description=description, status=status, priority=priority,
                       due_date=due_date, assigned_to=assigned_to, project_id=project_id,
                       category=category)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "tasks",
                              task_id, data, confirm=confirm)

    @mcp.tool()
    def taches_delete_task(task_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime une tâche. Exige confirm=true."""
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "tasks",
                              task_id, confirm=confirm)

    # ===================== COMMENTAIRES DE TÂCHE (task_comments) — list/get/create/delete =====

    @mcp.tool()
    def taches_list_task_comments(task_id: str, limit: int = 100, offset: int = 0) -> dict[str, Any]:
        """Liste les commentaires d'une tâche (table `task_comments`)."""
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "task_comments",
                              filters={"task_id": task_id}, order="created_at.asc",
                              limit=limit, offset=offset)

    @mcp.tool()
    def taches_get_task_comment(comment_id: str) -> dict[str, Any]:
        """Détail d'un commentaire de tâche par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "task_comments", comment_id)

    @mcp.tool()
    def taches_create_task_comment(task_id: str, user_id: str, content: str,
                                   attachments: list[str] | None = None) -> dict[str, Any]:
        """Ajoute un commentaire à une tâche. Obligatoires : task_id, user_id, content."""
        ctx = get_context()
        data = compact(task_id=task_id, user_id=user_id, content=content, attachments=attachments)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "task_comments", data)

    @mcp.tool()
    def taches_delete_task_comment(comment_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime un commentaire de tâche. Exige confirm=true."""
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "task_comments",
                              comment_id, confirm=confirm)

    # ===================== TÂCHES PERSONNELLES (personal_tasks) =====================

    @mcp.tool()
    def taches_list_personal_tasks(status: str | None = None, priority: str | None = None,
                                   assigned_to: str | None = None, limit: int = 50,
                                   offset: int = 0) -> dict[str, Any]:
        """Liste les tâches personnelles (table `personal_tasks`)."""
        filters: dict[str, Any] = {}
        if status:
            filters["status"] = status
        if priority:
            filters["priority"] = priority
        if assigned_to:
            filters["assigned_to"] = assigned_to
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "personal_tasks", filters=filters,
                              order="deadline.asc", limit=limit, offset=offset)

    @mcp.tool()
    def taches_get_personal_task(task_id: str) -> dict[str, Any]:
        """Détail d'une tâche personnelle par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "personal_tasks", task_id)

    @mcp.tool()
    def taches_create_personal_task(title: str, description: str | None = None,
                                    status: str | None = None, priority: str | None = None,
                                    tags: list[str] | None = None, deadline: str | None = None,
                                    assigned_to: str | None = None,
                                    created_by: str | None = None) -> dict[str, Any]:
        """Crée une tâche personnelle. Obligatoire : title."""
        ctx = get_context()
        data = compact(title=title, description=description, status=status, priority=priority,
                       tags=tags, deadline=deadline, assigned_to=assigned_to, created_by=created_by)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "personal_tasks", data)

    @mcp.tool()
    def taches_update_personal_task(task_id: str, title: str | None = None,
                                    description: str | None = None, status: str | None = None,
                                    priority: str | None = None, tags: list[str] | None = None,
                                    deadline: str | None = None, assigned_to: str | None = None,
                                    confirm: bool = False) -> dict[str, Any]:
        """Modifie une tâche personnelle. confirm=true requis (sauf dry-run)."""
        ctx = get_context()
        data = compact(title=title, description=description, status=status, priority=priority,
                       tags=tags, deadline=deadline, assigned_to=assigned_to)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "personal_tasks",
                              task_id, data, confirm=confirm)

    @mcp.tool()
    def taches_delete_personal_task(task_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime une tâche personnelle. Exige confirm=true."""
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "personal_tasks",
                              task_id, confirm=confirm)

    # ===================== TÂCHES COMMUNICATION (comm_tasks) =====================

    @mcp.tool()
    def taches_list_comm_tasks(project_id: str | None = None, status: str | None = None,
                               assigned_to: str | None = None, limit: int = 50,
                               offset: int = 0) -> dict[str, Any]:
        """Liste les tâches de communication (table `comm_tasks`)."""
        filters: dict[str, Any] = {}
        if project_id:
            filters["project_id"] = project_id
        if status:
            filters["status"] = status
        if assigned_to:
            filters["assigned_to"] = assigned_to
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "comm_tasks", filters=filters,
                              order="due_date.asc", limit=limit, offset=offset)

    @mcp.tool()
    def taches_get_comm_task(task_id: str) -> dict[str, Any]:
        """Détail d'une tâche de communication par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "comm_tasks", task_id)

    @mcp.tool()
    def taches_create_comm_task(project_id: str, title: str, description: str | None = None,
                                status: str | None = None, priority: str | None = None,
                                due_date: str | None = None, due_hour: int | None = None,
                                assigned_to: str | None = None) -> dict[str, Any]:
        """Crée une tâche de communication. Obligatoires : project_id, title."""
        ctx = get_context()
        data = compact(project_id=project_id, title=title, description=description, status=status,
                       priority=priority, due_date=due_date, due_hour=due_hour, assigned_to=assigned_to)
        return crud.safe_call(crud.op_create, ctx.client, ctx.settings, "comm_tasks", data)

    @mcp.tool()
    def taches_update_comm_task(task_id: str, title: str | None = None,
                                description: str | None = None, status: str | None = None,
                                priority: str | None = None, due_date: str | None = None,
                                due_hour: int | None = None, assigned_to: str | None = None,
                                confirm: bool = False) -> dict[str, Any]:
        """Modifie une tâche de communication. confirm=true requis (sauf dry-run)."""
        ctx = get_context()
        data = compact(title=title, description=description, status=status, priority=priority,
                       due_date=due_date, due_hour=due_hour, assigned_to=assigned_to)
        return crud.safe_call(crud.op_update, ctx.client, ctx.settings, "comm_tasks",
                              task_id, data, confirm=confirm)

    @mcp.tool()
    def taches_delete_comm_task(task_id: str, confirm: bool = False) -> dict[str, Any]:
        """Supprime une tâche de communication. Exige confirm=true."""
        ctx = get_context()
        return crud.safe_call(crud.op_delete, ctx.client, ctx.settings, "comm_tasks",
                              task_id, confirm=confirm)

    # ===================== ARCHIVE (archived_tasks) — lecture seule =====================

    @mcp.tool()
    def taches_list_archived_tasks(year: int | None = None, limit: int = 100,
                                   offset: int = 0) -> dict[str, Any]:
        """Liste les tâches archivées par année (table `archived_tasks`, lecture seule)."""
        filters: dict[str, Any] = {}
        if year is not None:
            filters["year"] = year
        ctx = get_context()
        return crud.safe_call(crud.op_list, ctx.client, "archived_tasks", filters=filters,
                              order="archived_at.desc", limit=limit, offset=offset)

    @mcp.tool()
    def taches_get_archived_task(archived_id: str) -> dict[str, Any]:
        """Détail d'une tâche archivée par son id."""
        ctx = get_context()
        return crud.safe_call(crud.op_get, ctx.client, "archived_tasks", archived_id)
