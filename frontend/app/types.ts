/** Shared frontend types aligned with backend Pydantic schemas (JSON wire format). */

export type UserPublic = {
  username: string;
  profile_type: string;
  organization: string;
  headline: string;
};

export type Comment = {
  id: string;
  post_id: string;
  body: string;
  parent_comment_id: string | null;
  owner: UserPublic;
};

export type Post = {
  post_id: string;
  url: string;
  file_type: string;
  file_name: string;
  caption: string | null;
  owner: UserPublic;
  average_rating: number;
  vote_count: number;
  created_at: string;
};

/** Authenticated user from /users/me (UserRead). */
export type User = {
  id: string;
  email: string;
  username: string;
  profile_type: string;
  organization: string;
  program?: string | null;
  year_of_study?: number | null;
  job_title?: string | null;
  is_active?: boolean;
  is_superuser?: boolean;
  is_verified?: boolean;
};

/** Alias for the authenticated session user. */
export type AuthUser = User;
