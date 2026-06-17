export interface ProjectAssigneeUser {
  id: string
  name: string
  email?: string | null
}

export const PROJECT_ASSIGNEES = [
  { email: 'team@propulseo-site.com', label: 'Etienne' },
  { email: 'lyestriki@yahoo.fr', label: 'Lyes' },
] as const

const ASSIGNEE_LABEL_BY_EMAIL = new Map<string, string>(
  PROJECT_ASSIGNEES.map((assignee) => [assignee.email, assignee.label]),
)

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? ''
}

export function getProjectAssigneeLabel(user?: ProjectAssigneeUser | null) {
  if (!user) return null
  return ASSIGNEE_LABEL_BY_EMAIL.get(normalizeEmail(user.email)) ?? user.name
}

export function getProjectAssignees<T extends ProjectAssigneeUser>(users: T[]): T[] {
  const result: T[] = []
  for (const assignee of PROJECT_ASSIGNEES) {
    const user = users.find((candidate) => normalizeEmail(candidate.email) === assignee.email)
    if (user) result.push({ ...user, name: assignee.label })
  }
  return result
}

export function getProjectAssigneeIds(users: ProjectAssigneeUser[]) {
  return new Set(getProjectAssignees(users).map((user) => user.id))
}
