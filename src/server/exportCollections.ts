/**
 * Export utilities for Postman Collection, Thunder Client, and SQL Schema
 */

export const RAW_DATABASE_SQL = `-- Tabletop Player Sheet Manager Schema (PostgreSQL)
-- Conforms to Tugas Akhir Learning Labs: Backend Development
-- Minimal 5 related tables (6 tables created with foreign keys and check constraints)

BEGIN;

-- 1. Tabel Characters (Resource Utama)
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

-- 2. Tabel Character Stats (1:1 Relation with CASCADE)
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

-- 3. Tabel Inventory Items (1:M Relation with CASCADE)
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

-- 4. Tabel Master Spells
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

-- 5. Tabel Character Spells (M:N Pivot Table between characters & spells)
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

-- 6. Tabel Character Saves / Snapshots (1:M Backup Snapshots)
CREATE TABLE IF NOT EXISTS character_saves (
    save_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    character_id BIGINT NOT NULL
        REFERENCES characters(character_id) ON DELETE CASCADE,
    save_name VARCHAR(100) NOT NULL DEFAULT 'Manual save',
    snapshot JSONB NOT NULL,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_characters_name ON characters (LOWER(character_name));
CREATE INDEX IF NOT EXISTS idx_inventory_character_id ON inventory_items(character_id);
CREATE INDEX IF NOT EXISTS idx_character_spells_spell_id ON character_spells(spell_id);
CREATE INDEX IF NOT EXISTS idx_character_saves_character_id ON character_saves(character_id);

-- Initial Seed Data
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
`;

