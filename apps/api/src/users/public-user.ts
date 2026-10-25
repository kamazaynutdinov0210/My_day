/** Fields of `User` in packages/types. Never includes passwordHash. */
export const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  timezone: true,
  locale: true,
  themePreference: true,
  createdAt: true,
  updatedAt: true,
} as const;
