import type {
  PermissionMatrix,
  UpdatePermissionInput,
} from '@/core/entities/permission';

export interface PermissionRepository {
  /** GET /permissions/:userId */
  getForUser(userId: string): Promise<PermissionMatrix>;
  /** PUT /permissions/:userId */
  update(input: UpdatePermissionInput): Promise<PermissionMatrix>;
}
