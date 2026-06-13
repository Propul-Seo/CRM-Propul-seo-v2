#!/usr/bin/env python3
"""Lanceur du serveur MCP — robuste quel que soit le répertoire courant.

Exécuté par chemin absolu (`python C:\\...\\propulseo-mcp\\run_server.py`),
Python place automatiquement le dossier de ce script en tête de `sys.path`,
ce qui rend l'import du package `propulseo_mcp` fiable sans dépendre du cwd
ni de PYTHONPATH (utile pour Claude Code / Claude Desktop qui ne fixent pas le cwd).
"""
import os
import sys

# Garantit que le dossier du projet (contenant le package propulseo_mcp) est importable.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from propulseo_mcp.server import main  # noqa: E402

if __name__ == "__main__":
    main()
