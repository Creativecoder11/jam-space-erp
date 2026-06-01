import { Role } from "@prisma/client";

export const PERMISSIONS = {
  dashboard: {
    view: [Role.SUPER_ADMIN, Role.ACCOUNTANT, Role.PROJECT_MANAGER, Role.STAFF],
  },
  projects: {
    view: [Role.SUPER_ADMIN, Role.ACCOUNTANT, Role.PROJECT_MANAGER, Role.STAFF],
    create: [Role.SUPER_ADMIN, Role.PROJECT_MANAGER],
    edit: [Role.SUPER_ADMIN, Role.PROJECT_MANAGER],
    delete: [Role.SUPER_ADMIN],
  },
  clients: {
    view: [Role.SUPER_ADMIN, Role.ACCOUNTANT, Role.PROJECT_MANAGER, Role.STAFF],
    create: [Role.SUPER_ADMIN, Role.PROJECT_MANAGER],
    edit: [Role.SUPER_ADMIN, Role.PROJECT_MANAGER],
    delete: [Role.SUPER_ADMIN],
  },
  costs: {
    view: [Role.SUPER_ADMIN, Role.ACCOUNTANT, Role.PROJECT_MANAGER, Role.STAFF],
    create: [Role.SUPER_ADMIN, Role.ACCOUNTANT, Role.PROJECT_MANAGER],
    edit: [Role.SUPER_ADMIN, Role.ACCOUNTANT, Role.PROJECT_MANAGER],
    delete: [Role.SUPER_ADMIN, Role.ACCOUNTANT],
  },
  payments: {
    view: [Role.SUPER_ADMIN, Role.ACCOUNTANT, Role.PROJECT_MANAGER],
    create: [Role.SUPER_ADMIN, Role.ACCOUNTANT],
    edit: [Role.SUPER_ADMIN, Role.ACCOUNTANT],
    delete: [Role.SUPER_ADMIN],
  },
  reports: {
    view: [Role.SUPER_ADMIN, Role.ACCOUNTANT, Role.PROJECT_MANAGER],
    export: [Role.SUPER_ADMIN, Role.ACCOUNTANT],
  },
  settings: {
    view: [Role.SUPER_ADMIN],
    edit: [Role.SUPER_ADMIN],
  },
  users: {
    view: [Role.SUPER_ADMIN],
    create: [Role.SUPER_ADMIN],
    edit: [Role.SUPER_ADMIN],
    delete: [Role.SUPER_ADMIN],
  },
} as const;

export function hasPermission(
  userRole: Role,
  module: keyof typeof PERMISSIONS,
  action: string
): boolean {
  const modulePerms = PERMISSIONS[module] as Record<string, readonly Role[]>;
  if (!modulePerms || !modulePerms[action]) return false;
  return modulePerms[action].includes(userRole);
}

export function canAccess(userRole: Role, module: keyof typeof PERMISSIONS): boolean {
  return hasPermission(userRole, module, "view");
}
