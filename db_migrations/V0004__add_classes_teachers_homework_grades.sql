-- Создание таблицы классов
CREATE TABLE IF NOT EXISTS t_p2953915_edu_schedule_platfor.classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Обновление таблицы пользователей для привязки к классу
ALTER TABLE t_p2953915_edu_schedule_platfor.users 
ADD COLUMN IF NOT EXISTS class_id INTEGER REFERENCES t_p2953915_edu_schedule_platfor.classes(id),
ADD COLUMN IF NOT EXISTS subject_id INTEGER REFERENCES t_p2953915_edu_schedule_platfor.subjects(id);

-- Обновление таблицы расписания для привязки к классу
ALTER TABLE t_p2953915_edu_schedule_platfor.schedule 
ADD COLUMN IF NOT EXISTS class_id INTEGER REFERENCES t_p2953915_edu_schedule_platfor.classes(id),
ADD COLUMN IF NOT EXISTS teacher_id INTEGER REFERENCES t_p2953915_edu_schedule_platfor.users(id);

-- Создание таблицы домашних заданий
CREATE TABLE IF NOT EXISTS t_p2953915_edu_schedule_platfor.homework (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES t_p2953915_edu_schedule_platfor.classes(id),
    subject_id INTEGER NOT NULL REFERENCES t_p2953915_edu_schedule_platfor.subjects(id),
    teacher_id INTEGER NOT NULL REFERENCES t_p2953915_edu_schedule_platfor.users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы оценок
CREATE TABLE IF NOT EXISTS t_p2953915_edu_schedule_platfor.grades (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES t_p2953915_edu_schedule_platfor.users(id),
    subject_id INTEGER NOT NULL REFERENCES t_p2953915_edu_schedule_platfor.subjects(id),
    teacher_id INTEGER NOT NULL REFERENCES t_p2953915_edu_schedule_platfor.users(id),
    grade INTEGER NOT NULL CHECK (grade >= 1 AND grade <= 5),
    comment TEXT,
    lesson_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_class ON t_p2953915_edu_schedule_platfor.users(class_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON t_p2953915_edu_schedule_platfor.users(role);
CREATE INDEX IF NOT EXISTS idx_schedule_class ON t_p2953915_edu_schedule_platfor.schedule(class_id);
CREATE INDEX IF NOT EXISTS idx_homework_class ON t_p2953915_edu_schedule_platfor.homework(class_id);
CREATE INDEX IF NOT EXISTS idx_homework_teacher ON t_p2953915_edu_schedule_platfor.homework(teacher_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON t_p2953915_edu_schedule_platfor.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_teacher ON t_p2953915_edu_schedule_platfor.grades(teacher_id);