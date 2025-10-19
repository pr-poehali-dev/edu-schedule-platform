-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'student')),
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы расписания
CREATE TABLE IF NOT EXISTS schedule (
    id SERIAL PRIMARY KEY,
    day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
    time_start TIME NOT NULL,
    time_end TIME NOT NULL,
    subject VARCHAR(255) NOT NULL,
    teacher VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставка администратора с email:22 и паролем:22
INSERT INTO users (email, password, role, full_name) 
VALUES ('22', '22', 'admin', 'Администратор')
ON CONFLICT (email) DO NOTHING;