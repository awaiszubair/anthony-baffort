
-- Table to store saved/bookmarked ads per user
CREATE TABLE public.saved_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ad_id TEXT NOT NULL,
  ad_name TEXT,
  ad_text TEXT,
  page_name TEXT,
  page_id TEXT,
  platform TEXT,
  image_url TEXT,
  snapshot_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, ad_id)
);

-- Enable RLS
ALTER TABLE public.saved_ads ENABLE ROW LEVEL SECURITY;

-- Users can only see their own saved ads
CREATE POLICY "Users can view own saved ads"
  ON public.saved_ads FOR SELECT
  USING (auth.uid() = user_id);

-- Users can save ads
CREATE POLICY "Users can insert own saved ads"
  ON public.saved_ads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unsave ads
CREATE POLICY "Users can delete own saved ads"
  ON public.saved_ads FOR DELETE
  USING (auth.uid() = user_id);
