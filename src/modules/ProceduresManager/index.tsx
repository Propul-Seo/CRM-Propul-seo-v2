import { useEffect, useMemo, useState } from 'react'
import { Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom'
import { ProceduresList } from './components/ProceduresList'
import { ProcedureDetail } from './components/ProcedureDetail'
import { ProcedureEditor } from './components/ProcedureEditor'
import { ProcedureRevisions } from './components/ProcedureRevisions'
import { useProcedures } from './hooks/useProcedures'
import { routes } from '@/lib/routes'
import type { Procedure } from './types'

/**
 * Module Procédures — câblé sur l'URL.
 *
 * Routes :
 *  - /procedures                       → liste (vue dossiers)
 *  - /procedures/new                   → éditeur (création)
 *  - /procedures/:slug                 → détail
 *  - /procedures/:slug/edit            → éditeur (édition)
 *  - /procedures/:slug/revisions       → historique
 */
export function ProceduresManager() {
  const { procedures } = useProcedures()

  const allTags = useMemo(() => {
    const s = new Set<string>()
    procedures.forEach((p) => p.tags.forEach((t) => s.add(t)))
    return Array.from(s).sort()
  }, [procedures])

  return (
    <Routes>
      <Route index element={<ListRoute />} />
      <Route path="new" element={<EditorRoute allTags={allTags} />} />
      <Route path=":slug" element={<DetailRoute />} />
      <Route path=":slug/edit" element={<EditorRoute allTags={allTags} />} />
      <Route path=":slug/revisions" element={<RevisionsRoute />} />
      <Route path="*" element={<Navigate to={routes.procedures} replace />} />
    </Routes>
  )
}

export default ProceduresManager

/** Liste — clic ouvre /procedures/:slug, bouton "+" → /procedures/new */
function ListRoute() {
  const navigate = useNavigate()
  return (
    <ProceduresList
      onOpen={(p: Procedure) => navigate(routes.procedureDetail(p.slug))}
      onCreate={() => navigate(routes.procedureNew)}
    />
  )
}

/**
 * Détail — résout le slug en Procedure (depuis le store si présent,
 * sinon fetch direct DB).
 */
function DetailRoute() {
  const { slug = '' } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { procedures, getBySlug, getById } = useProcedures()

  const fromStore = useMemo(
    () => procedures.find((p) => p.slug === slug) ?? null,
    [procedures, slug],
  )
  const [procedure, setProcedure] = useState<Procedure | null>(fromStore)
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    if (fromStore) {
      setProcedure(fromStore)
      setResolved(true)
      return
    }
    let cancelled = false
    setResolved(false)
    getBySlug(slug).then((p) => {
      if (cancelled) return
      setProcedure(p)
      setResolved(true)
    })
    return () => { cancelled = true }
  }, [slug, fromStore, getBySlug])

  if (!resolved) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Chargement…</div>
  }

  if (!procedure) {
    return <Navigate to={routes.procedures} replace />
  }

  return (
    <ProcedureDetail
      procedure={procedure}
      onBack={() => navigate(routes.procedures)}
      onEdit={() => navigate(routes.procedureEdit(procedure.slug))}
      onOpenRevisions={() => navigate(routes.procedureRevisions(procedure.slug))}
      onRefresh={getById}
    />
  )
}

/**
 * Éditeur — création (pas de slug) OU édition (slug dans l'URL).
 * Quand création : après save → redirige vers /procedures/:slug.
 */
function EditorRoute({ allTags }: { allTags: string[] }) {
  const { slug } = useParams<{ slug?: string }>()
  const navigate = useNavigate()
  const { procedures, getBySlug } = useProcedures()

  const isCreate = !slug

  const fromStore = useMemo(
    () => (slug ? procedures.find((p) => p.slug === slug) ?? null : null),
    [procedures, slug],
  )
  const [procedure, setProcedure] = useState<Procedure | null>(fromStore)
  const [resolved, setResolved] = useState(isCreate || !!fromStore)

  useEffect(() => {
    if (isCreate) {
      setProcedure(null)
      setResolved(true)
      return
    }
    if (fromStore) {
      setProcedure(fromStore)
      setResolved(true)
      return
    }
    let cancelled = false
    setResolved(false)
    getBySlug(slug!).then((p) => {
      if (cancelled) return
      setProcedure(p)
      setResolved(true)
    })
    return () => { cancelled = true }
  }, [slug, isCreate, fromStore, getBySlug])

  if (!resolved) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Chargement…</div>
  }

  if (!isCreate && !procedure) {
    return <Navigate to={routes.procedures} replace />
  }

  return (
    <ProcedureEditor
      procedure={procedure}
      onBack={() => {
        if (procedure) navigate(routes.procedureDetail(procedure.slug))
        else navigate(routes.procedures)
      }}
      onSaved={(p: Procedure) => navigate(routes.procedureDetail(p.slug))}
      allTags={allTags}
    />
  )
}

/** Révisions — résout le slug, redirige si introuvable. */
function RevisionsRoute() {
  const { slug = '' } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { procedures, getBySlug } = useProcedures()

  const fromStore = useMemo(
    () => procedures.find((p) => p.slug === slug) ?? null,
    [procedures, slug],
  )
  const [procedure, setProcedure] = useState<Procedure | null>(fromStore)
  const [resolved, setResolved] = useState(!!fromStore)

  useEffect(() => {
    if (fromStore) {
      setProcedure(fromStore)
      setResolved(true)
      return
    }
    let cancelled = false
    setResolved(false)
    getBySlug(slug).then((p) => {
      if (cancelled) return
      setProcedure(p)
      setResolved(true)
    })
    return () => { cancelled = true }
  }, [slug, fromStore, getBySlug])

  if (!resolved) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Chargement…</div>
  }

  if (!procedure) {
    return <Navigate to={routes.procedures} replace />
  }

  return (
    <ProcedureRevisions
      procedure={procedure}
      onBack={() => navigate(routes.procedureDetail(procedure.slug))}
      onRestored={(p: Procedure) => navigate(routes.procedureDetail(p.slug))}
    />
  )
}
