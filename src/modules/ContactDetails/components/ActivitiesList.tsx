import { Activity, CalendarDays, AlertCircle, CheckCircle, Edit, Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { formatTextWithLineBreaks } from '../../../utils/textFormatting.tsx';
import { formatDateWithContext, isOverdue } from '../../../utils/frenchDateUtils';
import {
  getActivityIcon,
  getActivityStatusIcon,
  getActivityStatusColor,
  getDateColor,
  getDateBadge,
} from '../lib/contactHelpers';
import type { ContactActivity } from '../types';

interface ActivitiesListProps {
  activities: ContactActivity[];
  activitiesLoading: boolean;
  onMarkCompleted: (id: string) => void;
  onEdit: (activity: ContactActivity) => void;
  onDelete: (id: string) => void;
  onNewActivity: () => void;
}

export function ActivitiesList({
  activities,
  activitiesLoading,
  onMarkCompleted,
  onEdit,
  onDelete,
  onNewActivity,
}: ActivitiesListProps) {
  return (
    <div className="lg:col-span-2 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activités
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activitiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : activities.map((activity) => {
              const ActivityIcon = getActivityIcon(activity.type);
              const StatusIcon = getActivityStatusIcon(activity.status);
              const dateBadge = getDateBadge(activity.activity_date, activity.status === 'completed');

              return (
                <div key={activity.id} className="border border-border rounded-lg p-4 hover:bg-surface-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/20 rounded-full">
                        <ActivityIcon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{activity.title}</h4>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mt-1">{formatTextWithLineBreaks(activity.description)}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <div className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            <span className={getDateColor(activity.activity_date, activity.status === 'completed')}>
                              {formatDateWithContext(activity.activity_date)}
                            </span>
                          </div>
                          <div className={`flex items-center gap-1 ${getActivityStatusColor(activity.status)}`}>
                            <StatusIcon className="w-3 h-3" />
                            {activity.status === 'completed' ? 'Terminé' :
                             activity.status === 'scheduled' ? 'Planifié' : 'Annulé'}
                          </div>
                        </div>

                        {dateBadge && (
                          <div className="mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${dateBadge.className}`}>
                              {dateBadge.label}
                            </span>
                          </div>
                        )}

                        {activity.status !== 'completed' && isOverdue(activity.activity_date) && (
                          <div className="mt-2 flex items-center text-red-600 text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            En retard
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {activity.status === 'scheduled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-500/10"
                          onClick={() => onMarkCompleted(activity.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Marquer effectuée
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => onEdit(activity)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-500/10"
                        onClick={() => onDelete(activity.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {!activitiesLoading && activities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-foreground">Aucune activité pour ce contact</p>
                <Button variant="outline" className="mt-2" onClick={onNewActivity}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une activité
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
