-- Run this in Supabase SQL Editor to create all tables
-- Go to: https://supabase.com/dashboard → your project → SQL Editor → New query

-- 1. Profiles table (links to Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'customer',
  email TEXT NOT NULL DEFAULT ''
);

-- 2. Barbers table
CREATE TABLE IF NOT EXISTS barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  speciality TEXT NOT NULL,
  image_url TEXT NOT NULL,
  available BOOLEAN NOT NULL DEFAULT true
);

-- 3. Haircuts table
CREATE TABLE IF NOT EXISTS haircuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC(18, 2) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  duration_minutes INT NOT NULL DEFAULT 60
);

-- 4. Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  barber_id UUID NOT NULL REFERENCES barbers(id),
  haircut_id UUID NOT NULL REFERENCES haircuts(id),
  appointment_date TIMESTAMPTZ NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  yoco_payment_id TEXT,
  amount_paid NUMERIC(18, 2),
  total_price NUMERIC(18, 2) NOT NULL DEFAULT 0,
  applied_discount_code TEXT,
  reschedule_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile when a user signs up (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'customer',
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles table
-- Run these to fix the INSERT policy that blocked non-admin users from creating their own profile

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Profiles INSERT" ON public.profiles;

-- Allow users to insert their own profile during onboarding
CREATE POLICY "Profiles INSERT" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR is_admin());

-- Ensure the UPDATE policy explicitly allows users to update their own records
DROP POLICY IF EXISTS "Profiles UPDATE" ON public.profiles;

CREATE POLICY "Profiles UPDATE" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin());

-- Sync email updates from auth.users to profiles table
CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the email in profiles table when auth.users email changes
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;
CREATE TRIGGER on_auth_user_email_changed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.handle_user_email_update();
