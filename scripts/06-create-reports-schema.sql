-- 06-create-reports-schema.sql
-- Idempotent migration to create/ensure report-related tables.
-- This file merges the logic from 07-ensure-other-reports-schema.sql so
-- that a single migration can provision the reporting tables used by the
-- application. The original `07-ensure-other-reports-schema.sql` is left
-- unchanged as a rollback/backup.

BEGIN;

-- Ensure report_data table (sectional monthly reports) exists. This is
-- the central storage used by the Report page and API.
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

-- Ensure other_reports table and its expected camelCase columns and
-- constraints exist. This was previously provided in 07-ensure-other-reports-schema.sql
-- and has been merged here to allow a single migration step for report
-- related schema changes.
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

-- Convert monthlyReport and visitedNazmEAla to boolean if they exist as non-boolean types
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='other_reports' AND lower(column_name) = 'monthlyreport' AND data_type <> 'boolean') THEN
    EXECUTE 'ALTER TABLE other_reports ALTER COLUMN monthlyreport TYPE boolean USING (CASE WHEN lower(monthlyreport) IN (''1'',''yes'',''true'',''t'') THEN true WHEN lower(monthlyreport) IN (''0'',''no'',''false'',''f'') THEN false ELSE NULL END)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='other_reports' AND lower(column_name) = 'visitednazmeala' AND data_type <> 'boolean') THEN
    EXECUTE 'ALTER TABLE other_reports ALTER COLUMN visitednazmeala TYPE boolean USING (CASE WHEN lower(visitednazmeala) IN (''1'',''yes'',''true'',''t'') THEN true WHEN lower(visitednazmeala) IN (''0'',''no'',''false'',''f'') THEN false ELSE NULL END)';
  END IF;
END$$;

-- Normalize month values: if month is numeric (1..12 or 01..12) convert to month name
DO $$
DECLARE
  m RECORD;
  month_map TEXT[] := ARRAY['January','February','March','April','May','June','July','August','September','October','November','December'];
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='other_reports' AND lower(column_name) = 'month') THEN
    FOR m IN SELECT id, month FROM other_reports WHERE month ~ '^\\s*\\d{1,2}\\s*$' LOOP
      BEGIN
        UPDATE other_reports SET month = month_map[TRIM(m.month)::int] WHERE id = m.id;
      EXCEPTION WHEN OTHERS THEN
        -- ignore individual conversion errors
      END;
    END LOOP;
  END IF;

  -- Also normalize report_data.report_month if it uses numeric months
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='report_data' AND lower(column_name) = 'report_month') THEN
    FOR m IN SELECT id, report_month FROM report_data WHERE report_month ~ '^\\s*\\d{1,2}\\s*$' LOOP
      BEGIN
        UPDATE report_data SET report_month = month_map[TRIM(m.report_month)::int] WHERE id = m.id;
      EXCEPTION WHEN OTHERS THEN
        -- ignore
      END;
    END LOOP;
  END IF;
END$$;

-- Create helpful indexes if missing
CREATE INDEX IF NOT EXISTS idx_other_reports_part ON other_reports(part);
CREATE INDEX IF NOT EXISTS idx_other_reports_region_majlis ON other_reports(region_id, majlis_id);
CREATE INDEX IF NOT EXISTS idx_other_reports_month_year ON other_reports(month, year);

-- Add FK constraints if referenced tables exist (safe/conditional)
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

-- End of merged reports migration (06). Keep 07 as a backup/mirror for safety.

-- Backfill other_reports normalized columns from report_data.details where possible.
DO $$
DECLARE
  rec RECORD;
  mapping RECORD;
  -- mapping of UI key -> other_reports column
  mappings TEXT[][] := ARRAY[
    ARRAY['no_of_1_to_1_meeting','oneToOneMeeting'],
    ARRAY['no_under_tabligh','underTabligh'],
    ARRAY['no_of_book_stall','bookStall'],
    ARRAY['no_of_literature_distributed','literatureDistributed'],
    ARRAY['no_of_new_contacts','newContacts'],
    ARRAY['no_of_exhibitions','exhibitions'],
    ARRAY['no_of_dain_e_ilallah','dainEIlallah'],
    ARRAY['no_of_baiats','baiats'],
    ARRAY['no_of_tabligh_days_held','tablighDaysHeld'],
    ARRAY['no_of_digital_content_created','digitalContentCreated'],
    ARRAY['merch_reflector_jackets','merchReflectorJackets'],
    ARRAY['merch_tshirts','merchTShirts'],
    ARRAY['merch_caps','merchCaps'],
    ARRAY['merch_stickers','merchStickers'],
    ARRAY['monthly_report_yes_no','monthlyReport'],
    ARRAY['no_of_amila_meeting','amilaMeeting'],
    ARRAY['no_of_general_meeting','generalMeeting'],
    ARRAY['visited_by_nazm_e_ala_yes_no','visitedNazmEAla'],
    ARRAY['no_of_talim_ul_quran_held','talimUlQuranHeld'],
    ARRAY['no_of_ansar_attending','ansarAttending'],
    ARRAY['avg_no_of_ansar_joining_weekly_quran_class','avgAnsarJoiningWeeklyQuran'],
    ARRAY['no_of_ansar_reading_book','ansarReadingBook'],
    ARRAY['no_of_ansar_participated_in_exam','ansarParticipatedExam'],
    ARRAY['no_of_ansar_visiting_sick','ansarVisitingSick'],
    ARRAY['no_of_ansar_visiting_elderly','ansarVisitingElderly'],
    ARRAY['no_of_feed_the_hungry_program_held','feedHungryProgramHeld'],
    ARRAY['no_of_ansar_participated_in_feed_the_hungry','ansarParticipatedFeedHungry'],
    ARRAY['no_of_ansar_regular_in_exercise','ansarRegularExercise'],
    ARRAY['no_of_ansar_who_owns_bicycle','ansarOwnsBicycle']
  ];
  details_json JSONB;
  upd TEXT;
  key TEXT;
  col TEXT;
  val TEXT;
