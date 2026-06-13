/*
  # Google Calendar Integration

  1. New Tables
    - `google_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `access_token` (text)
      - `refresh_token` (text)
      - `expiry_date` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `google_tokens` table
    - Add policy for users to manage only their own tokens
*/

-- Create the google_tokens table
CREATE TABLE IF NOT EXISTS google_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expiry_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_google_tokens_user_id ON google_tokens(user_id);

-- Enable Row Level Security
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage only their own tokens
CREATE POLICY "Users can manage their own Google tokens"
ON google_tokens
FOR ALL
TO authenticated
USING (
  user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_google_tokens_updated_at
BEFORE UPDATE ON google_tokens
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();