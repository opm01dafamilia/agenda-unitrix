-- Allow anonymous users to read appointments for availability checking
CREATE POLICY "Anon reads appointments for availability"
  ON public.appointments FOR SELECT
  USING (true);

-- Allow anonymous users to insert clients for public booking
CREATE POLICY "Anon creates clients for booking"
  ON public.clients FOR INSERT
  WITH CHECK (
    business_id IS NOT NULL
    AND name IS NOT NULL
    AND whatsapp IS NOT NULL
  );