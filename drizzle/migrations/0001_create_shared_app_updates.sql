CREATE TABLE public.shared_app_updates (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  payload jsonb NOT NULL,
  revision bigint NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.shared_app_updates TO anon, authenticated;
GRANT ALL ON public.shared_app_updates TO service_role;
ALTER TABLE public.shared_app_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "App users read shared updates" ON public.shared_app_updates FOR SELECT TO anon, authenticated USING (id = 1);
CREATE POLICY "App users publish shared updates" ON public.shared_app_updates FOR INSERT TO anon, authenticated WITH CHECK (id = 1);
CREATE POLICY "App users update shared updates" ON public.shared_app_updates FOR UPDATE TO anon, authenticated USING (id = 1) WITH CHECK (id = 1);