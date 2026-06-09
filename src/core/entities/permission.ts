/**
 * Permission matrix — spec §12.
 *
 * Mỗi SALE có 1 row mỗi module cho 4 quyền CRUD.
 */

export type PermissionModule =
  | 'properties'
  | 'bookings'
  | 'calendar'
  | 'reviews';

export const PERMISSION_MODULES: PermissionModule[] = [
  'properties',
  'bookings',
  'calendar',
  'reviews',
];

export interface PermissionRow {
  module: PermissionModule;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface PermissionMatrix {
  userId: string;
  permissions: PermissionRow[];
}

export interface UpdatePermissionInput {
  userId: string;
  permissions: PermissionRow[];
}

export const PERMISSION_MODULE_LABEL: Record<PermissionModule, string> = {
  properties: 'Cơ sở',
  bookings: 'Booking',
  calendar: 'Lịch',
  reviews: 'Review',
};
