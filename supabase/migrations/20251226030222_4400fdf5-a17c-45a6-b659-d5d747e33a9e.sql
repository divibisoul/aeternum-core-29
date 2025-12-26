-- Users profile table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- API Keys table (encrypted storage)
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  provider TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- API Keys policies
CREATE POLICY "Users can view own api_keys" ON public.api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own api_keys" ON public.api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own api_keys" ON public.api_keys FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own api_keys" ON public.api_keys FOR DELETE USING (auth.uid() = user_id);

-- Sessions table
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON public.sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sessions" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.sessions FOR DELETE USING (auth.uid() = user_id);

-- Events table (audit log)
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  session_id UUID REFERENCES public.sessions ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Users can view own events" ON public.events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own events" ON public.events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Memories table (LTM - storing content as text, embedding can be added later)
CREATE TABLE public.memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions ON DELETE SET NULL,
  content TEXT NOT NULL,
  embedding_data JSONB,
  memory_type TEXT DEFAULT 'general',
  importance REAL DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Memories policies
CREATE POLICY "Users can view own memories" ON public.memories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memories" ON public.memories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memories" ON public.memories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own memories" ON public.memories FOR DELETE USING (auth.uid() = user_id);

-- Modules table (enabled/disabled state)
CREATE TABLE public.modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Enable RLS
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Modules policies
CREATE POLICY "Users can view own modules" ON public.modules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own modules" ON public.modules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own modules" ON public.modules FOR UPDATE USING (auth.uid() = user_id);

-- Messages table for chat history
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.sessions ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages policies
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON public.api_keys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes for performance
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_events_session_id ON public.events(session_id);
CREATE INDEX idx_events_type ON public.events(event_type);
CREATE INDEX idx_memories_user_id ON public.memories(user_id);
CREATE INDEX idx_messages_session_id ON public.messages(session_id);