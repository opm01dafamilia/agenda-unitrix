
-- Drop old availability tables
DROP TABLE IF EXISTS public.professional_blocks CASCADE;
DROP TABLE IF EXISTS public.professional_working_hours CASCADE;

-- Create professional_work_hours (weekly recurring)
CREATE TABLE public.professional_work_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  weekday integer NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create professional_time_blocks (manual blocks)
CREATE TABLE public.professional_time_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  block_start timestamptz NOT NULL,
  block_end timestamptz NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pwh_professional ON public.professional_work_hours(professional_id);
CREATE INDEX idx_pwh_weekday ON public.professional_work_hours(weekday);
CREATE INDEX idx_ptb_professional ON public.professional_time_blocks(professional_id);
CREATE INDEX idx_ptb_block_start ON public.professional_time_blocks(block_start);

-- RLS for professional_work_hours
ALTER TABLE public.professional_work_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages work hours"
  ON public.professional_work_hours FOR ALL
  TO authenticated
  USING (is_business_owner(auth.uid(), business_id))
  WITH CHECK (is_business_owner(auth.uid(), business_id));

CREATE POLICY "Anon reads active work hours"
  ON public.professional_work_hours FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- RLS for professional_time_blocks
ALTER TABLE public.professional_time_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages time blocks"
  ON public.professional_time_blocks FOR ALL
  TO authenticated
  USING (is_business_owner(auth.uid(), business_id))
  WITH CHECK (is_business_owner(auth.uid(), business_id));

CREATE POLICY "Anon reads time blocks"
  ON public.professional_time_blocks FOR SELECT
  TO anon, authenticated
  USING (true);

-- Updated_at trigger
CREATE TRIGGER set_updated_at_pwh
  BEFORE UPDATE ON public.professional_work_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
