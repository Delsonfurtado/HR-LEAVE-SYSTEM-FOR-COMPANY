EMPLOYEE_PERMISSIONS = {
    "leave:submit",
    "leave:view_own",
    "leave:cancel_own",
    "balance:view_own",
}

MANAGER_PERMISSIONS = EMPLOYEE_PERMISSIONS | {
    "team:view",
    "leave:view_team",
    "leave:decide_team",
}

HR_PERMISSIONS = EMPLOYEE_PERMISSIONS | {
    "reports:view",
    "leave_type:manage",
    "balance:adjust",
    "audit:view",
}

ADMIN_PERMISSIONS = EMPLOYEE_PERMISSIONS | HR_PERMISSIONS | {
    "users:manage",
    "policies:manage",
}

ROLE_PERMISSIONS: dict[str, set[str]] = {
    "employee": EMPLOYEE_PERMISSIONS,
    "manager": MANAGER_PERMISSIONS,
    "hr": HR_PERMISSIONS,
    "admin": ADMIN_PERMISSIONS,
}

ALL_PERMISSIONS: set[str] = set().union(*ROLE_PERMISSIONS.values())


def has_permission(role: str, permission: str) -> bool:
    return permission in ROLE_PERMISSIONS.get(role, set())
