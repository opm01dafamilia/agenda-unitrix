
-- Add showcase_color to businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS showcase_color text DEFAULT 'gold';

-- Professional working hours (recurring weekly schedule)
CREATE TABLE public.professional_working_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(professional_id, day_of_week)
);

-- Professional blocks (specific date/time blocks)
CREATE TABLE public.professional_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  block_date date NOT NULL,
  start_time time,
  end_time time,
  all_day boolean NOT NULL DEFAULT false,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.professional_working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_blocks ENABLE ROW LEVEL SECURITY;

-- RLS for working hours
CREATE POLICY "Owner manages working hours" ON public.professional_working_hours
  FOR ALL TO authenticated
  USING (is_business_owner(auth.uid(), business_id))
  WITH CHECK (is_business_owner(auth.uid(), business_id));

CREATE POLICY "Anon reads working hours" ON public.professional_working_hours
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- RLS for blocks
CREATE POLICY "Owner manages blocks" ON public.professional_blocks
  FOR ALL TO authenticated
  USING (is_business_owner(auth.uid(), business_id))
  WITH CHECK (is_business_owner(auth.uid(), business_id));

CREATE POLICY "Anon reads blocks" ON public.professional_blocks
  FOR SELECT TO anon, authenticated
  USING (true);

-- Indexes
CREATE INDEX idx_working_hours_professional ON public.professional_working_hours(professional_id);
CREATE INDEX idx_blocks_professional_date ON public.professional_blocks(professional_id, block_date);

-- Updated_at triggers
CREATE TRIGGER update_working_hours_updated_at BEFORE UPDATE ON public.professional_working_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
