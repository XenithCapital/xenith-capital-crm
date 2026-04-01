// ============================================================
// Super-admin check
// Only info@xenithcapital.co.uk has access to destructive/
// privileged admin operations (edit introducers, add team
// members, invite other admins).
// ============================================================

export const SUPER_ADMIN_EMAIL =
  (process.env.SUPER_ADMIN_EMAIL ?? 'info@xenithcapital.co.uk').toLowerCase()

export function isSuperAdmin(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase() === SUPER_ADMIN_EMAIL
}

// Routes that only the super admin can access (matched by startsWith)
export const SUPER_ADMIN_ONLY_ROUTES = [
  '/admin/introducers/new-internal',
  '/admin/settings',
]

// Dynamic pattern: /admin/introducers/<uuid>/edit
export const SUPER_ADMIN_ONLY_PATTERNS = [
  /^\/admin\/introducers\/[^/]+\/edit/,
]
