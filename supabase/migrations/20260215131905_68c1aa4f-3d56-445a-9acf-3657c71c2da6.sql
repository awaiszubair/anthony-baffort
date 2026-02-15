
-- Create storage bucket for saved ad media copies
INSERT INTO storage.buckets (id, name, public) VALUES ('saved-ad-media', 'saved-ad-media', true);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own saved ad media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'saved-ad-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to view their own media
CREATE POLICY "Users can view own saved ad media"
ON storage.objects FOR SELECT
USING (bucket_id = 'saved-ad-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own media
CREATE POLICY "Users can delete own saved ad media"
ON storage.objects FOR DELETE
USING (bucket_id = 'saved-ad-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add a column for the stored copy URL
ALTER TABLE public.saved_ads ADD COLUMN stored_media_url text;
