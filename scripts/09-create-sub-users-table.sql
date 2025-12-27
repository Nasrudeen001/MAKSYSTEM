-- Create sub_users table for role-based access
CREATE TABLE IF NOT EXISTS sub_users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Tajneed', 'Maal', 'Tarbiyyat', 'Ijtemas', 'Tabligh', 'Umumi', 'Talim-ul-Quran', 'Talim', 'Isaar', 'Dhahanat & Sihat-e-Jismani')),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_sub_users_username ON sub_users(username);

-- Enable RLS
ALTER TABLE sub_users ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users can read/write, but for simplicity, allow all for now
-- In production, restrict to admins
CREATE POLICY "Allow all operations on sub_users" ON sub_users FOR ALL USING (true);