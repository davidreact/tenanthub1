-- Fix RLS policies for users table

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own data" ON public.users;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view own data" 
ON public.users FOR SELECT 
USING (auth.uid() = id OR auth.uid()::text = user_id);

CREATE POLICY "Users can insert own data" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id OR auth.uid()::text = user_id);

CREATE POLICY "Users can update own data" 
ON public.users FOR UPDATE 
USING (auth.uid() = id OR auth.uid()::text = user_id)
WITH CHECK (auth.uid() = id OR auth.uid()::text = user_id);

-- Update the trigger function to use UPSERT to avoid conflicts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    user_id,
    email,
    name,
    full_name,
    avatar_url,
    token_identifier,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.id::text,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email,
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = EXCLUDED.updated_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;