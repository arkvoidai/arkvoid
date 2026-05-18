-- Create the guest_sessions table
CREATE TABLE IF NOT EXISTS public.guest_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_device_id TEXT NOT NULL,
    fingerprint_hash TEXT NOT NULL,
    usage_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expired BOOLEAN DEFAULT FALSE,
    converted_to_user_id UUID REFERENCES auth.users(id),
    metadata JSONB
);

-- Enable Row Level Security
ALTER TABLE public.guest_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert if they don't exist
CREATE POLICY "Allow anonymous to insert their own session"
    ON public.guest_sessions FOR INSERT
    WITH CHECK (auth.role() = 'anon');

-- Allow anonymous users to select their own session by device id or fingerprint
CREATE POLICY "Allow anonymous to select their own session by device id"
    ON public.guest_sessions FOR SELECT
    USING (auth.role() = 'anon');

-- Allow anonymous to update their own session (usage_count)
CREATE POLICY "Allow anonymous to update their own session"
    ON public.guest_sessions FOR UPDATE
    USING (auth.role() = 'anon');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS guest_sessions_guest_device_id_idx ON public.guest_sessions(guest_device_id);
CREATE INDEX IF NOT EXISTS guest_sessions_fingerprint_hash_idx ON public.guest_sessions(fingerprint_hash);
