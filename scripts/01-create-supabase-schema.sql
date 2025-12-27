-- Majlis Ansarullah Kenya Ijtema Management System
-- Complete Supabase Database Schema
-- This script creates all necessary tables, functions, and policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing enum types if they exist to avoid conflicts
DROP TYPE IF EXISTS participant_category CASCADE;
DROP TYPE IF EXISTS contribution_type CASCADE;
DROP TYPE IF EXISTS participant_status CASCADE;

-- Create enum types
CREATE TYPE participant_category AS ENUM ('Saf Awwal', 'Saf Dom', 'General');
CREATE TYPE contribution_type AS ENUM ('Chanda Aam', 'Chanda Jalsa Salana', 'Tehrik-e-Jadid', 'Waqf-e-Jadid', 'Other');
CREATE TYPE participant_status AS ENUM ('registered', 'enrolled', 'active', 'inactive');

-- Create regions table
CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create majlis table
CREATE TABLE IF NOT EXISTS majlis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, region_id)
);

-- Updated participants table to include all fields expected by the registration form and components
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_number VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL, -- For backward compatibility
    islamic_names VARCHAR(100),
    islamic_name VARCHAR(100), -- For backward compatibility
    date_of_birth DATE NOT NULL,
    years INTEGER NOT NULL CHECK (years > 0),
    age INTEGER NOT NULL CHECK (age > 0), -- For backward compatibility
    category participant_category NOT NULL,
    mobile_number VARCHAR(20),
    email VARCHAR(100),
    phone VARCHAR(20), -- For backward compatibility
    region VARCHAR(100),
    region_id UUID REFERENCES regions(id),
    majlis VARCHAR(100),
    majlis_id UUID REFERENCES majlis(id),
    jamaat VARCHAR(100), -- For backward compatibility
    -- Random Questions (migrated from academic_data)
    knows_prayer_full BOOLEAN,
    knows_prayer_meaning BOOLEAN,
    can_read_quran BOOLEAN,
    owns_bicycle BOOLEAN,
    -- Baiat information
    baiat_type VARCHAR(50), -- 'By birth' | 'By Baiat'
    baiat_date DATE,
    nau_mobaeen BOOLEAN,
    -- Removed emergency_contact_name, emergency_contact_phone, dietary_requirements, medical_conditions
    status participant_status DEFAULT 'registered',
    registration_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure required participants columns exist on legacy databases (idempotent)
ALTER TABLE participants ADD COLUMN IF NOT EXISTS registration_number VARCHAR(20);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS islamic_names VARCHAR(100);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS years INTEGER;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS category participant_category;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS region VARCHAR(100);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS region_id UUID;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS majlis VARCHAR(100);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS majlis_id UUID;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS knows_prayer_full BOOLEAN;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS knows_prayer_meaning BOOLEAN;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS can_read_quran BOOLEAN;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS owns_bicycle BOOLEAN;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS baiat_type VARCHAR(50);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS baiat_date DATE;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS nau_mobaeen BOOLEAN;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS status participant_status;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS registration_date DATE;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Backfill defaults where necessary (safe no-ops if rows already set)
UPDATE participants SET status = COALESCE(status, 'registered')::participant_status;
UPDATE participants SET registration_date = COALESCE(registration_date, CURRENT_DATE);

-- Enhanced academic_data table with additional assessment and performance tracking fields
CREATE TABLE IF NOT EXISTS academic_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    
    -- Random Questions
    knows_prayer_full BOOLEAN DEFAULT FALSE,
    knows_prayer_meaning BOOLEAN DEFAULT FALSE,
    can_read_quran BOOLEAN DEFAULT FALSE,
    owns_bicycle BOOLEAN DEFAULT FALSE,
    
    -- Spiritual Monthly Report
    report_month VARCHAR(20),
    report_year INTEGER CHECK (report_year >= 2000 AND report_year <= 2100),
    avg_prayers_per_day INTEGER DEFAULT 0 CHECK (avg_prayers_per_day >= 0 AND avg_prayers_per_day <= 5),
    days_tilawat_done INTEGER DEFAULT 0 CHECK (days_tilawat_done >= 0 AND days_tilawat_done <= 31),
    friday_prayers_attended INTEGER DEFAULT 0 CHECK (friday_prayers_attended >= 0 AND friday_prayers_attended <= 5),
    huzur_sermons_listened INTEGER DEFAULT 0 CHECK (huzur_sermons_listened >= 0 AND huzur_sermons_listened <= 5),
    nafli_fasts INTEGER DEFAULT 0 CHECK (nafli_fasts >= 0 AND nafli_fasts <= 31),
    
    -- Performance tracking
    overall_grade VARCHAR(5) DEFAULT 'N/A',
    average_score DECIMAL(5,2) DEFAULT 0.00,
    total_assessments INTEGER DEFAULT 0,
    completed_assessments INTEGER DEFAULT 0,
    attendance_rate DECIMAL(5,2) DEFAULT 0.00,
    certificates_earned INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant_id, report_month, report_year)
);

