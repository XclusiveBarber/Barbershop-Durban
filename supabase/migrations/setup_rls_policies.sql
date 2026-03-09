-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.haircuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- ==================== PROFILES TABLE ====================
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow public to read profile names (for barber listings, etc.)
CREATE POLICY "Public can read barber profiles"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow service role to manage profiles
CREATE POLICY "Service role can manage profiles"
  ON public.profiles
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ==================== BARBERS TABLE ====================
-- Allow public to read barbers
CREATE POLICY "Public can read barbers"
  ON public.barbers
  FOR SELECT
  USING (true);

-- Allow service role to manage barbers
CREATE POLICY "Service role can manage barbers"
  ON public.barbers
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ==================== HAIRCUTS TABLE ====================
-- Allow public to read haircuts
CREATE POLICY "Public can read haircuts"
  ON public.haircuts
  FOR SELECT
  USING (true);

-- Allow service role to manage haircuts
CREATE POLICY "Service role can manage haircuts"
  ON public.haircuts
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ==================== APPOINTMENTS TABLE ====================
-- Allow users to read their own appointments
CREATE POLICY "Users can read own appointments"
  ON public.appointments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow service role (backend API) to manage appointments
CREATE POLICY "Service role can manage appointments"
  ON public.appointments
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Allow authenticated users to insert their own appointments
CREATE POLICY "Users can create own appointments"
  ON public.appointments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
