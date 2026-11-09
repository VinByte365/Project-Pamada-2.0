/**
 * The MongoDB user document returned by `GET /auth/me`.
 *
 * FastAPI normalizes Mongo's `_id` to `id` before responding, so the profile is
 * safe to keep in client state without exposing driver-specific types.
 */
export type CloudProfile = {
  id: string;
  supabase_id?: string | null;
  email?: string | null;
  name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type ProfileSyncStatus =
  | 'idle'
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'unauthorized'
  | 'error';

export type ProfileIssueStatus = Extract<
  ProfileSyncStatus,
  'offline' | 'unauthorized' | 'error'
>;

export type ProfileSyncResult =
  | { status: 'synced'; profile: CloudProfile }
  | { status: ProfileIssueStatus; message: string };
