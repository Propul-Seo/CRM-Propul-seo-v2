import type { ContactInsert, ContactUpdate } from '../../types/supabase-types';

export function adaptContactForInsert(
  contactData: Partial<ContactInsert>,
  userId: string
): ContactInsert {
  return {
    name: (contactData as { contact_name?: string }).contact_name || contactData.name || 'Contact',
    company: (contactData as { company_name?: string }).company_name || contactData.company || 'Entreprise',
    email: contactData.email || '',
    phone: contactData.phone || '',
    website: (contactData.website || '').trim() || null,
    status: contactData.status || 'prospect',
    project_price: contactData.project_price || null,
    source: contactData.source || 'website',
    notes: contactData.notes ? (Array.isArray(contactData.notes) ? contactData.notes : [contactData.notes]) : [],
    assigned_to: contactData.assigned_to || null,
    next_activity_date: contactData.next_activity_date || null,
    user_id: userId
  };
}

export function adaptContactForUpdate(updates: ContactUpdate): ContactUpdate {
  return {
    ...(updates.name !== undefined && { name: updates.name || '' }),
    ...(updates.company !== undefined && { company: updates.company || '' }),
    ...(updates.email !== undefined && { email: updates.email || '' }),
    ...(updates.phone !== undefined && { phone: updates.phone || '' }),
    ...(updates.website !== undefined && { website: (updates.website || '').trim() || null }),
    ...(updates.source !== undefined && { source: updates.source || 'website' }),
    ...(updates.notes !== undefined && {
      notes: updates.notes ? (Array.isArray(updates.notes) ? updates.notes : [updates.notes]) : []
    }),
    ...(updates.status && {
      status: updates.status === 'client' ? 'qualified' :
              updates.status === 'lost' ? 'lost' :
              updates.status
    }),
    ...(updates.project_price !== undefined && {
      project_price: updates.project_price && updates.project_price > 0
        ? Number(updates.project_price)
        : null
    }),
    ...(updates.assigned_to !== undefined && {
      assigned_to: updates.assigned_to === '' || updates.assigned_to === null
        ? null
        : updates.assigned_to
    }),
    ...(updates.next_activity_date !== undefined && {
      next_activity_date: updates.next_activity_date === '' || updates.next_activity_date === null
        ? null
        : updates.next_activity_date
    })
  };
}
