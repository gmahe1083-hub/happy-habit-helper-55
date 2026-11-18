DROP POLICY IF EXISTS "Anyone with the app can read the cloud backup" ON public.cloud_backup;
DROP POLICY IF EXISTS "Anyone with the app can update the cloud backup" ON public.cloud_backup;
DROP POLICY IF EXISTS "Anyone with the app can write the cloud backup" ON public.cloud_backup;
CREATE POLICY "App users read the shared backup" ON public.cloud_backup FOR SELECT TO anon, authenticated USING (id = 1);
CREATE POLICY "App users save the shared backup" ON public.cloud_backup FOR INSERT TO anon, authenticated WITH CHECK (id = 1);
CREATE POLICY "App users update the shared backup" ON public.cloud_backup FOR UPDATE TO anon, authenticated USING (id = 1) WITH CHECK (id = 1);