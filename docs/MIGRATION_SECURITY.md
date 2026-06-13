# Migration Securite - CRM Propul'SEO

## Resume des modifications (Janvier 2025)

### 1. Securite - Credentials

#### Modifications effectuees
- `.env.backup` supprime (contenait cle Ringover exposee)
- `src/lib/supabase.ts` securise - plus de credentials hardcodes
- `.gitignore` renforce avec exclusions de securite
- `.env.example` cree comme template

#### Actions requises par l'equipe
1. **Regenerer les cles Supabase** depuis le dashboard
2. Copier `.env.example` vers `.env` et remplir les valeurs
3. Ne JAMAIS commiter le fichier `.env`

---

### 2. Logger Securise

#### Nouveau fichier: `src/lib/logger.ts`

Remplace `console.log/error` avec:
- Sanitization automatique des donnees sensibles
- Masquage des emails et tokens
- Logs conditionnels (dev vs prod)
- Support futur Sentry

#### Utilisation
```typescript
import { logger } from '@/lib/logger';

// Debug (dev only)
logger.debug('Contact charge', 'ContactService', { contactId: '123' });

// Info
logger.info('Utilisateur connecte', 'Auth');

// Error
logger.error('Echec creation', 'Service', { code: 'ERR_001' });

// Exception
logger.exception(error, 'MyComponent');
```

---

### 3. Couche Services API

#### Nouveaux fichiers: `src/services/api/`
- `baseService.ts` - Classe abstraite avec gestion d'erreurs
- `contactService.ts` - CRUD contacts
- `activityService.ts` - CRUD activites
- `projectService.ts` - CRUD projets
- `userService.ts` - CRUD utilisateurs
- `index.ts` - Point d'entree

#### Migration progressive
```typescript
// AVANT
import { supabase } from '../lib/supabase';
const { data } = await supabase.from('contacts').select('*');

// APRES
import { contactService } from '@/services/api';
const { data, success } = await contactService.getAll();
```

---

### 4. Organisation des fichiers

#### Fichiers deplaces
| Source | Destination | Quantite |
|--------|-------------|----------|
| `/*.sql` | `supabase/archive_sql/` | 117 |
| `/*.md` | `docs/archive/` | 29 |
| Scripts test | `scripts/` | 2 |

#### Structure nettoyee
```
CRMPropulseo/
├── src/
│   ├── lib/
│   │   ├── supabase.ts  (securise)
│   │   └── logger.ts    (nouveau)
│   ├── services/
│   │   └── api/         (nouveau)
│   └── hooks/           (migres vers logger)
├── supabase/
│   ├── migrations/      (scripts RLS)
│   └── archive_sql/     (anciens scripts)
├── docs/
│   ├── archive/         (ancienne doc)
│   └── SECURITY_CHECKLIST.md
├── .env.example
└── .gitignore           (renforce)
```

---

### 5. Hooks migres

Les hooks suivants utilisent maintenant le logger securise:
- `useAuth.ts`
- `useContacts.ts`
- `useUsers.ts`
- `useProjects.ts`
- `useTasks.ts`
- `useContactActivities.ts`
- `useCRMBYW.ts`
- `useCRMBotOne.ts`

---

### 6. Scripts RLS Supabase

#### A executer dans Supabase SQL Editor

1. **Audit** : `supabase/migrations/001_audit_rls.sql`
   - Liste les tables sans RLS
   - Verifie les politiques existantes

2. **Application** : `supabase/migrations/002_enable_rls_all_tables.sql`
   - Active RLS sur les tables sensibles
   - Cree les politiques CRUD

---

### 7. Checklist de validation

#### Developpement local
- [ ] `.env` configure avec les bonnes cles
- [ ] `npm run dev` fonctionne
- [ ] Pas d'erreur dans la console

#### Avant deploiement
- [ ] Cles Supabase regenerees
- [ ] Scripts RLS executes
- [ ] Build reussi (`npm run build`)
- [ ] Tests manuels OK

---

### 8. Prochaines etapes recommandees

1. **Type Safety** : Remplacer les `any` par types explicites (493 occurrences)
2. **Tests** : Ajouter Jest + React Testing Library
3. **Monitoring** : Integrer Sentry pour les erreurs production
4. **CI/CD** : Ajouter verification secrets pre-commit

---

## Contact

Questions sur cette migration: [A definir]
