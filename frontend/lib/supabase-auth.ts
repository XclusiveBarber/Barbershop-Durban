/**
 * Supabase Authentication
 *
 * Handles:
 * - Send OTP to email
 * - Verify OTP and get session
 * - Google OAuth sign-in
 * - Email + Password sign-in / sign-up
 * - Fetch user profile
 * - Create/update profile
 */

import { createSupabaseBrowserClient } from './supabase-browser';

const getSupabase = () => createSupabaseBrowserClient();

export interface SendOtpInput {
  email: string;
}

export interface VerifyOtpInput {
  email: string;
  token: string; // OTP code
}

export interface CreateProfileInput {
  id: string; // Supabase auth user ID
  email: string;
  name: string;
  role: 'customer' | 'barber' | 'admin';
}

/**
 * Send magic link to email via Supabase Auth
 */
export async function sendOtp(input: SendOtpInput) {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signInWithOtp({
    email: input.email,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to send link');
  }

  return { success: true };
}

/**
 * Verify OTP code entered by the user
 */
export async function verifyOtp(input: VerifyOtpInput) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.verifyOtp({
    email: input.email,
    token: input.token,
    type: 'email',
  });

  if (error) {
    throw new Error(error.message || 'Invalid or expired code');
  }

  return data;
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

/**
 * Fetch user profile from Supabase
 */
export async function getProfile(userId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No row found — user is new
      return null;
    }
    throw new Error(error.message || 'Failed to fetch profile');
  }

  return data;
}

/**
 * Create new user profile in Supabase
 */
export async function createProfile(input: CreateProfileInput) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: input.id,
      email: input.email,
      full_name: input.name,
      role: input.role,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to create profile');
  }

  return data;
}

/**
 * Update user profile
 */
export async function updateProfile(userId: string, updates: Partial<CreateProfileInput>) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...(updates.name && { full_name: updates.name }),
      ...(updates.role && { role: updates.role }),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update profile');
  }

  return data;
}

/**
 * Sign in with Google OAuth — redirects to Google consent screen.
 * After authentication, Google redirects to /auth/callback.
 */
export async function signInWithGoogle(redirectTo: string) {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });

  if (error) {
    throw new Error(error.message || 'Failed to sign in with Google');
  }
}

/**
 * Sign in with email + password
 */
export async function signInWithPassword(input: { email: string; password: string }) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    throw new Error(error.message || 'Invalid email or password');
  }

  return data;
}

/**
 * Sign up with email + password (creates a new Supabase auth user)
 */
export async function signUpWithPassword(input: { email: string; password: string }) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
  });

  if (error) {
    throw new Error(error.message || 'Failed to create account');
  }

  return data;
}

/**
 * Sign out and clear session
 */
export async function signOut() {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message || 'Failed to sign out');
  }

  return { success: true };
}

/**
 * Get current session
 */
export async function getSession() {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message || 'Failed to get session');
  }

  return data.session;
}
