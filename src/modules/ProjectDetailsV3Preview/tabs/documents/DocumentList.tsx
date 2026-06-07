import { DocumentRow } from './DocumentRow'
import { CATEGORIES, type Doc } from './constants'
import type { FilterValue } from './DocumentFilters'
import type { DocumentCategory } from '@/types/project-v2'

interface ProjectMeta {
  name: string
  portal_client_email: string | null
  client_first_name?: string | null
}

interface Props {
  filter: FilterValue
  visible: Doc[]
  search: string
  canDelete: boolean
  isAdmin: boolean
  project: ProjectMeta
  confirmDeleteId: string | null
  onPreview: (doc: Doc) => void
  onDownload: (doc: Doc) => void
  onAskDelete: (id: string) => void
  onCancelDelete: () => void
  onDelete: (doc: Doc) => void
  onToggleVisibility: (doc: Doc, next: boolean) => void
}

export function DocumentList(props: Props) {
  const {
    filter, visible, search, canDelete, isAdmin, project, confirmDeleteId,
    onPreview, onDownload, onAskDelete, onCancelDelete, onDelete, onToggleVisibility,
  } = props

  const label = filter === 'all'
    ? 'TOUS LES DOCUMENTS'
    : `📁 ${CATEGORIES[filter as DocumentCategory]?.label.toUpperCase()}`

  return (
    <>
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-[11px] font-semibold text-[#6b7280] tracking-widest">
          {label}
          <span className="ml-2 text-[#9ca3af] font-normal">· {visible.length}</span>
        </h3>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-8 text-sm text-[#9ca3af]">
          {search ? `Aucun résultat pour "${search}"` : 'Aucun document dans cette catégorie.'}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              canDelete={canDelete}
              isAdmin={isAdmin}
              project={project}
              isConfirmingDelete={confirmDeleteId === doc.id}
              onPreview={onPreview}
              onDownload={onDownload}
              onAskDelete={onAskDelete}
              onCancelDelete={onCancelDelete}
              onDelete={onDelete}
              onToggleVisibility={onToggleVisibility}
            />
          ))}
        </div>
      )}
    </>
  )
}
