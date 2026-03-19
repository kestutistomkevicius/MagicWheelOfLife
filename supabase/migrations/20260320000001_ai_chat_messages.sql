-- ai_chat_messages: per-user per-category conversation history for AI Coach feature
-- Messages auto-deleted after 3 months via pg_cron job

CREATE TABLE public.ai_chat_messages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid        NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  role        text        NOT NULL CHECK (role IN ('user', 'assistant')),
  content     text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Composite index: efficient per-user per-category message load ordered by time
CREATE INDEX ai_chat_messages_user_category_idx
  ON public.ai_chat_messages (user_id, category_id, created_at);

ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_chat_messages: select own"
  ON public.ai_chat_messages FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "ai_chat_messages: insert own"
  ON public.ai_chat_messages FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "ai_chat_messages: delete own"
  ON public.ai_chat_messages FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- pg_cron: delete messages older than 3 months; runs at 3am on 1st of each month
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'delete-old-ai-chat-messages',
  '0 3 1 * *',
  $$DELETE FROM public.ai_chat_messages WHERE created_at < NOW() - INTERVAL '3 months'$$
);
