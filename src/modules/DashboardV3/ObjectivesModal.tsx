import { useState, useEffect } from 'react';
import { Settings, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useStore } from '../../store/useStore';

interface ObjectivesModalProps {
  open: boolean;
  onClose: () => void;
}

export function ObjectivesModal({ open, onClose }: ObjectivesModalProps) {
  const { dashboardObjectives, updateDashboardObjective, resetDashboardObjectives } = useStore();

  // Local state for form values
  const [formValues, setFormValues] = useState<Record<string, number>>({});

  // Initialize form values when modal opens
  useEffect(() => {
    if (open) {
      const values: Record<string, number> = {};
      dashboardObjectives.forEach(obj => {
        values[obj.id] = obj.target;
      });
      setFormValues(values);
    }
  }, [open, dashboardObjectives]);

  const handleChange = (id: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormValues(prev => ({ ...prev, [id]: numValue }));
  };

  const handleSave = () => {
    // Update each objective that has changed
    dashboardObjectives.forEach(obj => {
      if (formValues[obj.id] !== obj.target) {
        updateDashboardObjective(obj.id, { target: formValues[obj.id] });
      }
    });
    onClose();
  };

  const handleReset = () => {
    resetDashboardObjectives();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-surface-2 border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Settings className="h-5 w-5" />
            Modifier les Objectifs
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Définissez vos objectifs annuels. Ces valeurs seront sauvegardées localement.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {dashboardObjectives.map((objective) => (
            <div key={objective.id} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={objective.id} className="text-right col-span-2 text-muted-foreground">
                {objective.label}
              </Label>
              <div className="col-span-2 flex items-center gap-2">
                <Input
                  id={objective.id}
                  type="number"
                  min="0"
                  value={formValues[objective.id] || 0}
                  onChange={(e) => handleChange(objective.id, e.target.value)}
                  className="w-full bg-surface-3 border-border text-foreground"
                />
                {objective.unit && (
                  <span className="text-sm text-muted-foreground min-w-[20px]">{objective.unit}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="flex items-center gap-2 border-border text-muted-foreground hover:bg-surface-3"
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-border text-muted-foreground hover:bg-surface-3"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Enregistrer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
