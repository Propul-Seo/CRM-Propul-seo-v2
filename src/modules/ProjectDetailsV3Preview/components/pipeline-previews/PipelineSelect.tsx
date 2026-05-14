import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  PROJECT_STATUS_ORDER,
  PROJECT_STATUS_LABELS,
} from '../../statusConfig'
import type { ProjectStatusV2 } from '@/types/project-v2'

interface Props {
  status: ProjectStatusV2
  onChange?: (status: ProjectStatusV2) => void | Promise<void>
}

/**
 * Variante A : Select déroulant + barre de progression non-cliquable au-dessus.
 * Avantage : on voit immédiatement les options possibles, pas besoin de deviner où on clique.
 */
export function PipelineSelect({ status, onChange }: Props) {
  const currentStep = PROJECT_STATUS_ORDER.indexOf(status)
  const totalSteps = PROJECT_STATUS_ORDER.length

  return (
    <div>
      <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest mb-2">
        Étape du pipeline
      </p>
      <div className="flex gap-1 mb-2">
        {PROJECT_STATUS_ORDER.map((s, i) => (
          <div
            key={s}
            title={PROJECT_STATUS_LABELS[s]}
            className={`h-1.5 flex-1 rounded-full ${
              i <= currentStep ? 'bg-[#8B5CF6]' : 'bg-[rgba(139,92,246,0.15)]'
            }`}
          />
        ))}
      </div>
      <p className="text-[10px] text-[#9ca3af] mb-2">
        {currentStep + 1}/{totalSteps}
      </p>
      <Select value={status} onValueChange={(v) => onChange?.(v as ProjectStatusV2)}>
        <SelectTrigger className="h-8 text-xs bg-[#0f0b1e] border-[rgba(139,92,246,0.25)]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PROJECT_STATUS_ORDER.map((s, i) => (
            <SelectItem key={s} value={s}>
              <span className="text-[10px] text-[#9ca3af] mr-2">{i + 1}/9</span>
              {PROJECT_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
