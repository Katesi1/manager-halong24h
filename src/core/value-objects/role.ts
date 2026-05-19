export const RoleCode = {
  ADMIN: 0,
  OWNER: 1,
  SALE: 2,
  CUSTOMER: 3,
} as const;

export type RoleCode = (typeof RoleCode)[keyof typeof RoleCode];

export type RoleName = 'ADMIN' | 'OWNER' | 'SALE' | 'CUSTOMER';

const NAME_BY_CODE: Record<RoleCode, RoleName> = {
  [RoleCode.ADMIN]: 'ADMIN',
  [RoleCode.OWNER]: 'OWNER',
  [RoleCode.SALE]: 'SALE',
  [RoleCode.CUSTOMER]: 'CUSTOMER',
};

export const roleName = (code: RoleCode): RoleName => NAME_BY_CODE[code];

export const isManagerRole = (code: RoleCode): boolean =>
  code === RoleCode.ADMIN || code === RoleCode.OWNER || code === RoleCode.SALE;

export const isAdmin = (code: RoleCode): boolean => code === RoleCode.ADMIN;
