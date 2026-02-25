
-- Add missing columns
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.gallery_images ADD COLUMN IF NOT EXISTS caption text;
