-- 07-ensure-other-reports-schema.sql
-- Idempotent migration to ensure the `other_reports` table has the
-- expected camelCase columns and constraints used by the application.
-- It will also attempt to migrate data from legacy snake_case columns
-- into the canonical camelCase columns if those legacy columns exist.

BEGIN;

-- Create table if it does not exist
CREATE TABLE IF NOT EXISTS other_reports (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  part VARCHAR(50) NOT NULL,
  region_id UUID,
  majlis_id UUID,
  region VARCHAR(200),
  majlis VARCHAR(200),
  month VARCHAR(20) NOT NULL,
  year INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add or ensure camelCase columns exist (non-destructive)
ALTER TABLE other_reports
  ADD COLUMN IF NOT EXISTS oneToOneMeeting INT,
  ADD COLUMN IF NOT EXISTS underTabligh INT,
  ADD COLUMN IF NOT EXISTS bookStall INT,
  ADD COLUMN IF NOT EXISTS literatureDistributed INT,
  ADD COLUMN IF NOT EXISTS newContacts INT,
  ADD COLUMN IF NOT EXISTS exhibitions INT,
  ADD COLUMN IF NOT EXISTS dainEIlallah INT,
  ADD COLUMN IF NOT EXISTS baiats INT,
  ADD COLUMN IF NOT EXISTS tablighDaysHeld INT,
  ADD COLUMN IF NOT EXISTS digitalContentCreated INT,
  ADD COLUMN IF NOT EXISTS merchReflectorJackets INT,
  ADD COLUMN IF NOT EXISTS merchTShirts INT,
  ADD COLUMN IF NOT EXISTS merchCaps INT,
  ADD COLUMN IF NOT EXISTS merchStickers INT,
  ADD COLUMN IF NOT EXISTS monthlyReport VARCHAR(10),
  ADD COLUMN IF NOT EXISTS amilaMeeting INT,
  ADD COLUMN IF NOT EXISTS generalMeeting INT,
  ADD COLUMN IF NOT EXISTS visitedNazmEAla VARCHAR(10),
  ADD COLUMN IF NOT EXISTS talimUlQuranHeld INT,
  ADD COLUMN IF NOT EXISTS ansarAttending INT,
  ADD COLUMN IF NOT EXISTS avgAnsarJoiningWeeklyQuran INT,
  ADD COLUMN IF NOT EXISTS ansarReadingBook INT,
  ADD COLUMN IF NOT EXISTS ansarParticipatedExam INT,
  ADD COLUMN IF NOT EXISTS ansarVisitingSick INT,
  ADD COLUMN IF NOT EXISTS ansarVisitingElderly INT,
  ADD COLUMN IF NOT EXISTS feedHungryProgramHeld INT,
  ADD COLUMN IF NOT EXISTS ansarParticipatedFeedHungry INT,
  ADD COLUMN IF NOT EXISTS ansarRegularExercise INT,
  ADD COLUMN IF NOT EXISTS ansarOwnsBicycle INT;

-- Create helpful indexes if missing
CREATE INDEX IF NOT EXISTS idx_other_reports_part ON other_reports(part);
CREATE INDEX IF NOT EXISTS idx_other_reports_region_majlis ON other_reports(region_id, majlis_id);
CREATE INDEX IF NOT EXISTS idx_other_reports_month_year ON other_reports(month, year);

-- Add FK constraints if referenced tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'regions') THEN
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_other_reports_region' AND table_name = 'other_reports'
      ) THEN
        ALTER TABLE other_reports ADD CONSTRAINT fk_other_reports_region FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL;
      END IF;
    EXCEPTION WHEN undefined_table THEN
      -- ignore
    END;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'majlis') THEN
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_other_reports_majlis' AND table_name = 'other_reports'
      ) THEN
        ALTER TABLE other_reports ADD CONSTRAINT fk_other_reports_majlis FOREIGN KEY (majlis_id) REFERENCES majlis(id) ON DELETE SET NULL;
      END IF;
    EXCEPTION WHEN undefined_table THEN
      -- ignore
    END;
  END IF;
END$$;

-- Migrate data from legacy snake_case columns into camelCase columns when present
-- This is conservative: it only copies values when the legacy column exists and the
-- target camelCase column is NULL.

DO $$
DECLARE
  rec RECORD;
BEGIN
  -- A small helper list of pairs: legacy -> canonical
  FOR rec IN VALUES
    ('onetoonemeeting','oneToOneMeeting'),
    ('undertabligh','underTabligh'),
    ('bookstall','bookStall'),
    ('literaturedistributed','literatureDistributed'),
    ('newcontacts','newContacts'),
    ('exhibitions','exhibitions'),
    ('daineilallah','dainEIlallah'),
    ('baiats','baiats'),
    ('tablighdaysheld','tablighDaysHeld'),
    ('digitalcontentcreated','digitalContentCreated'),
    ('merchreflectorjackets','merchReflectorJackets'),
    ('merchtshirts','merchTShirts'),
    ('merchcaps','merchCaps'),
    ('merchstickers','merchStickers'),
    ('monthlyreport','monthlyReport'),
    ('amilameeting','amilaMeeting'),
    ('generalmeeting','generalMeeting'),
    ('visitednazmeala','visitedNazmEAla'),
    ('talimulquranheld','talimUlQuranHeld'),
    ('ansarattending','ansarAttending'),
    ('avgansarjoiningweeklyquran','avgAnsarJoiningWeeklyQuran'),
    ('ansarreadingbook','ansarReadingBook'),
    ('ansarparticipatedexam','ansarParticipatedExam'),
    ('ansarvisitingsick','ansarVisitingSick'),
    ('ansarvisitingelderly','ansarVisitingElderly'),
    ('feedhungryprogramheld','feedHungryProgramHeld'),
    ('ansarparticipatedfeedhungry','ansarParticipatedFeedHungry'),
    ('ansarregularexercise','ansarRegularExercise'),
    ('ansarownsbicycle','ansarOwnsBicycle')
  LOOP
    -- rec.column1 is legacy, rec.column2 is canonical
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='other_reports' AND column_name = rec.column1) THEN
      -- Only copy when canonical column exists and is NULL
      IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='other_reports' AND column_name = rec.column2) THEN
        EXECUTE format('UPDATE other_reports SET "%I" = "%I" WHERE "%I" IS NULL AND "%I" IS NOT NULL', rec.column2, rec.column1, rec.column2, rec.column1);
      END IF;
    END IF;
  END LOOP;
END$$;

COMMIT;

-- End of migration
