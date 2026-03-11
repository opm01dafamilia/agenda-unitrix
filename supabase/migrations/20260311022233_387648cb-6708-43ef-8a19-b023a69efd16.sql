
-- Service availability: which days of the week a service is offered
CREATE TABLE public.service_available_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(service_id, weekday)
);

-- Service blocked periods: block a service for a specific date range
CREATE TABLE public.service_blocked_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  block_start DATE NOT NULL,
  block_end DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS for service_available_days
ALTER TABLE public.service_available_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages service available days"
  ON public.service_available_days FOR ALL
  TO authenticated
  USING (is_business_owner(auth.uid(), business_id))
  WITH CHECK (is_business_owner(auth.uid(), business_id));

CREATE POLICY "Anon reads service available days"
  ON public.service_available_days FOR SELECT
  TO anon
  USING (is_active = true);

-- RLS for service_blocked_periods
ALTER TABLE public.service_blocked_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages service blocked periods"
  ON public.service_blocked_periods FOR ALL
  TO authenticated
  USING (is_business_owner(auth.uid(), business_id))
  WITH CHECK (is_business_owner(auth.uid(), business_id));

CREATE POLICY "Anon reads service blocked periods"
  ON public.service_blocked_periods FOR SELECT
  TO anon
  USING (true);
