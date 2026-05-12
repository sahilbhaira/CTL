import type { User } from '@supabase/supabase-js';

const readMetadataValue = (user: User | null, key: string) => {
  const value = user?.user_metadata?.[key];
  return typeof value === 'string' ? value.trim() : '';
};

export const getUserDisplayName = (user: User | null) => {
  const fullName =
    readMetadataValue(user, 'full_name') ||
    readMetadataValue(user, 'fullName') ||
    readMetadataValue(user, 'name');

  if (fullName) {
    return fullName;
  }

  if (user?.email) {
    return user.email.split('@')[0];
  }

  return 'Guest';
};

export const getUserInitials = (user: User | null, fallback = 'GU') => {
  const displayName = getUserDisplayName(user);

  return (
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || fallback
  );
};

export const getUserEmailLabel = (user: User | null) =>
  user?.email ?? 'Login or register to manage your profile.';