export function generatePostmanCollection(baseUrl: string) {
  return {
    info: {
      _postman_id: 'tabletop-player-sheet-manager-api-v1',
      name: 'Tabletop Player Sheet Manager - REST API Collection',
      description: 'Koleksi pengujian REST API lengkap Tugas Akhir Learning Labs: Backend Development (Characters, Stats, Inventory, Spells, Saves).',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: [
      {
        name: 'Characters',
        item: [
          {
            name: 'GET All Characters',
            request: {
              method: 'GET',
              header: [],
              url: {
                raw: `${baseUrl}/api/characters`,
                host: [baseUrl],
                path: ['api', 'characters'],
              },
              description: 'Mengambil daftar semua karakter',
            },
          },
          {
            name: 'GET Character by ID',
            request: {
              method: 'GET',
              header: [],
              url: {
                raw: `${baseUrl}/api/characters/1`,
                host: [baseUrl],
                path: ['api', 'characters', '1'],
              },
              description: 'Menampilkan detail lengkap karakter beserta stats dan inventory',
            },
          },
          {
            name: 'POST Create Character',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify(
                  {
                    character_name: 'Gimli Son of Gloin',
                    race: 'Dwarf',
                    character_class: 'Barbarian',
                    character_level: 3,
                    experience_points: 1200,
                    background: 'Soldier',
                    alignment: 'Chaotic Good',
                    stats: {
                      strength: 18,
                      dexterity: 12,
                      constitution: 16,
                      intelligence: 8,
                      wisdom: 12,
                      charisma: 10,
                      max_hp: 35,
                      current_hp: 35,
                      armor_class: 15,
                    },
                  },
                  null,
                  2
                ),
              },
              url: {
                raw: `${baseUrl}/api/characters`,
                host: [baseUrl],
                path: ['api', 'characters'],
              },
              description: 'Menambahkan karakter baru beserta data ability scores',
            },
          },
          {
            name: 'PUT Update Character',
            request: {
              method: 'PUT',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify(
                  {
                    character_name: 'Thorin Oakenshield II',
                    race: 'Mountain Dwarf',
                    character_class: 'Fighter',
                    stats: {
                      strength: 18,
                      armor_class: 17,
                    },
                  },
                  null,
                  2
                ),
              },
              url: {
                raw: `${baseUrl}/api/characters/1`,
                host: [baseUrl],
                path: ['api', 'characters', '1'],
              },
              description: 'Mengubah informasi karakter yang sudah tersimpan',
            },
          },
          {
            name: 'DELETE Character',
            request: {
              method: 'DELETE',
              header: [],
              url: {
                raw: `${baseUrl}/api/characters/1`,
                host: [baseUrl],
                path: ['api', 'characters', '1'],
              },
              description: 'Menghapus karakter dan seluruh relasinya (CASCADE)',
            },
          },
          {
            name: 'GET Search Characters',
            request: {
              method: 'GET',
              header: [],
              url: {
                raw: `${baseUrl}/api/characters/search?q=wizard`,
                host: [baseUrl],
                path: ['api', 'characters', 'search'],
                query: [{ key: 'q', value: 'wizard' }],
              },
              description: 'Mencari karakter berdasarkan kata kunci',
            },
          },
        ],
      },
      {
        name: 'Gameplay Actions (HP & XP)',
        item: [
          {
            name: 'PATCH Modify HP (Damage / Heal)',
            request: {
              method: 'PATCH',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify({ delta: -5 }, null, 2),
              },
              url: {
                raw: `${baseUrl}/api/characters/1/hp`,
                host: [baseUrl],
                path: ['api', 'characters', '1', 'hp'],
              },
              description: 'Mengubah HP karakter (negatif untuk damage, positif untuk heal)',
            },
          },
          {
            name: 'POST Add Experience Points (XP)',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify({ amount: 500 }, null, 2),
              },
              url: {
                raw: `${baseUrl}/api/characters/1/xp`,
                host: [baseUrl],
                path: ['api', 'characters', '1', 'xp'],
              },
              description: 'Menambah XP dan memicu cek level up otomatis',
            },
          },
          {
            name: 'GET Check Level Up Eligibility',
            request: {
              method: 'GET',
              header: [],
              url: {
                raw: `${baseUrl}/api/characters/1/levelup`,
                host: [baseUrl],
                path: ['api', 'characters', '1', 'levelup'],
              },
              description: 'Memeriksa progres dan kelayakan level up karakter',
            },
          },
          {
            name: 'POST Reset Character State',
            request: {
              method: 'POST',
              header: [],
              url: {
                raw: `${baseUrl}/api/characters/1/reset`,
                host: [baseUrl],
                path: ['api', 'characters', '1', 'reset'],
              },
              description: 'Mengembalikan karakter ke kondisi bugar penuh',
            },
          },
        ],
      },
      {
        name: 'Inventory Items',
        item: [
          {
            name: 'GET Character Inventory',
            request: {
              method: 'GET',
              header: [],
              url: {
                raw: `${baseUrl}/api/characters/1/inventory`,
                host: [baseUrl],
                path: ['api', 'characters', '1', 'inventory'],
              },
              description: 'Menampilkan seluruh item di inventory karakter',
            },
          },
          {
            name: 'POST Add Inventory Item',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify(
                  {
                    item_name: 'Potion of Greater Healing',
                    quantity: 2,
                    weight: 1.0,
                    description: 'Heals 4d4 + 4 hit points',
                  },
                  null,
                  2
                ),
              },
              url: {
                raw: `${baseUrl}/api/characters/1/inventory`,
                host: [baseUrl],
                path: ['api', 'characters', '1', 'inventory'],
              },
              description: 'Menambahkan item ke dalam inventory karakter',
            },
          },
          {
            name: 'DELETE Remove Inventory Item',
            request: {
              method: 'DELETE',
              header: [],
              url: {
                raw: `${baseUrl}/api/characters/1/inventory/1`,
                host: [baseUrl],
                path: ['api', 'characters', '1', 'inventory', '1'],
              },
              description: 'Menghapus item dari inventory karakter',
            },
          },
        ],
      },
      {
        name: 'Spells (Spellbook)',
        item: [
          {
            name: 'GET Master Spells',
            request: {
              method: 'GET',
              header: [],
              url: {
                raw: `${baseUrl}/api/spells`,
                host: [baseUrl],
                path: ['api', 'spells'],
              },
              description: 'Daftar master spell yang tersedia di library',
            },
          },
          {
            name: 'GET Character Spells',
            request: {
              method: 'GET',
              header: [],
              url: {
                raw: `${baseUrl}/api/characters/1/spells`,
                host: [baseUrl],
                path: ['api', 'characters', '1', 'spells'],
              },
              description: 'Daftar spell yang dikuasai atau dipelajari karakter',
            },
          },
          {
            name: 'POST Assign Spell to Character',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify(
                  {
                    spell_id: 1,
                    is_prepared: true,
                    notes: 'Prepared for combat',
                  },
                  null,
                  2
                ),
              },
              url: {
                raw: `${baseUrl}/api/characters/1/spells`,
                host: [baseUrl],
                path: ['api', 'characters', '1', 'spells'],
              },
              description: 'Menambahkan spell ke daftar spell karakter',
            },
          },
          {
            name: 'PATCH Toggle Spell Prepared',
            request: {
              method: 'PATCH',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify({ is_prepared: false }, null, 2),
              },
              url: {
                raw: `${baseUrl}/api/characters/1/spells/1`,
                host: [baseUrl],
                path: ['api', 'characters', '1', 'spells', '1'],
              },
              description: 'Mengubah status prepared spell karakter',
            },
          },
          {
            name: 'DELETE Remove Spell from Character',
            request: {
              method: 'DELETE',
              header: [],
              url: {
                raw: `${baseUrl}/api/characters/1/spells/1`,
                host: [baseUrl],
                path: ['api', 'characters', '1', 'spells', '1'],
              },
              description: 'Menghapus spell dari spellbook karakter',
            },
          },
        ],
      },
      {
        name: 'Backup Snapshots (Saves)',
        item: [
          {
            name: 'GET Character Saves',
            request: {
              method: 'GET',
              header: [],
              url: {
                raw: `${baseUrl}/api/characters/1/saves`,
                host: [baseUrl],
                path: ['api', 'characters', '1', 'saves'],
              },
              description: 'Menampilkan riwayat snapshot backup karakter',
            },
          },
          {
            name: 'POST Create Save Snapshot',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify({ save_name: 'Before Boss Fight Dungeon' }, null, 2),
              },
              url: {
                raw: `${baseUrl}/api/characters/1/saves`,
                host: [baseUrl],
                path: ['api', 'characters', '1', 'saves'],
              },
              description: 'Menyimpan snapshot data lengkap karakter (simpanData)',
            },
          },
          {
            name: 'POST Restore Snapshot Save',
            request: {
              method: 'POST',
              header: [],
              url: {
                raw: `${baseUrl}/api/characters/1/restore/1`,
                host: [baseUrl],
                path: ['api', 'characters', '1', 'restore', '1'],
              },
              description: 'Mengembalikan kondisi karakter dari snapshot yang tersimpan (muatData)',
            },
          },
        ],
      },
    ],
  };
}

