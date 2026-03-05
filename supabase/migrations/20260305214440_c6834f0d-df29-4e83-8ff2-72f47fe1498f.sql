
-- 1. Update clients RLS: drop old policies, add granular ones
DROP POLICY IF EXISTS "Owner manages clients" ON public.clients;
DROP POLICY IF EXISTS "Clients: select own business" ON public.clients;
DROP POLICY IF EXISTS "Clients: insert own business" ON public.clients;
DROP POLICY IF EXISTS "Clients: update own business" ON public.clients;
DROP POLICY IF EXISTS "Clients: delete own business" ON public.clients;

CREATE POLICY "Clients: select own business"
ON public.clients FOR SELECT TO authenticated
USING (public.is_business_owner(auth.uid(), business_id));

CREATE POLICY "Clients: insert own business"
ON public.clients FOR INSERT TO authenticated
WITH CHECK (public.is_business_owner(auth.uid(), business_id));

CREATE POLICY "Clients: update own business"
ON public.clients FOR UPDATE TO authenticated
USING (public.is_business_owner(auth.uid(), business_id))
WITH CHECK (public.is_business_owner(auth.uid(), business_id));

CREATE POLICY "Clients: delete own business"
ON public.clients FOR DELETE TO authenticated
USING (public.is_business_owner(auth.uid(), business_id));

-- 2. Add address fields to professionals
ALTER TABLE public.professionals
ADD COLUMN IF NOT EXISTS address_line text,
ADD COLUMN IF NOT EXISTS address_city text,
ADD COLUMN IF NOT EXISTS address_state text,
ADD COLUMN IF NOT EXISTS address_reference text;

-- 3. Allow anon to read active professionals for public booking
DROP POLICY IF EXISTS "Anon reads active professionals" ON public.professionals;
CREATE POLICY "Anon reads active professionals"
ON public.professionals FOR SELECT
USING (active = true);