BEGIN
  FOR rec IN SELECT id, region_id, majlis_id, report_month, report_year, section_key, details FROM report_data LOOP
    BEGIN
      details_json := rec.details;
      -- Build an UPDATE statement for the corresponding other_reports row
      upd := '';
      FOR i IN array_lower(mappings,1)..array_upper(mappings,1) LOOP
        key := mappings[i][1]; col := mappings[i][2];
        IF details_json ? key THEN
          -- Extract value as text
          val := (details_json->>key);
          IF col IN ('monthlyReport','visitedNazmEAla') THEN
            -- boolean conversion
            IF lower(val) IN ('1','yes','true','t') THEN
              upd := upd || format('%I = true,', col);
            ELSIF lower(val) IN ('0','no','false','f') THEN
              upd := upd || format('%I = false,', col);
            ELSE
              upd := upd || format('%I = NULL,', col);
            END IF;
          ELSE
            -- numeric conversion when possible
            IF val ~ '^\s*-?\d+\s*$' THEN
              upd := upd || format('%I = %s,', col, val);
            ELSE
              -- preserve NULL when non-numeric
              upd := upd || format('%I = NULL,', col);
            END IF;
          END IF;
        END IF;
      END LOOP;

      IF upd <> '' THEN
        -- remove trailing comma
        upd := left(upd, length(upd)-1);
        EXECUTE format('UPDATE other_reports SET %s WHERE part = %L AND region_id = %L AND majlis_id = %L AND month = %L AND year = %s', upd, rec.section_key, rec.region_id::text, rec.majlis_id::text, rec.report_month, rec.report_year::text);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- ignore per-row failures
    END;
  END LOOP;
END$$;

CREATE OR REPLACE VIEW tabligh_reports AS
  SELECT id AS other_reports_id, part, region_id, majlis_id, region, majlis, month, year,
    oneToOneMeeting, underTabligh, bookStall, literatureDistributed, newContacts, exhibitions,
    dainEIlallah, baiats, tablighDaysHeld, digitalContentCreated, merchReflectorJackets,
    merchTShirts, merchCaps, merchStickers, created_at
  FROM other_reports WHERE part = 'tabligh';

  CREATE OR REPLACE VIEW tabligh_digital_reports AS
    SELECT id AS other_reports_id, part, region_id, majlis_id, region, majlis, month, year,
      digitalContentCreated, merchReflectorJackets, merchTShirts, merchCaps, merchStickers, created_at
    FROM other_reports WHERE part = 'tabligh_digital';

CREATE OR REPLACE VIEW umumi_reports AS
  SELECT id AS other_reports_id, part, region_id, majlis_id, region, majlis, month, year,
    monthlyReport, amilaMeeting, generalMeeting, visitedNazmEAla, created_at
  FROM other_reports WHERE part = 'umumi';

CREATE OR REPLACE VIEW talim_ul_quran_reports AS
  SELECT id AS other_reports_id, part, region_id, majlis_id, region, majlis, month, year,
    talimUlQuranHeld, ansarAttending, avgAnsarJoiningWeeklyQuran, created_at
  FROM other_reports WHERE part = 'talim_ul_quran';

CREATE OR REPLACE VIEW talim_reports AS
  SELECT id AS other_reports_id, part, region_id, majlis_id, region, majlis, month, year,
    ansarReadingBook, ansarParticipatedExam, created_at
  FROM other_reports WHERE part = 'talim';

CREATE OR REPLACE VIEW isaar_reports AS
  SELECT id AS other_reports_id, part, region_id, majlis_id, region, majlis, month, year,
    ansarVisitingSick, ansarVisitingElderly, feedHungryProgramHeld, ansarParticipatedFeedHungry, created_at
  FROM other_reports WHERE part = 'isaar';

CREATE OR REPLACE VIEW sihat_reports AS
  SELECT id AS other_reports_id, part, region_id, majlis_id, region, majlis, month, year,
    ansarRegularExercise, ansarOwnsBicycle, created_at
  FROM other_reports WHERE part = 'sihat';
