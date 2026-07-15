-- ============================================
-- CampusCred Database Schema (PostgreSQL)
-- ============================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    credits INTEGER DEFAULT 5,          -- new users start with 5 free credits
    rating_avg NUMERIC(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(60)
);

-- A user can list a skill they TEACH or want to LEARN
CREATE TABLE user_skills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    type VARCHAR(10) CHECK (type IN ('teach','learn')) NOT NULL,
    proficiency VARCHAR(20) DEFAULT 'intermediate',
    UNIQUE(user_id, skill_id, type)
);

-- Weekly recurring availability slots for teaching
CREATE TABLE user_availability (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    day_of_week SMALLINT CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES users(id),
    learner_id INTEGER REFERENCES users(id),
    skill_id INTEGER REFERENCES skills(id),
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    credits_cost INTEGER DEFAULT 1,
    status VARCHAR(15) CHECK (status IN ('pending','confirmed','completed','cancelled')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    session_id INTEGER REFERENCES sessions(id),
    amount INTEGER NOT NULL,             -- positive = credit, negative = debit
    type VARCHAR(10) CHECK (type IN ('credit','debit')) NOT NULL,
    note VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id),
    reviewer_id INTEGER REFERENCES users(id),
    reviewee_id INTEGER REFERENCES users(id),
    rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX idx_user_skills_skill ON user_skills(skill_id);
CREATE INDEX idx_sessions_teacher ON sessions(teacher_id);
CREATE INDEX idx_sessions_learner ON sessions(learner_id);
CREATE INDEX idx_messages_session ON messages(session_id);
