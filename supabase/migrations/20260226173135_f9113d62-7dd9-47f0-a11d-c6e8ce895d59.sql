
-- Add service_type to services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS service_type text NOT NULL DEFAULT 'padrao';

-- Add tattoo-specific columns to appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS tattoo_size_cm integer;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS tattoo_complexity_label text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS calculated_duration_minutes integer;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS cleanup_minutes integer;

-- Create tattoo_duration_rules table
CREATE TABLE IF NOT EXISTS public.tattoo_duration_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  service_id uuid NOT NULL,
  cm_min integer NOT NULL,
  cm_max integer NOT NULL,
  base_minutes integer NOT NULL,
  cleanup_minutes integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create tattoo_complexity_factors table
CREATE TABLE IF NOT EXISTS public.tattoo_complexity_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  label text NOT NULL,
  factor numeric NOT NULL DEFAULT 1.0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tattoo_duration_rules_business ON public.tattoo_duration_rules(business_id);
CREATE INDEX IF NOT EXISTS idx_tattoo_duration_rules_service ON public.tattoo_duration_rules(service_id);
CREATE INDEX IF NOT EXISTS idx_tattoo_complexity_factors_business ON public.tattoo_complexity_factors(business_id);

-- Triggers for updated_at
CREATE TRIGGER update_tattoo_duration_rules_updated_at
  BEFORE UPDATE ON public.tattoo_duration_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_tattoo_complexity_factors_updated_at
  BEFORE UPDATE ON public.tattoo_complexity_factors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS for tattoo_duration_rules
ALTER TABLE public.tattoo_duration_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages duration rules"
  ON public.tattoo_duration_rules FOR ALL
  TO authenticated
  USING (public.is_business_owner(auth.uid(), business_id))
  WITH CHECK (public.is_business_owner(auth.uid(), business_id));

CREATE POLICY "Admins read duration rules"
  ON public.tattoo_duration_rules FOR SELECT
  TO authenticated
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Anon reads active duration rules for booking"
  ON public.tattoo_duration_rules FOR SELECT
  TO anon
  USING (is_active = true);

-- RLS for tattoo_complexity_factors
ALTER TABLE public.tattoo_complexity_factors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages complexity factors"
  ON public.tattoo_complexity_factors FOR ALL
  TO authenticated
  USING (public.is_business_owner(auth.uid(), business_id))
  WITH CHECK (public.is_business_owner(auth.uid(), business_id));

CREATE POLICY "Admins read complexity factors"
  ON public.tattoo_complexity_factors FOR SELECT
  TO authenticated
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Anon reads complexity factors for booking"
  ON public.tattoo_complexity_factors FOR SELECT
  TO anon
  USING (true);
