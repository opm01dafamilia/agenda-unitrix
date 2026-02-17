
-- =============================================
-- 1) ENUM & TYPES
-- =============================================
CREATE TYPE public.app_role AS ENUM ('adm', 'premium');
CREATE TYPE public.premium_status AS ENUM ('active', 'past_due', 'inactive', 'trial');
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE public.industry_type AS ENUM ('tattoo', 'barber', 'salon');

-- =============================================
-- 2) PROFILES TABLE
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3) USER_ROLES TABLE
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4) BUSINESSES TABLE
-- =============================================
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  industry industry_type NOT NULL,
  cpf TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT,
  address_street TEXT,
  address_number TEXT,
  address_zip TEXT,
  address_neighborhood TEXT,
  address_complement TEXT,
  operating_hours JSONB DEFAULT '{}',
  theme_primary_color TEXT DEFAULT '#EAB308',
  theme_secondary_color TEXT DEFAULT '#1E1E1E',
  avatar_url TEXT,
  auto_accept_appointments BOOLEAN DEFAULT false,
  premium_status premium_status DEFAULT 'inactive',
  premium_until TIMESTAMPTZ,
  grace_period_until TIMESTAMPTZ,
  premium_plan TEXT, -- 'monthly' or 'yearly'
  message_template_client TEXT DEFAULT 'Seu agendamento foi concluído. Você tem compromisso às {hora}.',
  message_template_professional TEXT DEFAULT 'Agendamento marcado às {hora}.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5) PROFESSIONALS TABLE
-- =============================================
CREATE TABLE public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  whatsapp TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6) SERVICES TABLE
-- =============================================
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price NUMERIC(10,2),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 7) CLIENTS TABLE
-- =============================================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  city TEXT,
  neighborhood TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 8) APPOINTMENTS TABLE
-- =============================================
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  status appointment_status NOT NULL DEFAULT 'pending',
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  -- tattoo specific
  body_location TEXT,
  size_cm NUMERIC(6,1),
  has_previous_tattoo BOOLEAN,
  reference_photo_url TEXT,
  observations TEXT,
  -- completion
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  tattoo_value NUMERIC(10,2), -- filled by professional on completion
  -- client info snapshot
  client_name TEXT,
  client_cpf TEXT,
  client_whatsapp TEXT,
  client_email TEXT,
  client_city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 9) GALLERY_IMAGES TABLE
-- =============================================
CREATE TABLE public.gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 10) TRIAL_CODES TABLE
-- =============================================
CREATE TABLE public.trial_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.trial_codes ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 11) WEBHOOK_LOGS TABLE
-- =============================================
CREATE TABLE public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email TEXT,
  event_type TEXT NOT NULL,
  status_processing TEXT DEFAULT 'success', -- success/error/ignored
  plan_applied TEXT, -- premium/free/no_change
  raw_payload JSONB,
  error_message TEXT
);
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 12) HELPER FUNCTIONS (SECURITY DEFINER)
-- =============================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if email is a hardcoded admin
CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id
    AND email IN ('casuplemento@gmail.com', 'lp070087@gmail.com')
  ) OR public.has_role(_user_id, 'adm')
$$;

-- Check if user owns a business
CREATE OR REPLACE FUNCTION public.is_business_owner(_user_id UUID, _business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id = _business_id AND owner_id = _user_id
  )
$$;

-- Get user's business id
CREATE OR REPLACE FUNCTION public.get_user_business_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.businesses WHERE owner_id = _user_id LIMIT 1
$$;

-- =============================================
-- 13) TRIGGER: auto-create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  -- Auto-assign adm role for admin emails
  IF NEW.email IN ('casuplemento@gmail.com', 'lp070087@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'adm');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 14) TRIGGER: updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- 15) SECURE VIEW: businesses_public
-- =============================================
CREATE OR REPLACE VIEW public.businesses_public AS
SELECT
  id,
  name,
  slug,
  industry,
  theme_primary_color,
  theme_secondary_color,
  operating_hours,
  auto_accept_appointments,
  avatar_url,
  city
FROM public.businesses;

-- Grant anon access to the view only
GRANT SELECT ON public.businesses_public TO anon;
GRANT SELECT ON public.businesses_public TO authenticated;

-- =============================================
-- 16) RLS POLICIES
-- =============================================

