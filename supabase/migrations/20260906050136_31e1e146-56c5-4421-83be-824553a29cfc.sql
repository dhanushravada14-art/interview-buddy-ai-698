CREATE TABLE public.doubt_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New doubt',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doubt_threads TO authenticated;
GRANT ALL ON public.doubt_threads TO service_role;
ALTER TABLE public.doubt_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own doubt threads" ON public.doubt_threads FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.doubt_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.doubt_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role TEXT NOT NULL,
  parts JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX doubt_messages_thread_idx ON public.doubt_messages (thread_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doubt_messages TO authenticated;
GRANT ALL ON public.doubt_messages TO service_role;
ALTER TABLE public.doubt_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own doubt messages" ON public.doubt_messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);