-- Added assessments table for tracking individual assessment results
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    score DECIMAL(5,2) NOT NULL CHECK (score >= 0),
    total_marks DECIMAL(5,2) NOT NULL CHECK (total_marks > 0),
    grade VARCHAR(5) NOT NULL,
    feedback TEXT,
    examiner VARCHAR(100),
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Added sessions table for tracking academic sessions and attendance
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    instructor VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue VARCHAR(100) NOT NULL,
    description TEXT,
    max_participants INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Added session_enrollments table for tracking participant enrollment and attendance
CREATE TABLE IF NOT EXISTS session_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    attendance_status VARCHAR(20) DEFAULT 'pending', -- pending, present, absent, excused
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant_id, session_id)
);

-- Added certificates table for tracking issued certificates
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    issue_date DATE DEFAULT CURRENT_DATE,
    verification_code VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'issued',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Updated contributions table to match the application's expected structure with separate columns for each contribution type
CREATE TABLE IF NOT EXISTS contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    month VARCHAR(20) NOT NULL,
    year INTEGER CHECK (year >= 2000 AND year <= 2100),
    chanda_majlis DECIMAL(10,2) DEFAULT NULL CHECK (chanda_majlis >= 0),
    chanda_ijtema DECIMAL(10,2) DEFAULT NULL CHECK (chanda_ijtema >= 0),
    tehrik_e_jadid DECIMAL(10,2) DEFAULT NULL CHECK (tehrik_e_jadid >= 0),
    waqf_e_jadid DECIMAL(10,2) DEFAULT NULL CHECK (waqf_e_jadid >= 0),
    publication DECIMAL(10,2) DEFAULT NULL CHECK (publication >= 0),
    khidmat_e_khalq DECIMAL(10,2) DEFAULT NULL CHECK (khidmat_e_khalq >= 0),
    ansar_project DECIMAL(10,2) DEFAULT NULL CHECK (ansar_project >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant_id, month, year)
);

-- Event settings (current/active event configuration)
CREATE TABLE IF NOT EXISTS event_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name VARCHAR(200) NOT NULL,
    event_location VARCHAR(200) NOT NULL,
    event_start_date DATE NOT NULL,
    total_days INTEGER NOT NULL CHECK (total_days > 0 AND total_days <= 30),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event attendance (participants present in the current event)
CREATE TABLE IF NOT EXISTS event_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES event_settings(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    present BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, participant_id)
);

-- Report data for sectional monthly reports (Report page)
CREATE TABLE IF NOT EXISTS report_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
    majlis_id UUID REFERENCES majlis(id) ON DELETE SET NULL,
    report_month VARCHAR(20) NOT NULL,
    report_year INTEGER CHECK (report_year >= 2000 AND report_year <= 2100) NOT NULL,
    section_key TEXT NOT NULL,
    section_title TEXT,
    details JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(region_id, majlis_id, report_month, report_year, section_key)
);

-- Updated function to generate registration numbers with proper category handling
CREATE OR REPLACE FUNCTION generate_registration_number()
RETURNS TRIGGER AS $$
DECLARE
    prefix VARCHAR(2);
    next_number INTEGER;
    reg_number VARCHAR(20);
BEGIN
    -- Determine prefix based on category
    IF NEW.category = 'Saf Awwal' THEN
        prefix := 'AA';
    ELSIF NEW.category = 'Saf Dom' THEN
        prefix := 'AD';
    ELSE
        prefix := 'GN'; -- General category
    END IF;
    
    -- Get next number for this category
    SELECT COALESCE(MAX(CAST(SUBSTRING(registration_number FROM 3) AS INTEGER)), 0) + 1
    INTO next_number
    FROM participants 
    WHERE registration_number LIKE prefix || '%';
    
    -- Generate registration number with zero padding
    reg_number := prefix || LPAD(next_number::TEXT, 3, '0');
    
    NEW.registration_number := reg_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Added trigger to sync name fields for backward compatibility
