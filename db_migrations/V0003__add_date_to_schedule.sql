ALTER TABLE schedule 
ADD COLUMN IF NOT EXISTS lesson_date DATE;

CREATE INDEX IF NOT EXISTS idx_schedule_date ON schedule(lesson_date);
CREATE INDEX IF NOT EXISTS idx_schedule_day_date ON schedule(day_of_week, lesson_date);