export function generateThunderCollection(baseUrl: string) {
  return {
    client: 'Thunder Client',
    collectionName: 'Tabletop Player Sheet Manager',
    dateExported: new Date().toISOString(),
    version: '1.1',
    folders: [
      { name: 'Characters', sortNum: 10000 },
      { name: 'Gameplay Actions', sortNum: 20000 },
      { name: 'Inventory', sortNum: 30000 },
      { name: 'Spells', sortNum: 40000 },
      { name: 'Backup Saves', sortNum: 50000 },
    ],
    requests: [
      {
        name: '1. GET All Characters',
        url: `${baseUrl}/api/characters`,
        method: 'GET',
        sortNum: 10010,
        folder: 'Characters',
      },
      {
        name: '2. GET Character By ID',
        url: `${baseUrl}/api/characters/1`,
        method: 'GET',
        sortNum: 10020,
        folder: 'Characters',
      },
      {
        name: '3. POST Create Character',
        url: `${baseUrl}/api/characters`,
        method: 'POST',
        sortNum: 10030,
        folder: 'Characters',
        headers: [{ name: 'Content-Type', value: 'application/json' }],
        body: {
          type: 'json',
          raw: JSON.stringify(
            {
              character_name: 'Gimli Son of Gloin',
              race: 'Dwarf',
              character_class: 'Barbarian',
              character_level: 3,
              experience_points: 1200,
              background: 'Soldier',
              alignment: 'Chaotic Good',
              stats: {
                strength: 18,
                dexterity: 12,
                constitution: 16,
                intelligence: 8,
                wisdom: 12,
                charisma: 10,
                max_hp: 35,
                current_hp: 35,
                armor_class: 15,
              },
            },
            null,
            2
          ),
        },
      },
      {
        name: '4. PUT Update Character',
        url: `${baseUrl}/api/characters/1`,
        method: 'PUT',
        sortNum: 10040,
        folder: 'Characters',
        headers: [{ name: 'Content-Type', value: 'application/json' }],
        body: {
          type: 'json',
          raw: JSON.stringify(
            {
              character_name: 'Aric the Archmage',
              stats: {
                intelligence: 18,
                armor_class: 13,
              },
            },
            null,
            2
          ),
        },
      },
      {
        name: '5. DELETE Character',
        url: `${baseUrl}/api/characters/1`,
        method: 'DELETE',
        sortNum: 10050,
        folder: 'Characters',
      },
      {
        name: '6. PATCH Modify HP (Damage / Heal)',
        url: `${baseUrl}/api/characters/1/hp`,
        method: 'PATCH',
        sortNum: 20010,
        folder: 'Gameplay Actions',
        headers: [{ name: 'Content-Type', value: 'application/json' }],
        body: {
          type: 'json',
          raw: JSON.stringify({ delta: -5 }, null, 2),
        },
      },
      {
        name: '7. POST Add XP',
        url: `${baseUrl}/api/characters/1/xp`,
        method: 'POST',
        sortNum: 20020,
        folder: 'Gameplay Actions',
        headers: [{ name: 'Content-Type', value: 'application/json' }],
        body: {
          type: 'json',
          raw: JSON.stringify({ amount: 500 }, null, 2),
        },
      },
      {
        name: '8. GET Inventory',
        url: `${baseUrl}/api/characters/1/inventory`,
        method: 'GET',
        sortNum: 30010,
        folder: 'Inventory',
      },
      {
        name: '9. POST Add Item',
        url: `${baseUrl}/api/characters/1/inventory`,
        method: 'POST',
        sortNum: 30020,
        folder: 'Inventory',
        headers: [{ name: 'Content-Type', value: 'application/json' }],
        body: {
          type: 'json',
          raw: JSON.stringify(
            {
              item_name: 'Potion of Greater Healing',
              quantity: 2,
              weight: 1.0,
              description: 'Restores 4d4+4 hit points',
            },
            null,
            2
          ),
        },
      },
      {
        name: '10. GET Spells',
        url: `${baseUrl}/api/characters/1/spells`,
        method: 'GET',
        sortNum: 40010,
        folder: 'Spells',
      },
      {
        name: '11. POST Assign Spell',
        url: `${baseUrl}/api/characters/1/spells`,
        method: 'POST',
        sortNum: 40020,
        folder: 'Spells',
        headers: [{ name: 'Content-Type', value: 'application/json' }],
        body: {
          type: 'json',
          raw: JSON.stringify({ spell_id: 1, is_prepared: true, notes: 'Combat cantrip' }, null, 2),
        },
      },
      {
        name: '12. POST Create Save Snapshot',
        url: `${baseUrl}/api/characters/1/saves`,
        method: 'POST',
        sortNum: 50010,
        folder: 'Backup Saves',
        headers: [{ name: 'Content-Type', value: 'application/json' }],
        body: {
          type: 'json',
          raw: JSON.stringify({ save_name: 'Before Dragon Lair' }, null, 2),
        },
      },
    ],
  };
}
