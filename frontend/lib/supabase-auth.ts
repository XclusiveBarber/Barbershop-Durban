/**
 * Supabase Email OTP Authentication
 *
 * Handles:
 * - Send OTP to email
 * - Verify OTP and get session
 * - Fetch user profile
 * - Create/update profile
 */

import { supabase } from './supabase';

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
  const { error } = await supabase.auth.signInWithOtp({
    email: input.email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to send link');
  }

  return { success: true };
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
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
 * Sign out and clear session
 */
export async function signOut() {
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
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message || 'Failed to get session');
  }

  return data.session;
}
