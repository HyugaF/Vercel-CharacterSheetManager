-- ====================================================================
-- DATABASE SQL: Tabletop Player Sheet Manager
-- Tugas Akhir Learning Labs: Backend Development
-- Relational Schema: 6 Tables with Foreign Keys, Check Constraints, & Indexes
-- ====================================================================

BEGIN;

-- 1. Tabel Resource Utama: characters
CREATE TABLE IF NOT EXISTS characters (
    character_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    character_name VARCHAR(100) NOT NULL,
    race VARCHAR(50) NOT NULL,
    character_class VARCHAR(50) NOT NULL,
    character_level SMALLINT NOT NULL DEFAULT 1
        CHECK (character_level BETWEEN 1 AND 20),
    experience_points INTEGER NOT NULL DEFAULT 0
        CHECK (experience_points >= 0),
    background VARCHAR(100),
    alignment VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Relasi 1:1: character_stats
CREATE TABLE IF NOT EXISTS character_stats (
    character_id BIGINT PRIMARY KEY
        REFERENCES characters(character_id) ON DELETE CASCADE,
    strength SMALLINT NOT NULL DEFAULT 10 CHECK (strength BETWEEN 1 AND 30),
    dexterity SMALLINT NOT NULL DEFAULT 10 CHECK (dexterity BETWEEN 1 AND 30),
    constitution SMALLINT NOT NULL DEFAULT 10 CHECK (constitution BETWEEN 1 AND 30),
    intelligence SMALLINT NOT NULL DEFAULT 10 CHECK (intelligence BETWEEN 1 AND 30),
    wisdom SMALLINT NOT NULL DEFAULT 10 CHECK (wisdom BETWEEN 1 AND 30),
    charisma SMALLINT NOT NULL DEFAULT 10 CHECK (charisma BETWEEN 1 AND 30),
    max_hp INTEGER NOT NULL DEFAULT 1 CHECK (max_hp >= 1),
    current_hp INTEGER NOT NULL DEFAULT 1 CHECK (current_hp >= 0),
    armor_class SMALLINT NOT NULL DEFAULT 10 CHECK (armor_class >= 0),
    CONSTRAINT current_hp_not_above_max CHECK (current_hp <= max_hp)
);

-- 3. Tabel Relasi 1:M: inventory_items
CREATE TABLE IF NOT EXISTS inventory_items (
    item_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    character_id BIGINT NOT NULL
        REFERENCES characters(character_id) ON DELETE CASCADE,
    item_name VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    weight NUMERIC(8,2) CHECK (weight IS NULL OR weight >= 0),
    description TEXT,
    added_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Master Table: spells
CREATE TABLE IF NOT EXISTS spells (
    spell_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    spell_name VARCHAR(100) NOT NULL UNIQUE,
    spell_level SMALLINT NOT NULL DEFAULT 0
        CHECK (spell_level BETWEEN 0 AND 9),
    school VARCHAR(50),
    casting_time VARCHAR(100),
    range_text VARCHAR(100),
    duration VARCHAR(100),
    description TEXT
);

-- 5. Tabel Pivot Many-to-Many (M:N): character_spells
CREATE TABLE IF NOT EXISTS character_spells (
    character_id BIGINT NOT NULL
        REFERENCES characters(character_id) ON DELETE CASCADE,
    spell_id BIGINT NOT NULL
        REFERENCES spells(spell_id) ON DELETE CASCADE,
    is_prepared BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    added_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (character_id, spell_id)
);

-- 6. Tabel Backup / Snapshot (1:M): character_saves
CREATE TABLE IF NOT EXISTS character_saves (
    save_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    character_id BIGINT NOT NULL
        REFERENCES characters(character_id) ON DELETE CASCADE,
    save_name VARCHAR(100) NOT NULL DEFAULT 'Manual save',
    snapshot JSONB NOT NULL,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_characters_name ON characters (LOWER(character_name));
CREATE INDEX IF NOT EXISTS idx_inventory_character_id ON inventory_items(character_id);
CREATE INDEX IF NOT EXISTS idx_character_spells_spell_id ON character_spells(spell_id);
CREATE INDEX IF NOT EXISTS idx_character_saves_character_id ON character_saves(character_id);

-- Seeding Spells Library
INSERT INTO spells (spell_name, spell_level, school, casting_time, range_text, duration, description) VALUES
('Fire Bolt', 0, 'Evocation', '1 action', '120 feet', 'Instantaneous', 'A ranged attack of magical fire.'),
('Light', 0, 'Evocation', '1 action', 'Touch', '1 hour', 'Makes an object shed light.'),
('Mage Hand', 0, 'Conjuration', '1 action', '30 feet', '1 minute', 'Creates a spectral hand for simple manipulation.'),
('Cure Wounds', 1, 'Abjuration', '1 action', 'Touch', 'Instantaneous', 'Restores hit points to a creature.'),
('Magic Missile', 1, 'Evocation', '1 action', '120 feet', 'Instantaneous', 'Creates magical darts that strike targets.'),
('Shield', 1, 'Abjuration', '1 reaction', 'Self', '1 round', 'Creates a protective magical barrier.'),
('Misty Step', 2, 'Conjuration', '1 bonus action', 'Self', 'Instantaneous', 'Teleports the caster a short distance.')
ON CONFLICT (spell_name) DO NOTHING;

COMMIT;
