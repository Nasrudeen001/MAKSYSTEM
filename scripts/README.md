This folder contains idempotent SQL migration scripts used to provision the database schema for local development and for manual migrations.

Changes in this commit:
- Added `06-create-reports-schema.sql` which ensures the `report_data` and `other_reports` tables exist and contain the expected columns, indexes and foreign keys. This file merges the logic previously provided in `07-ensure-other-reports-schema.sql` so a single script can provision reporting tables.
- `07-ensure-other-reports-schema.sql` is left unchanged as a backup/mirror to avoid accidental data loss; you can remove it once you've confirmed `06` ran successfully in your environment.

How to run:
1. Connect to your Postgres/Supabase database.
2. Execute the script(s) in order (01..). Example:

   psql <connection-string> -f scripts/01-create-supabase-schema.sql
   psql <connection-string> -f scripts/02-seed-sample-data.sql
   ...
   psql <connection-string> -f scripts/06-create-reports-schema.sql

Notes:
- All statements are written idempotently (CREATE TABLE IF NOT EXISTS, ALTER TABLE ... ADD COLUMN IF NOT EXISTS, CREATE INDEX IF NOT EXISTS) so they can be applied multiple times safely.
- The migration includes conditional FK creation guarded by checks against information_schema so it won't fail if referenced tables don't yet exist.
