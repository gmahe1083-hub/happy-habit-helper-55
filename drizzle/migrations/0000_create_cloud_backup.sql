CREATE TABLE public.cloud_backup (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.cloud_backup TO anon;
GRANT SELECT, INSERT, UPDATE ON public.cloud_backup TO authenticated;
GRANT ALL ON public.cloud_backup TO service_role;

ALTER TABLE public.cloud_backup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone with the app can read the cloud backup"
ON public.cloud_backup FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone with the app can write the cloud backup"
ON public.cloud_backup FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone with the app can update the cloud backup"
ON public.cloud_backup FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);