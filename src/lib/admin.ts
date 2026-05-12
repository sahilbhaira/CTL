import type { User } from '@supabase/supabase-js';

const readRoleList = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((role): role is string => typeof role === 'string')
    : [];

const hasAdminRole = (metadata: Record<string, unknown> | undefined) => {
  const role = metadata?.role;
  const roles = readRoleList(metadata?.roles);

  return role === 'admin' || roles.includes('admin');
};

export const isAdminUser = (user: User | null) =>
  Boolean(
    user &&
      (hasAdminRole(user.app_metadata) || hasAdminRole(user.user_metadata))
  );
