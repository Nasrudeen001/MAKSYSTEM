-- Update academic_data table to add Tarbiyyat fields
ALTER TABLE academic_data
  ADD COLUMN IF NOT EXISTS tahajjud_days INTEGER DEFAULT 0 CHECK (tahajjud_days >= 0 AND tahajjud_days <= 31),
  ADD COLUMN IF NOT EXISTS quran_classes_attended INTEGER DEFAULT 0 CHECK (quran_classes_attended >= 0 AND quran_classes_attended <= 31);


