import { IPermission } from "@/types/backend";

type UserRole =
    | string
    | {
        id?: string | number;
        name?: string;
        permissions?: IPermission[];
    }
    | undefined;

type AccountUser = {
    role?: UserRole;
};

type ModuleKey = "COMPANY" | "USER" | "JOB" | "RESUME" | "PERMISSION" | "ROLE";

const ADMIN_MODULES: ModuleKey[] = ["COMPANY", "USER", "JOB", "RESUME", "PERMISSION", "ROLE"];

const MODULE_ALIASES: Record<ModuleKey, string[]> = {
    COMPANY: ["COMPANY", "COMPANIES"],
    USER: ["USER", "USERS"],
    JOB: ["JOB", "JOBS"],
    RESUME: ["RESUME", "RESUMES"],
    PERMISSION: ["PERMISSION", "PERMISSIONS"],
    ROLE: ["ROLE", "ROLES"],
};

export const getRoleName = (role: UserRole): string => {
    if (!role) return "";
    if (typeof role === "string") return role;
    return role.name ?? "";
};

export const getRolePermissions = (role: UserRole): IPermission[] => {
    if (!role || typeof role === "string") return [];
    return Array.isArray(role.permissions) ? role.permissions : [];
};

export const hasModulePermission = (user: AccountUser | undefined, moduleKey: ModuleKey): boolean => {
    const roleName = getRoleName(user?.role);
    if (roleName === "SUPER_ADMIN") return true;

    const permissions = getRolePermissions(user?.role);
    const acceptedModules = MODULE_ALIASES[moduleKey] ?? [moduleKey];
    return permissions.some((item) => acceptedModules.includes(String(item?.module ?? "").toUpperCase()));
};

export const hasAnyAdminPermission = (user: AccountUser | undefined): boolean => {
    const roleName = getRoleName(user?.role);
    if (roleName === "SUPER_ADMIN") return true;

    return ADMIN_MODULES.some((moduleKey) => hasModulePermission(user, moduleKey));
};

export const canAccessAdminPath = (user: AccountUser | undefined, pathname: string): boolean => {
    const normalizedPath = pathname.toLowerCase();

    if (normalizedPath === "/admin") {
        return hasAnyAdminPermission(user);
    }
    if (normalizedPath.startsWith("/admin/company")) {
        return hasModulePermission(user, "COMPANY");
    }
    if (normalizedPath.startsWith("/admin/user")) {
        return hasModulePermission(user, "USER");
    }
    if (normalizedPath.startsWith("/admin/job")) {
        return hasModulePermission(user, "JOB");
    }
    if (normalizedPath.startsWith("/admin/resume")) {
        return hasModulePermission(user, "RESUME");
    }
    if (normalizedPath.startsWith("/admin/permission")) {
        return hasModulePermission(user, "PERMISSION");
    }
    if (normalizedPath.startsWith("/admin/role")) {
        return hasModulePermission(user, "ROLE");
    }

    return false;
};
