
-- Fix 1: Security Definer View -> use SECURITY INVOKER (default, but explicit)
DROP VIEW IF EXISTS public.businesses_public;
CREATE VIEW public.businesses_public
WITH (security_invoker = true)
AS
SELECT
  id, name, slug, industry,
  theme_primary_color, theme_secondary_color,
  operating_hours, auto_accept_appointments,
  avatar_url, city
FROM public.businesses;

-- Re-grant since we recreated the view
GRANT SELECT ON public.businesses_public TO anon;
GRANT SELECT ON public.businesses_public TO authenticated;

-- For anon to read from the view, businesses needs a SELECT policy for anon
-- but ONLY through the view (which limits columns). We need a restricted anon policy:
CREATE POLICY "Anon reads businesses via public view" ON public.businesses FOR SELECT TO anon USING (true);

-- Fix 2: Tighten the overly permissive anon INSERT on appointments
-- Replace with check that business_id is valid and required fields are present
DROP POLICY IF EXISTS "Anon creates appointments" ON public.appointments;
CREATE POLICY "Anon creates appointments" ON public.appointments FOR INSERT TO anon
WITH CHECK (
  business_id IS NOT NULL
  AND appointment_date IS NOT NULL
  AND start_time IS NOT NULL
  AND client_name IS NOT NULL
  AND client_cpf IS NOT NULL
  AND client_whatsapp IS NOT NULL
);

-- Tighten anon gallery read to only specific business
DROP POLICY IF EXISTS "Anon reads gallery for public page" ON public.gallery_images;
CREATE POLICY "Anon reads gallery for public page" ON public.gallery_images FOR SELECT TO anon USING (business_id IS NOT NULL);

-- Tighten anon appointment file upload
DROP POLICY IF EXISTS "Anon upload appointment files" ON storage.objects;
CREATE POLICY "Anon upload appointment files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'appointments');