-- PROFILES
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT USING (public.is_admin_user(auth.uid()));

-- USER_ROLES
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.is_admin_user(auth.uid()));
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());

-- BUSINESSES
CREATE POLICY "Owner reads own business" ON public.businesses FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Owner updates own business" ON public.businesses FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Owner inserts business" ON public.businesses FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Admins read all businesses" ON public.businesses FOR SELECT USING (public.is_admin_user(auth.uid()));
CREATE POLICY "Admins update all businesses" ON public.businesses FOR UPDATE USING (public.is_admin_user(auth.uid()));

-- PROFESSIONALS
CREATE POLICY "Owner manages professionals" ON public.professionals FOR ALL USING (
  public.is_business_owner(auth.uid(), business_id)
);
CREATE POLICY "Admins read professionals" ON public.professionals FOR SELECT USING (public.is_admin_user(auth.uid()));

-- SERVICES
CREATE POLICY "Owner manages services" ON public.services FOR ALL USING (
  public.is_business_owner(auth.uid(), business_id)
);
CREATE POLICY "Anon reads active services for booking" ON public.services FOR SELECT TO anon USING (active = true);

-- CLIENTS
CREATE POLICY "Owner manages clients" ON public.clients FOR ALL USING (
  public.is_business_owner(auth.uid(), business_id)
);
CREATE POLICY "Admins read clients" ON public.clients FOR SELECT USING (public.is_admin_user(auth.uid()));

-- APPOINTMENTS: anon can insert (public booking)
CREATE POLICY "Anon creates appointments" ON public.appointments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Owner manages appointments" ON public.appointments FOR ALL USING (
  public.is_business_owner(auth.uid(), business_id)
);
CREATE POLICY "Admins read appointments" ON public.appointments FOR SELECT USING (public.is_admin_user(auth.uid()));

-- GALLERY_IMAGES
CREATE POLICY "Owner manages gallery" ON public.gallery_images FOR ALL USING (
  public.is_business_owner(auth.uid(), business_id)
);
CREATE POLICY "Anon reads gallery for public page" ON public.gallery_images FOR SELECT TO anon USING (true);

-- TRIAL_CODES
CREATE POLICY "Admins manage trials" ON public.trial_codes FOR ALL USING (public.is_admin_user(auth.uid()));
CREATE POLICY "Authenticated users read own trial" ON public.trial_codes FOR SELECT USING (
  email = (SELECT email FROM public.profiles WHERE id = auth.uid())
);

-- WEBHOOK_LOGS
CREATE POLICY "Admins read webhook logs" ON public.webhook_logs FOR SELECT USING (public.is_admin_user(auth.uid()));

-- =============================================
-- 17) INDEXES
-- =============================================
CREATE INDEX idx_businesses_slug ON public.businesses(slug);
CREATE INDEX idx_businesses_owner ON public.businesses(owner_id);
CREATE INDEX idx_appointments_business_date ON public.appointments(business_id, appointment_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_clients_business ON public.clients(business_id);
CREATE INDEX idx_professionals_business ON public.professionals(business_id);
CREATE INDEX idx_services_business ON public.services(business_id);
CREATE INDEX idx_gallery_business ON public.gallery_images(business_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);

-- =============================================
-- 18) STORAGE BUCKETS
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('appointments', 'appointments', true);

-- Storage policies
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Auth upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Auth update avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Auth delete avatars" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Public read gallery" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Auth upload gallery" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery' AND auth.role() = 'authenticated');
CREATE POLICY "Auth update gallery" ON storage.objects FOR UPDATE USING (bucket_id = 'gallery' AND auth.role() = 'authenticated');
CREATE POLICY "Auth delete gallery" ON storage.objects FOR DELETE USING (bucket_id = 'gallery' AND auth.role() = 'authenticated');

CREATE POLICY "Public read appointment files" ON storage.objects FOR SELECT USING (bucket_id = 'appointments');
CREATE POLICY "Anon upload appointment files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'appointments');
