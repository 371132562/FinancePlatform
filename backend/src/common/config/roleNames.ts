/**
 * 系统内置角色名称常量
 * 用于统一管理角色名称，避免硬编码分散在各个文件中
 */

/**
 * 系统内置角色名称枚举
 */
export enum SystemRoleNames {
  /** 系统管理员 - 拥有所有权限 */
  ADMIN = '系统管理员',
  /** 公司管理者 - 拥有所有权限 */
  BOSS = '公司管理者',
}

/**
 * 获取所有系统内置角色名称
 */
export const getSystemRoleNames = (): string[] => {
  return Object.values(SystemRoleNames);
};

/**
 * 检查是否为系统内置角色
 */
export const isSystemRole = (roleName: string): boolean => {
  return getSystemRoleNames().includes(roleName);
};

/**
 * 检查是否为全权限角色（系统管理员或公司管理者）
 */
export const isFullPermissionRole = (roleName: string): boolean => {
  return (
    roleName === (SystemRoleNames.ADMIN as string) ||
    roleName === (SystemRoleNames.BOSS as string)
  );
};

/**
 * 检查是否为受限角色（非全权限角色）
 */
export const isRestrictedRole = (roleName: string): boolean => {
  return !isFullPermissionRole(roleName);
};
