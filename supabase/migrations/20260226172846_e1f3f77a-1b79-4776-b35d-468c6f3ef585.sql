
-- Add is_active to businesses for admin blocking
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Create trigger for auto-creating profile on signup (function already exists)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
