import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  PIPELINE_STEP_ORDER,
  PROJECT_STATUS_LABELS,
} from '../../statusConfig'
import type { ProjectStatusV2 } from '@/types/project-v2'

interface Props {
  status: ProjectStatusV2
  onChange?: (status: ProjectStatusV2) => void | Promise<void>
}

/**
 * Sélecteur d'étape détaillée du pipeline (7 étapes : Prospect → Clôturé).
 * Les statuts « type » (En cours / En pause / Projet Propulseo) sont pilotés
 * ailleurs (sélecteur de type, sidebar gauche) : ici, si le status courant est
 * l'un d'eux, aucune étape n'est sélectionnée (l'utilisateur peut en choisir une).
 */
export function PipelineSelect({ status, onChange }: Props) {
  const currentStep = PIPELINE_STEP_ORDER.indexOf(status)
  const totalSteps = PIPELINE_STEP_ORDER.length
  const hasStep = currentStep >= 0

  return (
    <div>
      <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest mb-2">
        Étape du pipeline
      </p>
      <div className="flex gap-1 mb-2">
        {PIPELINE_STEP_ORDER.map((s, i) => (
          <div
            key={s}
            title={PROJECT_STATUS_LABELS[s]}
            className={`h-1.5 flex-1 rounded-full ${
              hasStep && i <= currentStep ? 'bg-[#8B5CF6]' : 'bg-[rgba(139,92,246,0.15)]'
            }`}
          />
        ))}
      </div>
      <p className="text-[10px] text-[#9ca3af] mb-2">
        {hasStep ? `${currentStep + 1}/${totalSteps}` : `—/${totalSteps}`}
      </p>
      <Select value={hasStep ? status : undefined} onValueChange={(v) => onChange?.(v as ProjectStatusV2)}>
        <SelectTrigger className="h-8 text-xs bg-[#0f0b1e] border-[rgba(139,92,246,0.25)]">
          <SelectValue placeholder="Choisir une étape…" />
        </SelectTrigger>
        <SelectContent>
          {PIPELINE_STEP_ORDER.map((s, i) => (
            <SelectItem key={s} value={s}>
              <span className="text-[10px] text-[#9ca3af] mr-2">{i + 1}/{totalSteps}</span>
              {PROJECT_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
