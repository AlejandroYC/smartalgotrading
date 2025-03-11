export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  timezone?: string;
  token?: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  user: Profile;
  access_token: string;
} 