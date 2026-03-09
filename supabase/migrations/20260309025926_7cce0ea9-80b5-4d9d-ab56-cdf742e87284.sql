
-- 1. Make cpf nullable on clients table
ALTER TABLE public.clients ALTER COLUMN cpf DROP NOT NULL;
ALTER TABLE public.clients ALTER COLUMN cpf SET DEFAULT '';

-- 2. Update appointments RLS: remove client_cpf requirement from anon insert
DROP POLICY IF EXISTS "Anon creates appointments" ON public.appointments;
CREATE POLICY "Anon creates appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (
    business_id IS NOT NULL
    AND appointment_date IS NOT NULL
    AND start_time IS NOT NULL
    AND client_name IS NOT NULL
    AND client_whatsapp IS NOT NULL
  );

-- 3. Update clients RLS: add cpf to anon insert check (now optional)
DROP POLICY IF EXISTS "Anon creates clients for booking" ON public.clients;
CREATE POLICY "Anon creates clients for booking"
  ON public.clients FOR INSERT
  WITH CHECK (
    business_id IS NOT NULL
    AND name IS NOT NULL
    AND whatsapp IS NOT NULL
  );
