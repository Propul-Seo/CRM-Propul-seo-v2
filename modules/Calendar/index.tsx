import React, { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { useActivities } from '@/hooks/useActivities';
import { Activity } from '@/types/activity';
import { ActivityFilters } from '@/components/activities/ActivityFilters';
import { ActivityList } from '@/components/activities/ActivityList';
import { formatParis } from '@/utils/timezone';

export default function CalendarPage() {
  const { activities, loading } = useActivities();
  const [filterType, setFilterType] = useState<'projet' | 'prospect' | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'a_faire' | 'en_cours' | 'termine' | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<'haute' | 'moyenne' | 'basse' | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const filteredActivities = useMemo(() => {
    return activities.filter(a =>
      (filterType === 'all' || a.type === filterType) &&
      (filterStatus === 'all' || a.status === filterStatus) &&
      (filterPriority === 'all' || a.priority === filterPriority)
    );
  }, [activities, filterType, filterStatus, filterPriority]);

  // Pour affichage dans FullCalendar
  const calendarEvents = filteredActivities.map(a => ({
    id: a.id,
    title: a.title,
    start: a.date_utc,
    backgroundColor: a.type === 'projet' ? '#2563eb' : '#16a34a',
    borderColor: a.priority === 'haute' ? '#ef4444' : a.priority === 'moyenne' ? '#f59e42' : '#a3a3a3',
    extendedProps: a,
  }));

  // Activités du jour sélectionné
  const activitiesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return filteredActivities.filter(a => formatParis(a.date_utc, 'yyyy-MM-dd') === selectedDate);
  }, [filteredActivities, selectedDate]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Calendrier centralisé</h1>
      <ActivityFilters
        type={filterType}
        status={filterStatus}
        priority={filterPriority}
        onTypeChange={setFilterType}
        onStatusChange={setFilterStatus}
        onPriorityChange={setFilterPriority}
      />
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          locale={frLocale}
          events={calendarEvents}
          eventClick={info => {
            setSelectedDate(formatParis(info.event.start!, 'yyyy-MM-dd'));
          }}
          dateClick={info => {
            setSelectedDate(info.dateStr);
          }}
          height={650}
        />
      </div>
      {selectedDate && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Activités du {selectedDate.split('-').reverse().join('/')}</h2>
          <ActivityList activities={activitiesForSelectedDate} />
        </div>
      )}
      {loading && <div className="text-gray-400">Chargement des activités...</div>}
    </div>
  );
} 