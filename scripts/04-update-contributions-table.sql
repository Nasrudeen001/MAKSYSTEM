-- Update contributions table to ensure all required columns exist
-- This script can be run safely even if the table already exists

-- First, check if the contributions table exists and has the correct structure
DO $$
BEGIN
    -- Drop the table if it exists to recreate with correct structure
    DROP TABLE IF EXISTS contributions CASCADE;
    
    -- Create the contributions table with all required columns
    CREATE TABLE contributions (
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
        UNIQUE(participant_id, month)
    );
    
    -- Enable RLS
    ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policy
    CREATE POLICY "Allow all operations on contributions" ON contributions FOR ALL USING (true);
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_contributions_participant ON contributions(participant_id);
    CREATE INDEX IF NOT EXISTS idx_contributions_month ON contributions(month);
    
    -- Create trigger for updating timestamps
    CREATE TRIGGER update_contributions_updated_at 
        BEFORE UPDATE ON contributions 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
        
    RAISE NOTICE 'Contributions table updated successfully with all required columns';
END
$$;