CREATE OR REPLACE FUNCTION sync_participant_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync full_name to name for backward compatibility
    IF NEW.full_name IS NOT NULL AND NEW.full_name != '' THEN
        NEW.name := NEW.full_name;
    END IF;
    
    -- Sync islamic_names to islamic_name for backward compatibility
    IF NEW.islamic_names IS NOT NULL AND NEW.islamic_names != '' THEN
        NEW.islamic_name := NEW.islamic_names;
    END IF;
    
    -- Set email from phone if not provided (for backward compatibility)
    IF NEW.email IS NULL OR NEW.email = '' THEN
        NEW.email := LOWER(REPLACE(NEW.full_name, ' ', '.')) || '@temp.email';
    END IF;
    
    -- Sync mobile_number to phone for backward compatibility
    IF NEW.mobile_number IS NOT NULL AND NEW.mobile_number != '' THEN
        NEW.phone := NEW.mobile_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating registration numbers
DROP TRIGGER IF EXISTS generate_registration_number_trigger ON participants;
CREATE TRIGGER generate_registration_number_trigger
    BEFORE INSERT ON participants
    FOR EACH ROW
    WHEN (NEW.registration_number IS NULL OR NEW.registration_number = '')
    EXECUTE FUNCTION generate_registration_number();

-- Added trigger for syncing participant name fields
DROP TRIGGER IF EXISTS sync_participant_names_trigger ON participants;
CREATE TRIGGER sync_participant_names_trigger
    BEFORE INSERT OR UPDATE ON participants
    FOR EACH ROW
    EXECUTE FUNCTION sync_participant_names();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
DROP TRIGGER IF EXISTS update_regions_updated_at ON regions;
CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON regions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_majlis_updated_at ON majlis;
CREATE TRIGGER update_majlis_updated_at BEFORE UPDATE ON majlis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_participants_updated_at ON participants;
CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_academic_data_updated_at ON academic_data;
CREATE TRIGGER update_academic_data_updated_at BEFORE UPDATE ON academic_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contributions_updated_at ON contributions;
CREATE TRIGGER update_contributions_updated_at BEFORE UPDATE ON contributions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assessments_updated_at ON assessments;
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_session_enrollments_updated_at ON session_enrollments;
CREATE TRIGGER update_session_enrollments_updated_at BEFORE UPDATE ON session_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_certificates_updated_at ON certificates;
CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE majlis ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for now - can be restricted later)
DROP POLICY IF EXISTS "Allow all operations on regions" ON regions;
CREATE POLICY "Allow all operations on regions" ON regions FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on majlis" ON majlis;
CREATE POLICY "Allow all operations on majlis" ON majlis FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on participants" ON participants;
CREATE POLICY "Allow all operations on participants" ON participants FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on academic_data" ON academic_data;
CREATE POLICY "Allow all operations on academic_data" ON academic_data FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on contributions" ON contributions;
CREATE POLICY "Allow all operations on contributions" ON contributions FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on assessments" ON assessments;
CREATE POLICY "Allow all operations on assessments" ON assessments FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on sessions" ON sessions;
CREATE POLICY "Allow all operations on sessions" ON sessions FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on session_enrollments" ON session_enrollments;
CREATE POLICY "Allow all operations on session_enrollments" ON session_enrollments FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on certificates" ON certificates;
CREATE POLICY "Allow all operations on certificates" ON certificates FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_participants_category ON participants(category);
CREATE INDEX IF NOT EXISTS idx_participants_region ON participants(region_id);
CREATE INDEX IF NOT EXISTS idx_participants_majlis ON participants(majlis_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);
CREATE INDEX IF NOT EXISTS idx_academic_data_participant ON academic_data(participant_id);
CREATE INDEX IF NOT EXISTS idx_contributions_participant ON contributions(participant_id);
CREATE INDEX IF NOT EXISTS idx_contributions_type ON contributions(chanda_majlis, chanda_ijtema, tehrik_e_jadid, waqf_e_jadid, publication, khidmat_e_khalq, ansar_project);
CREATE INDEX IF NOT EXISTS idx_assessments_participant ON assessments(participant_id);
CREATE INDEX IF NOT EXISTS idx_assessments_date ON assessments(date);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_session_enrollments_participant ON session_enrollments(participant_id);
CREATE INDEX IF NOT EXISTS idx_session_enrollments_session ON session_enrollments(session_id);
CREATE INDEX IF NOT EXISTS idx_certificates_participant ON certificates(participant_id);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON certificates(certificate_number);
