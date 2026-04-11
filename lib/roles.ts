/** Canonical role identifiers used across auth checks and UI gating. */
export const ROLES = {
  MEMBER: 'member',
  ADMIN: 'admin',
  EXPERT: 'expert',
  SELLER: 'seller',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

/** True when the role string contains "admin" (covers super-admin variants). */
export const isAdmin = (role: string | undefined | null): boolean =>
  !!role && role.includes(ROLES.ADMIN);

export const isExpert = (role: string | undefined | null): boolean =>
  !!role && role.includes(ROLES.EXPERT);

export const isSeller = (role: string | undefined | null): boolean =>
  !!role && role.includes(ROLES.SELLER);

export const isStaff = (role: string | undefined | null): boolean =>
  isAdmin(role) || isExpert(role) || isSeller(role);
