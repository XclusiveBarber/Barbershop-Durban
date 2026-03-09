# Row Level Security (RLS) Setup Guide

This guide explains how to set up RLS policies for your Barbershop Durban Supabase project.

## Why RLS?

RLS (Row Level Security) ensures that:
- Users can only see their own appointments
- Public users can view barbers and services
- Your backend API (with service role) can manage all data
- Data is protected at the database level, not just the application level

## Setup Option 1: Using Supabase CLI (Recommended)

If you have the Supabase CLI installed:

```bash
# Link your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

## Setup Option 2: Manual Setup via Dashboard

Go to your Supabase dashboard and follow these steps:

### 1. Enable RLS on all tables

For each table (`profiles`, `barbers`, `haircuts`, `appointments`):
1. Go to **Authentication** > **Policies**
2. Select the table
3. Click **Enable RLS**

### 2. Create Policies

Copy and paste each SQL command below into the **SQL Editor** in your Supabase dashboard:

#### PROFILES Table
```sql
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Public can read all profiles (for barber listings)
CREATE POLICY "Public can read profiles"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Service role can manage everything
CREATE POLICY "Service role manages profiles"
  ON public.profiles
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

#### BARBERS Table
```sql
-- Public can read barbers
CREATE POLICY "Public can read barbers"
  ON public.barbers
  FOR SELECT
  USING (true);

-- Service role can manage everything
CREATE POLICY "Service role manages barbers"
  ON public.barbers
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

#### HAIRCUTS Table
```sql
-- Public can read haircuts
CREATE POLICY "Public can read haircuts"
  ON public.haircuts
  FOR SELECT
  USING (true);

-- Service role can manage everything
CREATE POLICY "Service role manages haircuts"
  ON public.haircuts
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

#### APPOINTMENTS Table
```sql
-- Users can read their own appointments
CREATE POLICY "Users can read own appointments"
  ON public.appointments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage everything
CREATE POLICY "Service role manages appointments"
  ON public.appointments
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Authenticated users can create appointments
CREATE POLICY "Users can create appointments"
  ON public.appointments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Testing the Setup

After setting up RLS:

1. Try creating an appointment through your booking system
2. Try fetching appointments - you should only see your own
3. Check the browser console for any RLS errors

## Troubleshooting

### "new row violates row-level security policy"
- Make sure the `service_role` policies are created
- Check that your backend is using the service role (anon key won't work for API writes)

### "Permission denied" errors
- Verify RLS is enabled on the table
- Check that the policy conditions match your data

### Can't see any data
- Make sure you have SELECT policies that apply to you
- For public read access, use `USING (true)`

## Architecture

- **Frontend Auth**: Users authenticate with Clerk, make requests to your Next.js API
- **Next.js Backend**: Uses Supabase service role key to read/write without RLS restrictions
- **RLS Enforcement**: Applies when users connect directly to Supabase (if they do)

This way, your API acts as a trusted middle layer and RLS protects against direct database access.
