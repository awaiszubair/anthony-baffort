
-- Create brands table to track which brands to monitor
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  page_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Public access (single-user tool)
CREATE POLICY "Allow public read" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.brands FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.brands FOR DELETE USING (true);
CREATE POLICY "Allow public update" ON public.brands FOR UPDATE USING (true);
