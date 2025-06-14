// User role types
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  COMMUNITY_ADMIN: 'community_admin',
  PLAYER: 'player',
  FAN: 'fan'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Function to check if a role is valid
export function isValidRole(role: string): role is UserRole {
  return Object.values(USER_ROLES).includes(role as UserRole);
}

// Function to get all available user roles
export function getAllUserRoles(): UserRole[] {
  return Object.values(USER_ROLES);
}

// Function to get user role display name
export function getUserRoleDisplayName(role: UserRole): string {
  switch (role) {
    case USER_ROLES.ADMIN:
      return 'Administrator';
    case USER_ROLES.USER:
      return 'Regular User';
    case USER_ROLES.COMMUNITY_ADMIN:
      return 'Community Admin';
    case USER_ROLES.PLAYER:
      return 'Player';
    case USER_ROLES.FAN:
      return 'Fan';
    default:
      return 'Unknown Role';
  }
}
