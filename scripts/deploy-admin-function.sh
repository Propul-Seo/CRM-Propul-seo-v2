#!/bin/bash

# Script de déploiement de la fonction Edge admin-update-password
# Project ID: tbuqctfgjjxnevmsvucl

set -e

PROJECT_REF="tbuqctfgjjxnevmsvucl"
FUNCTION_NAME="admin-update-password"

echo "🚀 Déploiement de la fonction Edge: $FUNCTION_NAME"
echo "📦 Project ID: $PROJECT_REF"
echo ""

# Vérifier que Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé."
    echo "   Installez-le avec: npm install -g supabase"
    exit 1
fi

# Vérifier si l'utilisateur est connecté
echo "1️⃣ Vérification de la connexion Supabase..."
if ! supabase projects list &> /dev/null; then
    echo "⚠️  Vous n'êtes pas connecté à Supabase."
    echo "   Exécutez: supabase login"
    echo "   Ou définissez SUPABASE_ACCESS_TOKEN"
    exit 1
fi
echo "   ✅ Connecté à Supabase"

# Vérifier si le projet est lié
echo ""
echo "2️⃣ Vérification du lien du projet..."
if [ ! -f "supabase/.temp/project-ref" ]; then
    echo "   ⚠️  Projet non lié. Liaison en cours..."
    supabase link --project-ref "$PROJECT_REF"
else
    LINKED_REF=$(cat supabase/.temp/project-ref 2>/dev/null || echo "")
    if [ "$LINKED_REF" != "$PROJECT_REF" ]; then
        echo "   ⚠️  Projet lié à un autre ref. Reliaison..."
        supabase link --project-ref "$PROJECT_REF"
    else
        echo "   ✅ Projet déjà lié"
    fi
fi

# Déployer la fonction
echo ""
echo "3️⃣ Déploiement de la fonction $FUNCTION_NAME..."
supabase functions deploy "$FUNCTION_NAME"

echo ""
echo "✅ Déploiement terminé avec succès!"
echo ""
echo "📝 Prochaines étapes:"
echo "   1. Vérifier les logs: supabase functions logs $FUNCTION_NAME"
echo "   2. Tester la fonction depuis l'interface Settings"
echo "   3. Vérifier les variables d'environnement dans le Dashboard Supabase"
echo ""
echo "🔗 Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF"

