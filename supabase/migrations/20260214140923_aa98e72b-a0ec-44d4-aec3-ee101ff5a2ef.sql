
-- Add brand customization columns
ALTER TABLE public.brands ADD COLUMN logo_url TEXT;
ALTER TABLE public.brands ADD COLUMN font_family TEXT DEFAULT 'DM Sans';

-- Create storage bucket for brand logos
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-logos', 'brand-logos', true);

-- Storage policies: authenticated users can upload/manage their own logos
CREATE POLICY "Users can upload brand logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'brand-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their brand logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'brand-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their brand logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'brand-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Brand logos are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'brand-logos');
