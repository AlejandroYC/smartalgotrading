import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const registerUser = async (email: string, password: string) => {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const loginUser = async (email: string, password: string) => {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const logoutUser = async () => {
  const supabase = createClientComponentClient();
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error };
}; 