CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#3b82f6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE schedule 
ADD COLUMN IF NOT EXISTS subject_id INTEGER REFERENCES subjects(id);

INSERT INTO subjects (name, color) VALUES 
('Математика', '#3b82f6'),
('Русский язык', '#ef4444'),
('Литература', '#8b5cf6'),
('Английский язык', '#10b981'),
('История', '#f59e0b'),
('Обществознание', '#06b6d4'),
('География', '#84cc16'),
('Биология', '#22c55e'),
('Химия', '#a855f7'),
('Физика', '#6366f1'),
('Информатика', '#0ea5e9'),
('Физкультура', '#f97316'),
('ОБЖ', '#64748b'),
('Музыка', '#ec4899'),
('ИЗО', '#f43f5e')
ON CONFLICT DO NOTHING;