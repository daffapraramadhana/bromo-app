import { Role } from "@prisma/client";

export type Permission =
  | "merchant:manage"
  | "merchant:view"
  | "data:input"
  | "data:approve"
  | "ticket:redeem"
  | "user:manage";

const PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "merchant:manage",
    "merchant:view",
    "data:input",
    "data:approve",
    "user:manage",
  ],
  MANAGER: ["merchant:view", "data:input", "data:approve", "user:manage"],
  ADMIN: ["merchant:view", "data:input"],
  OPERATOR: ["ticket:redeem"],
};

export function can(role: Role, permission: Permission): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}

export function assertCan(role: Role, permission: Permission): void {
  if (!can(role, permission)) {
    throw new Error(`Forbidden: role ${role} lacks ${permission}`);
  }
}
