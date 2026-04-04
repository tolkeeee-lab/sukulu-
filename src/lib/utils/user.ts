export function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    director: 'Directeur',
    teacher: 'Enseignant',
    accountant: 'Comptable',
    parent: 'Parent',
    student: 'Élève',
    super_admin: 'Super Admin',
  }
  return map[role] ?? role
}

export function getRoleIcon(role: string): string {
  const map: Record<string, string> = {
    director: '👑',
    teacher: '📚',
    accountant: '💼',
    parent: '👪',
    student: '🎒',
    super_admin: '⭐',
  }
  return map[role] ?? '👤'
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
