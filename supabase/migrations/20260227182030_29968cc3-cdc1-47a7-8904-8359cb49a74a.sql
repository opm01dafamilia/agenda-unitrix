
-- 1. Add 'design' to industry_type enum
ALTER TYPE public.industry_type ADD VALUE IF NOT EXISTS 'design';

-- 2. Add profession_subtype to businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS profession_subtype text;

-- 3. Create access_control table
CREATE TABLE public.access_control (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'trial')),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'kiwify')),
  external_customer_id text,
  external_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_control ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage access_control"
  ON public.access_control FOR ALL
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Users read own access"
  ON public.access_control FOR SELECT
  USING (user_id = auth.uid());

CREATE TRIGGER update_access_control_updated_at
  BEFORE UPDATE ON public.access_control
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. Create admin_logs table
CREATE TABLE public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  source text NOT NULL DEFAULT 'system',
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read admin_logs"
  ON public.admin_logs FOR SELECT
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins insert admin_logs"
  ON public.admin_logs FOR INSERT
  WITH CHECK (public.is_admin_user(auth.uid()));

-- 5. Update handle_new_user to auto-create access_control
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  IF NEW.email IN ('casuplemento@gmail.com', 'lp070087@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'adm');
  END IF;

  -- Auto-create access_control entry
  INSERT INTO public.access_control (user_id, status, source)
  VALUES (NEW.id, 'active', 'manual');
  
  RETURN NEW;
END;
$$;
