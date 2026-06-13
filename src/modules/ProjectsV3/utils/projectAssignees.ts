export interface ProjectAssigneeUser {
  id: string
  name: string
  email?: string | null
}

export const PROJECT_ASSIGNEES = [
  { email: 'team@propulseo-site.com', label: 'Etienne' },
  { email: 'lyestriki@yahoo.fr', label: 'Lyes' },
] as const

const ASSIGNEE_LABEL_BY_EMAIL = new Map(
  PROJECT_ASSIGNEES.map((assignee) => [assignee.email, assignee.label]),
)

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? ''
}

export function getProjectAssigneeLabel(user?: ProjectAssigneeUser | null) {
  if (!user) return null
  return ASSIGNEE_LABEL_BY_EMAIL.get(normalizeEmail(user.email)) ?? user.name
}

export function getProjectAssignees<T extends ProjectAssigneeUser>(users: T[]) {
  return PROJECT_ASSIGNEES
    .map((assignee) => {
      const user = users.find((candidate) => normalizeEmail(candidate.email) === assignee.email)
      return user ? { ...user, name: assignee.label } : null
    })
    .filter((user): user is T => user !== null)
}

export function getProjectAssigneeIds(users: ProjectAssigneeUser[]) {
  return new Set(getProjectAssignees(users).map((user) => user.id))
}
