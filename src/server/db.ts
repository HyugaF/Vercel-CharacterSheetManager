/**
 * Relational Database Layer for Tabletop Player Sheet Manager
 * Supports:
 * - Real PostgreSQL Database (Neon, Supabase, Railway, Vercel Postgres)
 * - Automatic schema creation from DDL if tables do not exist
 * - Full relational integrity, cascade deletes, foreign keys, and transactions
 * - In-memory fallback (when ALLOW_IN_MEMORY=true, e.g. for CI/offline unit tests)
 */

import 'dotenv/config';
import pg from 'pg';
import {
  Character,
  CharacterStats,
  InventoryItem,
  Spell,
  CharacterSpell,
  CharacterSave,
  CharacterDetail,
} from '../types/index.ts';
import { hitungModifier, cekLevelUp } from '../utils/characterRules.ts';

const { Pool, types } = pg;

// Parse PostgreSQL BIGINT (OID 20) as JavaScript number
types.setTypeParser(20, (val: string) => parseInt(val, 10));
// Parse PostgreSQL NUMERIC (OID 1700) as JavaScript float
types.setTypeParser(1700, (val: string) => parseFloat(val));

// --- In-Memory Store (Used for offline testing / fallback) ---
class InMemoryDatabaseStore {
  public characters: Map<number, Character> = new Map();
  public characterStats: Map<number, CharacterStats> = new Map();
  public inventoryItems: Map<number, InventoryItem> = new Map();
  public spells: Map<number, Spell> = new Map();
  public characterSpells: Map<string, CharacterSpell> = new Map();
  public characterSaves: Map<number, CharacterSave> = new Map();

  private nextCharacterId = 1;
  private nextItemId = 1;
  private nextSpellId = 1;
  private nextSaveId = 1;

  constructor() {
    this.seedDatabase();
  }

  public seedDatabase() {
    this.characters.clear();
    this.characterStats.clear();
    this.inventoryItems.clear();
    this.spells.clear();
    this.characterSpells.clear();
    this.characterSaves.clear();

    this.nextCharacterId = 1;
    this.nextItemId = 1;
    this.nextSpellId = 1;
    this.nextSaveId = 1;

    const seedSpellsData = [
      { name: 'Fire Bolt', level: 0, school: 'Evocation', castingTime: '1 action', rangeText: '120 feet', duration: 'Instantaneous', description: 'You hurl a mote of fire at a creature or object within range. Make a ranged spell attack. On a hit, the target takes 1d10 fire damage.' },
      { name: 'Light', level: 0, school: 'Evocation', castingTime: '1 action', rangeText: 'Touch', duration: '1 hour', description: 'You touch one object that is no larger than 10 feet in any dimension. Until the spell ends, the object sheds bright light in a 20-foot radius.' },
      { name: 'Mage Hand', level: 0, school: 'Conjuration', castingTime: '1 action', rangeText: '30 feet', duration: '1 minute', description: 'A spectral, floating hand appears at a point you choose within range. The hand lasts for the duration or until you dismiss it as an action.' },
      { name: 'Cure Wounds', level: 1, school: 'Abjuration', castingTime: '1 action', rangeText: 'Touch', duration: 'Instantaneous', description: 'A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier.' },
      { name: 'Magic Missile', level: 1, school: 'Evocation', castingTime: '1 action', rangeText: '120 feet', duration: 'Instantaneous', description: 'You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range, dealing 1d4 + 1 force damage.' },
      { name: 'Shield', level: 1, school: 'Abjuration', castingTime: '1 reaction', rangeText: 'Self', duration: '1 round', description: 'An invisible barrier of magical force appears and protects you. Until the start of your next turn, you have a +5 bonus to AC.' },
      { name: 'Misty Step', level: 2, school: 'Conjuration', castingTime: '1 bonus action', rangeText: 'Self', duration: 'Instantaneous', description: 'Briefly surrounded by silvery mist, you teleport up to 30 feet to an unoccupied space that you can see.' },
    ];

    for (const s of seedSpellsData) {
      const id = this.nextSpellId++;
      this.spells.set(id, {
        spell_id: id,
        spell_name: s.name,
        spell_level: s.level,
        school: s.school,
        casting_time: s.castingTime,
        range_text: s.rangeText,
        duration: s.duration,
        description: s.description,
      });
    }

    const char1Id = this.nextCharacterId++;
    const now = new Date().toISOString();
    this.characters.set(char1Id, {
      character_id: char1Id,
      character_name: 'Aric Stormcaller',
      race: 'Human',
      character_class: 'Wizard',
      character_level: 3,
      experience_points: 1200,
      background: 'Sage',
      alignment: 'Neutral Good',
      created_at: now,
      updated_at: now,
    });
    this.characterStats.set(char1Id, {
      character_id: char1Id,
      strength: 9,
      dexterity: 14,
      constitution: 14,
      intelligence: 17,
      wisdom: 12,
      charisma: 10,
      max_hp: 20,
      current_hp: 18,
      armor_class: 12,
    });
    this.addInventoryItem(char1Id, 'Spellbook (Bound in Blue Leather)', 1, 3.0, 'Contains prepared arcane spells and rituals.');
    this.addInventoryItem(char1Id, 'Arcane Wand Focus', 1, 1.0, 'Channeling catalyst for spellcasting.');
    this.addInventoryItem(char1Id, 'Potion of Healing', 2, 0.5, 'Regains 2d4 + 2 hit points when consumed.');
    this.addInventoryItem(char1Id, 'Scholar Pack & Ink', 1, 5.0, 'Includes parchment, quill, and sealing wax.');
    this.assignSpell(char1Id, 1, true, 'Cantrip attack');
    this.assignSpell(char1Id, 3, false, 'Utility hand');
    this.assignSpell(char1Id, 5, true, 'Force darts');
    this.assignSpell(char1Id, 6, true, 'Reaction defense');
    this.assignSpell(char1Id, 7, true, 'Escape teleport');

    const char2Id = this.nextCharacterId++;
    this.characters.set(char2Id, {
      character_id: char2Id,
      character_name: 'Kaelen Swiftstrike',
      race: 'Wood Elf',
      character_class: 'Rogue',
      character_level: 2,
      experience_points: 450,
      background: 'Criminal',
      alignment: 'Chaotic Good',
      created_at: now,
      updated_at: now,
    });
    this.characterStats.set(char2Id, {
      character_id: char2Id,
      strength: 10,
      dexterity: 18,
      constitution: 13,
      intelligence: 12,
      wisdom: 14,
      charisma: 11,
      max_hp: 17,
      current_hp: 17,
      armor_class: 15,
    });
    this.addInventoryItem(char2Id, 'Fine Rapier', 1, 2.0, '1d8 piercing damage, finesse weapon.');
    this.addInventoryItem(char2Id, 'Shortbow & Quiver', 1, 3.0, 'Ranged weapon with 20 arrows.');
    this.addInventoryItem(char2Id, "Thieves' Tools", 1, 1.0, 'Picks and tension wrenches for picking locks.');
    this.addInventoryItem(char2Id, 'Studded Leather Armor', 1, 13.0, 'AC 12 + Dex modifier.');

    const char3Id = this.nextCharacterId++;
    this.characters.set(char3Id, {
      character_id: char3Id,
      character_name: 'Balgor Ironheart',
      race: 'Hill Dwarf',
      character_class: 'Cleric',
      character_level: 1,
      experience_points: 150,
      background: 'Acolyte',
      alignment: 'Lawful Good',
      created_at: now,
      updated_at: now,
    });
    this.characterStats.set(char3Id, {
      character_id: char3Id,
      strength: 15,
      dexterity: 10,
      constitution: 16,
      intelligence: 10,
      wisdom: 16,
      charisma: 12,
      max_hp: 12,
      current_hp: 12,
      armor_class: 18,
    });
    this.addInventoryItem(char3Id, 'Dwarven Warhammer', 1, 4.0, '1d8 bludgeoning (versatile 1d10).');
    this.addInventoryItem(char3Id, 'Steel Shield with Divine Crest', 1, 6.0, '+2 to Armor Class.');
    this.addInventoryItem(char3Id, 'Chain Mail Armor', 1, 55.0, 'Heavy metal armor granting AC 16.');
    this.addInventoryItem(char3Id, 'Silver Holy Symbol', 1, 1.0, 'Focus for divine magic.');
    this.assignSpell(char3Id, 2, true, 'Illumination cantrip');
    this.assignSpell(char3Id, 4, true, 'Primary healing');

    this.createSave(char1Id, 'Level 3 Milestone Save');
  }

  public getAllCharacters(): Character[] {
    return Array.from(this.characters.values()).sort((a, b) => b.character_id - a.character_id);
  }

  public getCharacterById(id: number): Character | undefined {
    return this.characters.get(id);
  }

  public getCharacterDetail(id: number): CharacterDetail | null {
    const char = this.characters.get(id);
    if (!char) return null;

    const stats = this.characterStats.get(id) ?? {
      character_id: id,
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      max_hp: 10,
      current_hp: 10,
      armor_class: 10,
    };

    const modifiers = {
      strength: hitungModifier(stats.strength),
      dexterity: hitungModifier(stats.dexterity),
      constitution: hitungModifier(stats.constitution),
      intelligence: hitungModifier(stats.intelligence),
      wisdom: hitungModifier(stats.wisdom),
      charisma: hitungModifier(stats.charisma),
    };

    const inventory = this.getInventoryByCharacter(id);
    const total_weight = inventory.reduce((sum, item) => sum + (item.weight ?? 0) * item.quantity, 0);
    const characterSpells = this.getSpellsByCharacter(id);
    const savesCount = Array.from(this.characterSaves.values()).filter((s) => s.character_id === id).length;
    const levelProgression = cekLevelUp(char.character_level, char.experience_points);

    return {
      ...char,
      stats,
      modifiers,
      inventory,
      spells: characterSpells,
      saves_count: savesCount,
      total_weight: Math.round(total_weight * 100) / 100,
      next_level_xp: levelProgression.nextLevelXp,
      level_progress: levelProgression.progressPercent,
    };
  }

  public createCharacter(
    charData: Omit<Character, 'character_id' | 'created_at' | 'updated_at'>,
    statsData?: Partial<Omit<CharacterStats, 'character_id'>>
  ): CharacterDetail {
    const id = this.nextCharacterId++;
    const now = new Date().toISOString();

    const newChar: Character = {
      character_id: id,
      character_name: charData.character_name,
      race: charData.race,
      character_class: charData.character_class,
      character_level: charData.character_level ?? 1,
      experience_points: charData.experience_points ?? 0,
      background: charData.background || 'Adventurer',
      alignment: charData.alignment || 'True Neutral',
      created_at: now,
      updated_at: now,
    };
    this.characters.set(id, newChar);

    const defaultMaxHp = Math.max(1, 10 + hitungModifier(statsData?.constitution ?? 10));
    const newStats: CharacterStats = {
      character_id: id,
      strength: statsData?.strength ?? 10,
      dexterity: statsData?.dexterity ?? 10,
      constitution: statsData?.constitution ?? 10,
      intelligence: statsData?.intelligence ?? 10,
      wisdom: statsData?.wisdom ?? 10,
      charisma: statsData?.charisma ?? 10,
      max_hp: statsData?.max_hp ?? defaultMaxHp,
      current_hp: Math.min(statsData?.current_hp ?? defaultMaxHp, statsData?.max_hp ?? defaultMaxHp),
      armor_class: statsData?.armor_class ?? (10 + hitungModifier(statsData?.dexterity ?? 10)),
    };
    this.characterStats.set(id, newStats);

    return this.getCharacterDetail(id)!;
  }

  public updateCharacter(
    id: number,
    charData: Partial<Omit<Character, 'character_id' | 'created_at'>>,
    statsData?: Partial<Omit<CharacterStats, 'character_id'>>
  ): CharacterDetail | null {
    const existing = this.characters.get(id);
    if (!existing) return null;

    const updatedChar: Character = {
      ...existing,
      ...charData,
      character_id: id,
      updated_at: new Date().toISOString(),
    };
    this.characters.set(id, updatedChar);

    if (statsData) {
      const existingStats = this.characterStats.get(id) ?? {
        character_id: id,
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        max_hp: 10,
        current_hp: 10,
        armor_class: 10,
      };
      const mergedStats: CharacterStats = {
        ...existingStats,
        ...statsData,
        character_id: id,
      };
      if (mergedStats.current_hp > mergedStats.max_hp) {
        mergedStats.current_hp = mergedStats.max_hp;
      }
      this.characterStats.set(id, mergedStats);
    }

    return this.getCharacterDetail(id);
  }

  public deleteCharacter(id: number): boolean {
    if (!this.characters.has(id)) return false;
    this.characters.delete(id);
    this.characterStats.delete(id);
    for (const [itemId, item] of this.inventoryItems.entries()) {
      if (item.character_id === id) this.inventoryItems.delete(itemId);
    }
    for (const [key, cs] of this.characterSpells.entries()) {
      if (cs.character_id === id) this.characterSpells.delete(key);
    }
    for (const [saveId, save] of this.characterSaves.entries()) {
      if (save.character_id === id) this.characterSaves.delete(saveId);
    }
    return true;
  }

  public searchCharacters(query: string): Character[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.getAllCharacters();
    return Array.from(this.characters.values()).filter((c) => {
      return (
        c.character_id.toString() === q ||
        c.character_name.toLowerCase().includes(q) ||
        c.race.toLowerCase().includes(q) ||
        c.character_class.toLowerCase().includes(q) ||
        (c.background && c.background.toLowerCase().includes(q)) ||
        (c.alignment && c.alignment.toLowerCase().includes(q))
      );
    });
  }

  public getInventoryByCharacter(characterId: number): InventoryItem[] {
    return Array.from(this.inventoryItems.values())
      .filter((item) => item.character_id === characterId)
      .sort((a, b) => a.item_id - b.item_id);
  }

  public addInventoryItem(characterId: number, itemName: string, quantity = 1, weight = 0, description = ''): InventoryItem | null {
    if (!this.characters.has(characterId)) return null;
    const itemId = this.nextItemId++;
    const item: InventoryItem = {
      item_id: itemId,
      character_id: characterId,
      item_name: itemName,
      quantity: Math.max(1, quantity),
      weight: weight !== null && weight >= 0 ? weight : null,
      description,
      added_at: new Date().toISOString(),
    };
    this.inventoryItems.set(itemId, item);
    return item;
  }

  public updateInventoryItem(itemId: number, update: Partial<Omit<InventoryItem, 'item_id' | 'character_id' | 'added_at'>>): InventoryItem | null {
    const existing = this.inventoryItems.get(itemId);
    if (!existing) return null;
    const updated: InventoryItem = {
      ...existing,
      ...update,
      item_id: itemId,
      quantity: update.quantity !== undefined ? Math.max(1, update.quantity) : existing.quantity,
    };
    this.inventoryItems.set(itemId, updated);
    return updated;
  }

  public deleteInventoryItem(characterId: number, itemId: number): boolean {
    const item = this.inventoryItems.get(itemId);
    if (!item || item.character_id !== characterId) return false;
    return this.inventoryItems.delete(itemId);
  }

  public getAllSpells(): Spell[] {
    return Array.from(this.spells.values()).sort((a, b) => a.spell_level - b.spell_level || a.spell_name.localeCompare(b.spell_name));
  }

  public getSpellById(id: number): Spell | undefined {
    return this.spells.get(id);
  }

  public createSpell(spellData: Omit<Spell, 'spell_id'>): Spell {
    const id = this.nextSpellId++;
    const newSpell: Spell = { spell_id: id, ...spellData };
    this.spells.set(id, newSpell);
    return newSpell;
  }

  public getSpellsByCharacter(characterId: number): (CharacterSpell & { spell: Spell })[] {
    const result: (CharacterSpell & { spell: Spell })[] = [];
    for (const cs of this.characterSpells.values()) {
      if (cs.character_id === characterId) {
        const spell = this.spells.get(cs.spell_id);
        if (spell) result.push({ ...cs, spell });
      }
    }
    return result.sort((a, b) => a.spell.spell_level - b.spell.spell_level || a.spell.spell_name.localeCompare(b.spell.spell_name));
  }

  public assignSpell(characterId: number, spellId: number, isPrepared = false, notes = ''): (CharacterSpell & { spell: Spell }) | null {
    if (!this.characters.has(characterId)) return null;
    const spell = this.spells.get(spellId);
    if (!spell) return null;
    const key = `${characterId}:${spellId}`;
    const cs: CharacterSpell = {
      character_id: characterId,
      spell_id: spellId,
      is_prepared: isPrepared,
      notes,
      added_at: new Date().toISOString(),
    };
    this.characterSpells.set(key, cs);
    return { ...cs, spell };
  }

  public updateCharacterSpell(characterId: number, spellId: number, isPrepared?: boolean, notes?: string): (CharacterSpell & { spell: Spell }) | null {
    const key = `${characterId}:${spellId}`;
    const existing = this.characterSpells.get(key);
    if (!existing) return null;
    if (isPrepared !== undefined) existing.is_prepared = isPrepared;
    if (notes !== undefined) existing.notes = notes;
    const spell = this.spells.get(spellId)!;
    return { ...existing, spell };
  }

  public removeCharacterSpell(characterId: number, spellId: number): boolean {
    const key = `${characterId}:${spellId}`;
    return this.characterSpells.delete(key);
  }

  public getSavesByCharacter(characterId: number): CharacterSave[] {
    return Array.from(this.characterSaves.values())
      .filter((s) => s.character_id === characterId)
      .sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime());
  }

  public createSave(characterId: number, saveName = 'Manual save'): CharacterSave | null {
    const char = this.characters.get(characterId);
    if (!char) return null;
    const stats = this.characterStats.get(characterId) ?? {
      character_id: characterId,
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      max_hp: 10,
      current_hp: 10,
      armor_class: 10,
    };
    const inventory = this.getInventoryByCharacter(characterId);
    const characterSpells = Array.from(this.characterSpells.values()).filter((cs) => cs.character_id === characterId);

    const saveId = this.nextSaveId++;
    const save: CharacterSave = {
      save_id: saveId,
      character_id: characterId,
      save_name: saveName.trim() || `Save #${saveId}`,
      snapshot: {
        character: { ...char },
        stats: { ...stats },
        inventory: inventory.map((i) => ({ ...i })),
        spells: characterSpells.map((s) => ({ ...s })),
        timestamp: new Date().toISOString(),
      },
      saved_at: new Date().toISOString(),
    };
    this.characterSaves.set(saveId, save);
    return save;
  }

  public restoreSave(characterId: number, saveId: number): CharacterDetail | null {
    const save = this.characterSaves.get(saveId);
    if (!save || save.character_id !== characterId) return null;
    const snap = save.snapshot;
    this.characters.set(characterId, { ...snap.character, character_id: characterId, updated_at: new Date().toISOString() });
    this.characterStats.set(characterId, { ...snap.stats, character_id: characterId });
    for (const [id, item] of this.inventoryItems.entries()) {
      if (item.character_id === characterId) this.inventoryItems.delete(id);
    }
    for (const item of snap.inventory) {
      const id = this.nextItemId++;
      this.inventoryItems.set(id, { ...item, item_id: id, character_id: characterId });
    }
    for (const [key, cs] of this.characterSpells.entries()) {
      if (cs.character_id === characterId) this.characterSpells.delete(key);
    }
    for (const cs of snap.spells) {
      const key = `${characterId}:${cs.spell_id}`;
      this.characterSpells.set(key, { ...cs, character_id: characterId });
    }
    return this.getCharacterDetail(characterId);
  }

  public deleteSave(characterId: number, saveId: number): boolean {
    const save = this.characterSaves.get(saveId);
    if (!save || save.character_id !== characterId) return false;
    return this.characterSaves.delete(saveId);
  }
}

// --- Helper Functions for Database Connection Strings & SSL ---
export function cleanConnectionString(rawUrl: string): { url: string; error?: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { url: '', error: 'Connection string kosong atau tidak valid' };
  }

  let url = rawUrl.trim();

  // Strip wrapping double or single quotes if copied from .env or shell
  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1).trim();
  }

  // Detect if user pasted Supabase Project REST URL instead of Postgres Connection String
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return {
      url,
      error:
        'URL yang Anda masukkan adalah REST API URL (' +
        url.slice(0, 32) +
        '...), bukan PostgreSQL URI. Di Supabase: Buka Project Settings > Database > Connection string (URI) dengan format: postgresql://postgres.[project-ref]:[password]@...',
    };
  }

  // Validate protocol
  if (!url.startsWith('postgres://') && !url.startsWith('postgresql://')) {
    return {
      url,
      error:
        'Format connection string tidak valid. Harus diawali dengan postgres:// atau postgresql:// (Contoh: postgresql://postgres.[ref]:[password]@aws-0-...pooler.supabase.com:6543/postgres)',
    };
  }

  return { url };
}

export function isSslRequired(connectionString: string): boolean {
  if (connectionString.includes('sslmode=disable') || process.env.DATABASE_SSL === 'false') {
    return false;
  }
  if (connectionString.includes('sslmode=require') || process.env.DATABASE_SSL === 'true') {
    return true;
  }
  try {
    const temp = connectionString.replace(/^[a-zA-Z0-9]+:\/\//, 'http://');
    const parsed = new URL(temp);
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
      return false;
    }
    // Remote cloud host (Supabase pooler/direct, Neon, Railway, Render, RDS, etc.)
    return true;
  } catch (_) {
    return (
      connectionString.includes('supabase') ||
      connectionString.includes('pooler') ||
      connectionString.includes('neon') ||
      connectionString.includes('railway') ||
      connectionString.includes('render')
    );
  }
}

export function getDatabaseUrlFromEnv(): { url?: string; sourceKey?: string; rawValue?: string } {
  const possibleKeys = [
    'DATABASE_URL',
    'POSTGRES_URL',
    'POSTGRES_PRISMA_URL',
    'POSTGRES_URL_NON_POOLING',
    'SUPABASE_DATABASE_URL',
    'SUPABASE_DB_URL',
    'VITE_DATABASE_URL',
  ];

  for (const key of possibleKeys) {
    const raw = process.env[key];
    if (raw && typeof raw === 'string' && raw.trim().length > 0) {
      const cleaned = cleanConnectionString(raw);
      if (!cleaned.error && cleaned.url) {
        return { url: cleaned.url, sourceKey: key, rawValue: raw };
      }
    }
  }

  return {};
}

// --- PostgreSQL Database Store (Real External Database) ---
class PostgresDatabaseStore {
  public pool: pg.Pool;

  constructor(connectionString: string) {
    const cleaned = cleanConnectionString(connectionString);
    const finalUrl = cleaned.url || connectionString;
    const requiresSsl = isSslRequired(finalUrl);

    this.pool = new Pool({
      connectionString: finalUrl,
      ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 20000,
      max: process.env.VERCEL ? 3 : 10,
    });

    // Gracefully handle idle client disconnects (prevents unhandled process termination in serverless)
    this.pool.on('error', (err) => {
      console.warn('[PostgreSQL Pool Background Warning]:', err.message);
    });
  }

  public async initSchemaAndSeed() {
    // 1. Create 6 tables conforming to Tugas Akhir specs
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS characters (
          character_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
          character_name VARCHAR(100) NOT NULL,
          race VARCHAR(50) NOT NULL,
          character_class VARCHAR(50) NOT NULL,
          character_level SMALLINT NOT NULL DEFAULT 1 CHECK (character_level BETWEEN 1 AND 20),
          experience_points INTEGER NOT NULL DEFAULT 0 CHECK (experience_points >= 0),
          background VARCHAR(100),
          alignment VARCHAR(50),
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS character_stats (
          character_id BIGINT PRIMARY KEY REFERENCES characters(character_id) ON DELETE CASCADE,
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

      CREATE TABLE IF NOT EXISTS inventory_items (
          item_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
          character_id BIGINT NOT NULL REFERENCES characters(character_id) ON DELETE CASCADE,
          item_name VARCHAR(100) NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
          weight NUMERIC(8,2) CHECK (weight IS NULL OR weight >= 0),
          description TEXT,
          added_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS spells (
          spell_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
          spell_name VARCHAR(100) NOT NULL UNIQUE,
          spell_level SMALLINT NOT NULL DEFAULT 0 CHECK (spell_level BETWEEN 0 AND 9),
          school VARCHAR(50),
          casting_time VARCHAR(100),
          range_text VARCHAR(100),
          duration VARCHAR(100),
          description TEXT
      );

      CREATE TABLE IF NOT EXISTS character_spells (
          character_id BIGINT NOT NULL REFERENCES characters(character_id) ON DELETE CASCADE,
          spell_id BIGINT NOT NULL REFERENCES spells(spell_id) ON DELETE CASCADE,
          is_prepared BOOLEAN NOT NULL DEFAULT FALSE,
          notes TEXT,
          added_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (character_id, spell_id)
      );

      CREATE TABLE IF NOT EXISTS character_saves (
          save_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
          character_id BIGINT NOT NULL REFERENCES characters(character_id) ON DELETE CASCADE,
          save_name VARCHAR(100) NOT NULL DEFAULT 'Manual save',
          snapshot JSONB NOT NULL,
          saved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_characters_name ON characters (LOWER(character_name));
      CREATE INDEX IF NOT EXISTS idx_inventory_character_id ON inventory_items(character_id);
      CREATE INDEX IF NOT EXISTS idx_character_spells_spell_id ON character_spells(spell_id);
      CREATE INDEX IF NOT EXISTS idx_character_saves_character_id ON character_saves(character_id);
    `);

    // 2. Seed Spells Library if empty
    const spellCountRes = await this.pool.query('SELECT COUNT(*) AS count FROM spells');
    if (parseInt(spellCountRes.rows[0].count, 10) === 0) {
      await this.pool.query(`
        INSERT INTO spells (spell_name, spell_level, school, casting_time, range_text, duration, description) VALUES
        ('Fire Bolt', 0, 'Evocation', '1 action', '120 feet', 'Instantaneous', 'You hurl a mote of fire at a creature or object within range. Make a ranged spell attack. On a hit, the target takes 1d10 fire damage.'),
        ('Light', 0, 'Evocation', '1 action', 'Touch', '1 hour', 'You touch one object that is no larger than 10 feet in any dimension. Until the spell ends, the object sheds bright light in a 20-foot radius.'),
        ('Mage Hand', 0, 'Conjuration', '1 action', '30 feet', '1 minute', 'A spectral, floating hand appears at a point you choose within range. The hand lasts for the duration or until you dismiss it as an action.'),
        ('Cure Wounds', 1, 'Abjuration', '1 action', 'Touch', 'Instantaneous', 'A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier.'),
        ('Magic Missile', 1, 'Evocation', '1 action', '120 feet', 'Instantaneous', 'You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range, dealing 1d4 + 1 force damage.'),
        ('Shield', 1, 'Abjuration', '1 reaction', 'Self', '1 round', 'An invisible barrier of magical force appears and protects you. Until the start of your next turn, you have a +5 bonus to AC.'),
        ('Misty Step', 2, 'Conjuration', '1 bonus action', 'Self', 'Instantaneous', 'Briefly surrounded by silvery mist, you teleport up to 30 feet to an unoccupied space that you can see.')
        ON CONFLICT (spell_name) DO NOTHING;
      `);
    }

    // 3. Seed Demo Characters if characters table is empty
    const charCountRes = await this.pool.query('SELECT COUNT(*) AS count FROM characters');
    if (parseInt(charCountRes.rows[0].count, 10) === 0) {
      // Seed Aric Stormcaller
      const c1 = await this.pool.query(`
        INSERT INTO characters (character_name, race, character_class, character_level, experience_points, background, alignment)
        VALUES ('Aric Stormcaller', 'Human', 'Wizard', 3, 1200, 'Sage', 'Neutral Good')
        RETURNING character_id;
      `);
      const char1Id = c1.rows[0].character_id;
      await this.pool.query(`
        INSERT INTO character_stats (character_id, strength, dexterity, constitution, intelligence, wisdom, charisma, max_hp, current_hp, armor_class)
        VALUES ($1, 9, 14, 14, 17, 12, 10, 20, 18, 12);
      `, [char1Id]);
      await this.pool.query(`
        INSERT INTO inventory_items (character_id, item_name, quantity, weight, description) VALUES
        ($1, 'Spellbook (Bound in Blue Leather)', 1, 3.0, 'Contains prepared arcane spells and rituals.'),
        ($1, 'Arcane Wand Focus', 1, 1.0, 'Channeling catalyst for spellcasting.'),
        ($1, 'Potion of Healing', 2, 0.5, 'Regains 2d4 + 2 hit points when consumed.'),
        ($1, 'Scholar Pack & Ink', 1, 5.0, 'Includes parchment, quill, and sealing wax.');
      `, [char1Id]);

      // Seed Kaelen Swiftstrike
      const c2 = await this.pool.query(`
        INSERT INTO characters (character_name, race, character_class, character_level, experience_points, background, alignment)
        VALUES ('Kaelen Swiftstrike', 'Wood Elf', 'Rogue', 2, 450, 'Criminal', 'Chaotic Good')
        RETURNING character_id;
      `);
      const char2Id = c2.rows[0].character_id;
      await this.pool.query(`
        INSERT INTO character_stats (character_id, strength, dexterity, constitution, intelligence, wisdom, charisma, max_hp, current_hp, armor_class)
        VALUES ($1, 10, 18, 13, 12, 14, 11, 17, 17, 15);
      `, [char2Id]);
      await this.pool.query(`
        INSERT INTO inventory_items (character_id, item_name, quantity, weight, description) VALUES
        ($1, 'Fine Rapier', 1, 2.0, '1d8 piercing damage, finesse weapon.'),
        ($1, 'Shortbow & Quiver', 1, 3.0, 'Ranged weapon with 20 arrows.'),
        ($1, 'Thieves'' Tools', 1, 1.0, 'Picks and tension wrenches for picking locks.'),
        ($1, 'Studded Leather Armor', 1, 13.0, 'AC 12 + Dex modifier.');
      `, [char2Id]);

      // Seed Balgor Ironheart
      const c3 = await this.pool.query(`
        INSERT INTO characters (character_name, race, character_class, character_level, experience_points, background, alignment)
        VALUES ('Balgor Ironheart', 'Hill Dwarf', 'Cleric', 1, 150, 'Acolyte', 'Lawful Good')
        RETURNING character_id;
      `);
      const char3Id = c3.rows[0].character_id;
      await this.pool.query(`
        INSERT INTO character_stats (character_id, strength, dexterity, constitution, intelligence, wisdom, charisma, max_hp, current_hp, armor_class)
        VALUES ($1, 15, 10, 16, 10, 16, 12, 12, 12, 18);
      `, [char3Id]);
      await this.pool.query(`
        INSERT INTO inventory_items (character_id, item_name, quantity, weight, description) VALUES
        ($1, 'Dwarven Warhammer', 1, 4.0, '1d8 bludgeoning (versatile 1d10).'),
        ($1, 'Steel Shield with Divine Crest', 1, 6.0, '+2 to Armor Class.'),
        ($1, 'Chain Mail Armor', 1, 55.0, 'Heavy metal armor granting AC 16.'),
        ($1, 'Silver Holy Symbol', 1, 1.0, 'Focus for divine magic.');
      `, [char3Id]);

      // Assign spells
      const spellsRes = await this.pool.query('SELECT spell_id, spell_name FROM spells');
      const sMap = new Map<string, number>();
      for (const r of spellsRes.rows) sMap.set(r.spell_name, r.spell_id);

      const aSpells = ['Fire Bolt', 'Mage Hand', 'Magic Missile', 'Shield', 'Misty Step'];
      for (const name of aSpells) {
        const sid = sMap.get(name);
        if (sid) {
          await this.pool.query(
            'INSERT INTO character_spells (character_id, spell_id, is_prepared, notes) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
            [char1Id, sid, true, 'Prepared spell']
          );
        }
      }

      const bSpells = ['Light', 'Cure Wounds'];
      for (const name of bSpells) {
        const sid = sMap.get(name);
        if (sid) {
          await this.pool.query(
            'INSERT INTO character_spells (character_id, spell_id, is_prepared, notes) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
            [char3Id, sid, true, 'Divine spell']
          );
        }
      }
    }
  }

  public async getAllCharacters(): Promise<Character[]> {
    const res = await this.pool.query('SELECT * FROM characters ORDER BY character_id DESC');
    return res.rows;
  }

  public async getCharacterById(id: number): Promise<Character | undefined> {
    const res = await this.pool.query('SELECT * FROM characters WHERE character_id = $1', [id]);
    return res.rows[0];
  }

  public async getCharacterDetail(id: number): Promise<CharacterDetail | null> {
    const charRes = await this.pool.query('SELECT * FROM characters WHERE character_id = $1', [id]);
    if (charRes.rows.length === 0) return null;
    const char: Character = charRes.rows[0];

    const statsRes = await this.pool.query('SELECT * FROM character_stats WHERE character_id = $1', [id]);
    const stats: CharacterStats = statsRes.rows[0] ?? {
      character_id: id,
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      max_hp: 10,
      current_hp: 10,
      armor_class: 10,
    };

    const modifiers = {
      strength: hitungModifier(stats.strength),
      dexterity: hitungModifier(stats.dexterity),
      constitution: hitungModifier(stats.constitution),
      intelligence: hitungModifier(stats.intelligence),
      wisdom: hitungModifier(stats.wisdom),
      charisma: hitungModifier(stats.charisma),
    };

    const invRes = await this.pool.query('SELECT * FROM inventory_items WHERE character_id = $1 ORDER BY item_id ASC', [id]);
    const inventory: InventoryItem[] = invRes.rows;
    const total_weight = inventory.reduce((sum, item) => sum + (item.weight ?? 0) * item.quantity, 0);

    const spellsRes = await this.pool.query(`
      SELECT 
        cs.character_id, cs.spell_id, cs.is_prepared, cs.notes, cs.added_at,
        s.spell_name, s.spell_level, s.school, s.casting_time, s.range_text, s.duration, s.description
      FROM character_spells cs
      JOIN spells s ON cs.spell_id = s.spell_id
      WHERE cs.character_id = $1
      ORDER BY s.spell_level ASC, s.spell_name ASC;
    `, [id]);
    const characterSpells = spellsRes.rows.map((row: any) => ({
      character_id: row.character_id,
      spell_id: row.spell_id,
      is_prepared: row.is_prepared,
      notes: row.notes,
      added_at: row.added_at,
      spell: {
        spell_id: row.spell_id,
        spell_name: row.spell_name,
        spell_level: row.spell_level,
        school: row.school,
        casting_time: row.casting_time,
        range_text: row.range_text,
        duration: row.duration,
        description: row.description,
      },
    }));

    const countRes = await this.pool.query('SELECT COUNT(*) AS count FROM character_saves WHERE character_id = $1', [id]);
    const savesCount = parseInt(countRes.rows[0].count, 10);
    const levelProgression = cekLevelUp(char.character_level, char.experience_points);

    return {
      ...char,
      stats,
      modifiers,
      inventory,
      spells: characterSpells,
      saves_count: savesCount,
      total_weight: Math.round(total_weight * 100) / 100,
      next_level_xp: levelProgression.nextLevelXp,
      level_progress: levelProgression.progressPercent,
    };
  }

  public async createCharacter(
    charData: Omit<Character, 'character_id' | 'created_at' | 'updated_at'>,
    statsData?: Partial<Omit<CharacterStats, 'character_id'>>
  ): Promise<CharacterDetail> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const charRes = await client.query(`
        INSERT INTO characters (
          character_name, race, character_class, character_level, experience_points, background, alignment, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *;
      `, [
        charData.character_name,
        charData.race,
        charData.character_class,
        charData.character_level ?? 1,
        charData.experience_points ?? 0,
        charData.background || 'Adventurer',
        charData.alignment || 'True Neutral',
      ]);

      const newChar = charRes.rows[0];
      const charId = newChar.character_id;

      const defaultMaxHp = Math.max(1, 10 + hitungModifier(statsData?.constitution ?? 10));
      const strength = statsData?.strength ?? 10;
      const dexterity = statsData?.dexterity ?? 10;
      const constitution = statsData?.constitution ?? 10;
      const intelligence = statsData?.intelligence ?? 10;
      const wisdom = statsData?.wisdom ?? 10;
      const charisma = statsData?.charisma ?? 10;
      const max_hp = statsData?.max_hp ?? defaultMaxHp;
      const current_hp = Math.min(statsData?.current_hp ?? defaultMaxHp, max_hp);
      const armor_class = statsData?.armor_class ?? (10 + hitungModifier(dexterity));

      await client.query(`
        INSERT INTO character_stats (
          character_id, strength, dexterity, constitution, intelligence, wisdom, charisma, max_hp, current_hp, armor_class
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
      `, [charId, strength, dexterity, constitution, intelligence, wisdom, charisma, max_hp, current_hp, armor_class]);

      await client.query('COMMIT');
      return (await this.getCharacterDetail(charId))!;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public async updateCharacter(
    id: number,
    charData: Partial<Omit<Character, 'character_id' | 'created_at'>>,
    statsData?: Partial<Omit<CharacterStats, 'character_id'>>
  ): Promise<CharacterDetail | null> {
    const existingRes = await this.pool.query('SELECT * FROM characters WHERE character_id = $1', [id]);
    if (existingRes.rows.length === 0) return null;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const updateFields: string[] = [];
      const values: any[] = [id];
      let idx = 2;

      if (charData.character_name !== undefined) {
        updateFields.push(`character_name = $${idx++}`);
        values.push(charData.character_name);
      }
      if (charData.race !== undefined) {
        updateFields.push(`race = $${idx++}`);
        values.push(charData.race);
      }
      if (charData.character_class !== undefined) {
        updateFields.push(`character_class = $${idx++}`);
        values.push(charData.character_class);
      }
      if (charData.character_level !== undefined) {
        updateFields.push(`character_level = $${idx++}`);
        values.push(charData.character_level);
      }
      if (charData.experience_points !== undefined) {
        updateFields.push(`experience_points = $${idx++}`);
        values.push(charData.experience_points);
      }
      if (charData.background !== undefined) {
        updateFields.push(`background = $${idx++}`);
        values.push(charData.background);
      }
      if (charData.alignment !== undefined) {
        updateFields.push(`alignment = $${idx++}`);
        values.push(charData.alignment);
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = NOW()');
        await client.query(`UPDATE characters SET ${updateFields.join(', ')} WHERE character_id = $1`, values);
      }

      if (statsData) {
        const statsFields: string[] = [];
        const statsValues: any[] = [id];
        let sIdx = 2;

        const statKeys = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma', 'max_hp', 'current_hp', 'armor_class'] as const;
        for (const key of statKeys) {
          if (statsData[key] !== undefined) {
            statsFields.push(`${key} = $${sIdx++}`);
            statsValues.push(statsData[key]);
          }
        }

        if (statsFields.length > 0) {
          await client.query(`UPDATE character_stats SET ${statsFields.join(', ')} WHERE character_id = $1`, statsValues);
          await client.query(`UPDATE character_stats SET current_hp = LEAST(current_hp, max_hp) WHERE character_id = $1`, [id]);
        }
      }

      await client.query('COMMIT');
      return await this.getCharacterDetail(id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public async deleteCharacter(id: number): Promise<boolean> {
    const res = await this.pool.query('DELETE FROM characters WHERE character_id = $1 RETURNING character_id', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  public async searchCharacters(query: string): Promise<Character[]> {
    const q = query.trim().toLowerCase();
    if (!q) {
      const res = await this.pool.query('SELECT * FROM characters ORDER BY character_id DESC');
      return res.rows;
    }
    const isNum = !isNaN(Number(q));
    if (isNum) {
      const res = await this.pool.query(`
        SELECT * FROM characters 
        WHERE character_id = $1 
           OR LOWER(character_name) LIKE $2 
           OR LOWER(race) LIKE $2 
           OR LOWER(character_class) LIKE $2
        ORDER BY character_id DESC;
      `, [Number(q), `%${q}%`]);
      return res.rows;
    }
    const res = await this.pool.query(`
      SELECT * FROM characters 
      WHERE LOWER(character_name) LIKE $1 
         OR LOWER(race) LIKE $1 
         OR LOWER(character_class) LIKE $1
         OR LOWER(background) LIKE $1
         OR LOWER(alignment) LIKE $1
      ORDER BY character_id DESC;
    `, [`%${q}%`]);
    return res.rows;
  }

  public async getInventoryByCharacter(characterId: number): Promise<InventoryItem[]> {
    const res = await this.pool.query('SELECT * FROM inventory_items WHERE character_id = $1 ORDER BY item_id ASC', [characterId]);
    return res.rows;
  }

  public async addInventoryItem(characterId: number, itemName: string, quantity = 1, weight = 0, description = ''): Promise<InventoryItem | null> {
    const char = await this.getCharacterById(characterId);
    if (!char) return null;
    const res = await this.pool.query(`
      INSERT INTO inventory_items (character_id, item_name, quantity, weight, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `, [characterId, itemName, Math.max(1, quantity), weight >= 0 ? weight : null, description]);
    return res.rows[0];
  }

  public async updateInventoryItem(itemId: number, update: Partial<Omit<InventoryItem, 'item_id' | 'character_id' | 'added_at'>>): Promise<InventoryItem | null> {
    const fields: string[] = [];
    const values: any[] = [itemId];
    let idx = 2;
    if (update.item_name !== undefined) {
      fields.push(`item_name = $${idx++}`);
      values.push(update.item_name);
    }
    if (update.quantity !== undefined) {
      fields.push(`quantity = $${idx++}`);
      values.push(Math.max(1, update.quantity));
    }
    if (update.weight !== undefined) {
      fields.push(`weight = $${idx++}`);
      values.push(update.weight);
    }
    if (update.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(update.description);
    }
    if (fields.length === 0) {
      const res = await this.pool.query('SELECT * FROM inventory_items WHERE item_id = $1', [itemId]);
      return res.rows[0] || null;
    }
    const res = await this.pool.query(`UPDATE inventory_items SET ${fields.join(', ')} WHERE item_id = $1 RETURNING *`, values);
    return res.rows[0] || null;
  }

  public async deleteInventoryItem(characterId: number, itemId: number): Promise<boolean> {
    const res = await this.pool.query('DELETE FROM inventory_items WHERE character_id = $1 AND item_id = $2 RETURNING item_id', [characterId, itemId]);
    return (res.rowCount ?? 0) > 0;
  }

  public async getAllSpells(): Promise<Spell[]> {
    const res = await this.pool.query('SELECT * FROM spells ORDER BY spell_level ASC, spell_name ASC');
    return res.rows;
  }

  public async getSpellById(id: number): Promise<Spell | undefined> {
    const res = await this.pool.query('SELECT * FROM spells WHERE spell_id = $1', [id]);
    return res.rows[0];
  }

  public async createSpell(spellData: Omit<Spell, 'spell_id'>): Promise<Spell> {
    const res = await this.pool.query(`
      INSERT INTO spells (spell_name, spell_level, school, casting_time, range_text, duration, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `, [
      spellData.spell_name,
      spellData.spell_level ?? 0,
      spellData.school || 'Evocation',
      spellData.casting_time || '1 action',
      spellData.range_text || '30 feet',
      spellData.duration || 'Instantaneous',
      spellData.description || '',
    ]);
    return res.rows[0];
  }

  public async getSpellsByCharacter(characterId: number): Promise<(CharacterSpell & { spell: Spell })[]> {
    const res = await this.pool.query(`
      SELECT 
        cs.character_id, cs.spell_id, cs.is_prepared, cs.notes, cs.added_at,
        s.spell_name, s.spell_level, s.school, s.casting_time, s.range_text, s.duration, s.description
      FROM character_spells cs
      JOIN spells s ON cs.spell_id = s.spell_id
      WHERE cs.character_id = $1
      ORDER BY s.spell_level ASC, s.spell_name ASC;
    `, [characterId]);
    return res.rows.map((row: any) => ({
      character_id: row.character_id,
      spell_id: row.spell_id,
      is_prepared: row.is_prepared,
      notes: row.notes,
      added_at: row.added_at,
      spell: {
        spell_id: row.spell_id,
        spell_name: row.spell_name,
        spell_level: row.spell_level,
        school: row.school,
        casting_time: row.casting_time,
        range_text: row.range_text,
        duration: row.duration,
        description: row.description,
      },
    }));
  }

  public async assignSpell(characterId: number, spellId: number, isPrepared = false, notes = ''): Promise<(CharacterSpell & { spell: Spell }) | null> {
    const char = await this.getCharacterById(characterId);
    const spell = await this.getSpellById(spellId);
    if (!char || !spell) return null;
    const res = await this.pool.query(`
      INSERT INTO character_spells (character_id, spell_id, is_prepared, notes)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (character_id, spell_id) DO UPDATE SET is_prepared = EXCLUDED.is_prepared, notes = EXCLUDED.notes
      RETURNING *;
    `, [characterId, spellId, isPrepared, notes]);
    return { ...res.rows[0], spell };
  }

  public async updateCharacterSpell(characterId: number, spellId: number, isPrepared?: boolean, notes?: string): Promise<(CharacterSpell & { spell: Spell }) | null> {
    const spell = await this.getSpellById(spellId);
    if (!spell) return null;
    const fields: string[] = [];
    const values: any[] = [characterId, spellId];
    let idx = 3;
    if (isPrepared !== undefined) {
      fields.push(`is_prepared = $${idx++}`);
      values.push(isPrepared);
    }
    if (notes !== undefined) {
      fields.push(`notes = $${idx++}`);
      values.push(notes);
    }
    if (fields.length === 0) {
      const res = await this.pool.query('SELECT * FROM character_spells WHERE character_id = $1 AND spell_id = $2', [characterId, spellId]);
      return res.rows[0] ? { ...res.rows[0], spell } : null;
    }
    const res = await this.pool.query(`UPDATE character_spells SET ${fields.join(', ')} WHERE character_id = $1 AND spell_id = $2 RETURNING *`, values);
    return res.rows[0] ? { ...res.rows[0], spell } : null;
  }

  public async removeCharacterSpell(characterId: number, spellId: number): Promise<boolean> {
    const res = await this.pool.query('DELETE FROM character_spells WHERE character_id = $1 AND spell_id = $2 RETURNING spell_id', [characterId, spellId]);
    return (res.rowCount ?? 0) > 0;
  }

  public async getSavesByCharacter(characterId: number): Promise<CharacterSave[]> {
    const res = await this.pool.query('SELECT * FROM character_saves WHERE character_id = $1 ORDER BY saved_at DESC', [characterId]);
    return res.rows;
  }

  public async createSave(characterId: number, saveName = 'Manual save'): Promise<CharacterSave | null> {
    const char = await this.getCharacterById(characterId);
    if (!char) return null;
    const detail = await this.getCharacterDetail(characterId);
    if (!detail) return null;
    const snapshot = {
      character: { ...char },
      stats: { ...detail.stats },
      inventory: detail.inventory.map((i) => ({ ...i })),
      spells: detail.spells.map((s) => ({ ...s })),
      timestamp: new Date().toISOString(),
    };
    const res = await this.pool.query(`
      INSERT INTO character_saves (character_id, save_name, snapshot)
      VALUES ($1, $2, $3)
      RETURNING *;
    `, [characterId, saveName.trim() || 'Manual save', JSON.stringify(snapshot)]);
    return res.rows[0];
  }

  public async restoreSave(characterId: number, saveId: number): Promise<CharacterDetail | null> {
    const res = await this.pool.query('SELECT * FROM character_saves WHERE character_id = $1 AND save_id = $2', [characterId, saveId]);
    if (res.rows.length === 0) return null;
    const snap = typeof res.rows[0].snapshot === 'string' ? JSON.parse(res.rows[0].snapshot) : res.rows[0].snapshot;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`
        UPDATE characters
        SET character_name = $2, race = $3, character_class = $4, character_level = $5,
            experience_points = $6, background = $7, alignment = $8, updated_at = NOW()
        WHERE character_id = $1;
      `, [
        characterId,
        snap.character.character_name,
        snap.character.race,
        snap.character.character_class,
        snap.character.character_level,
        snap.character.experience_points,
        snap.character.background,
        snap.character.alignment,
      ]);

      await client.query(`
        UPDATE character_stats
        SET strength = $2, dexterity = $3, constitution = $4, intelligence = $5,
            wisdom = $6, charisma = $7, max_hp = $8, current_hp = $9, armor_class = $10
        WHERE character_id = $1;
      `, [
        characterId,
        snap.stats.strength,
        snap.stats.dexterity,
        snap.stats.constitution,
        snap.stats.intelligence,
        snap.stats.wisdom,
        snap.stats.charisma,
        snap.stats.max_hp,
        snap.stats.current_hp,
        snap.stats.armor_class,
      ]);

      await client.query('DELETE FROM inventory_items WHERE character_id = $1', [characterId]);
      for (const item of snap.inventory) {
        await client.query(`
          INSERT INTO inventory_items (character_id, item_name, quantity, weight, description)
          VALUES ($1, $2, $3, $4, $5);
        `, [characterId, item.item_name, item.quantity, item.weight, item.description]);
      }

      await client.query('DELETE FROM character_spells WHERE character_id = $1', [characterId]);
      for (const s of snap.spells) {
        await client.query(`
          INSERT INTO character_spells (character_id, spell_id, is_prepared, notes)
          VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING;
        `, [characterId, s.spell_id, s.is_prepared, s.notes]);
      }

      await client.query('COMMIT');
      return await this.getCharacterDetail(characterId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public async deleteSave(characterId: number, saveId: number): Promise<boolean> {
    const res = await this.pool.query('DELETE FROM character_saves WHERE character_id = $1 AND save_id = $2 RETURNING save_id', [characterId, saveId]);
    return (res.rowCount ?? 0) > 0;
  }
}

// --- Unified Database Manager ---
class DatabaseManager {
  private pgStore: PostgresDatabaseStore | null = null;
  private memoryStore: InMemoryDatabaseStore = new InMemoryDatabaseStore();
  private connected = false;
  private connectionError: string | null = null;
  private activeHost: string | null = null;
  private activeSourceKey: string | null = null;
  private initPromise: Promise<void> | null = null;
  private isConnecting = false;

  constructor() {
    this.initPromise = this.autoInit();
  }

  public hasConfiguredDatabaseUrl(): boolean {
    const { url } = getDatabaseUrlFromEnv();
    return !!url;
  }

  public getActiveSourceKey(): string | null {
    return this.activeSourceKey;
  }

  public async autoInit(): Promise<void> {
    if (this.isConnecting) {
      if (this.initPromise) {
        await this.initPromise;
      }
      return;
    }

    this.isConnecting = true;
    try {
      const { url, sourceKey, rawValue } = getDatabaseUrlFromEnv();

      // If a database URL variable was present in process.env
      if (url) {
        const res = await this.connect(url, sourceKey);
        if (res.connected) {
          console.log(`[Database] Auto-connected successfully via ${sourceKey} to PostgreSQL: ${this.activeHost}`);
          return;
        } else {
          console.warn(`[Database] Auto-connect via ${sourceKey} failed: ${res.error}`);
        }
      } else if (rawValue) {
        const cleaned = cleanConnectionString(rawValue);
        if (cleaned.error) {
          this.connected = false;
          this.connectionError = cleaned.error;
          return;
        }
      }

      // Check if in-memory is explicitly allowed (e.g. for offline unit tests)
      if (process.env.ALLOW_IN_MEMORY === 'true') {
        this.connected = true;
        this.connectionError = null;
        this.activeSourceKey = 'ALLOW_IN_MEMORY';
        console.log('[Database] Running in in-memory simulation mode (ALLOW_IN_MEMORY=true)');
        return;
      }

      // Default: Database is NOT connected until DATABASE_URL is configured
      this.connected = false;
      this.connectionError = url
        ? `Gagal terhubung ke database eksternal: ${this.connectionError || 'Connection refused or timeout'}`
        : 'DATABASE_URL belum dikonfigurasi di Vercel Environment Variables. Penting: Jika sudah menambahkan variabel di Vercel, pastikan untuk melakukan "Redeploy" agar variabel diterapkan ke container serverless.';
    } finally {
      this.isConnecting = false;
    }
  }

  public async connect(rawUrl: string, sourceKey = 'manual'): Promise<{ connected: boolean; error?: string }> {
    const cleaned = cleanConnectionString(rawUrl);
    if (cleaned.error) {
      this.connected = false;
      this.connectionError = cleaned.error;
      return { connected: false, error: cleaned.error };
    }

    const url = cleaned.url;

    try {
      if (this.pgStore) {
        try {
          await this.pgStore.pool.end();
        } catch (_) {}
      }

      const store = new PostgresDatabaseStore(url);
      // Fast query to verify credentials and connection
      const testRes = await store.pool.query('SELECT NOW() AS now, current_database() AS db');
      if (testRes.rows.length === 0) {
        throw new Error('Database query returned empty response');
      }

      // Initialize schema and seed data if not present
      await store.initSchemaAndSeed();

      this.pgStore = store;
      this.connected = true;
      this.connectionError = null;
      this.activeSourceKey = sourceKey;

      try {
        const parsed = new URL(url.replace(/^postgres(ql)?:\/\//, 'http://'));
        this.activeHost = `${parsed.hostname}${parsed.port ? ':' + parsed.port : ''} (${testRes.rows[0].db || 'postgres'})`;
      } catch (_) {
        this.activeHost = 'PostgreSQL Cloud Database';
      }

      // Synchronize in-memory process.env so any downstream code has it
      process.env.DATABASE_URL = url;
      return { connected: true };
    } catch (err: any) {
      this.connected = false;
      let msg = err.message || 'Gagal menyambung ke server database PostgreSQL';
      if (msg.includes('Tenant or user not found')) {
        msg = `Database Supabase tidak ditemukan (Tenant or user not found). Periksa kembali username dan password database Anda di Supabase.`;
      } else if (msg.includes('password authentication failed')) {
        msg = `Autentikasi password gagal (password authentication failed). Pastikan password database Supabase Anda benar.`;
      } else if (msg.includes('ENETUNREACH') || msg.includes('ETIMEDOUT')) {
        msg = `Koneksi timeout/unreachable (${err.code || 'ETIMEDOUT'}). Jika menggunakan Supabase di Vercel, pastikan memakai Connection String Pooler (port 6543 / pooler.supabase.com), bukan Direct IP.`;
      }
      this.connectionError = msg;
      return { connected: false, error: msg };
    }
  }

  public async ensureReady(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public getConnectionError(): string | null {
    return this.connectionError;
  }

  public getActiveHost(): string | null {
    return this.activeHost;
  }

  public async checkConnection(): Promise<{
    connected: boolean;
    database: string | null;
    host: string | null;
    source?: string | null;
    error?: string;
  }> {
    await this.ensureReady();

    // If not connected, but we have a database URL configured in env, attempt retry
    if (!this.connected && this.hasConfiguredDatabaseUrl()) {
      await this.autoInit();
    }

    if (!this.connected) {
      return {
        connected: false,
        database: null,
        host: null,
        source: null,
        error: this.connectionError || 'Database not connected',
      };
    }

    if (this.pgStore) {
      try {
        await this.pgStore.pool.query('SELECT 1');
        return {
          connected: true,
          database: 'postgresql',
          host: this.activeHost,
          source: this.activeSourceKey,
        };
      } catch (err: any) {
        this.connected = false;
        this.connectionError = err.message;
        return {
          connected: false,
          database: null,
          host: null,
          source: null,
          error: err.message,
        };
      }
    }

    return {
      connected: true,
      database: 'in-memory',
      host: 'local-memory',
      source: 'ALLOW_IN_MEMORY',
    };
  }

  // Delegated CRUD operations
  public async getAllCharacters(): Promise<Character[]> {
    await this.ensureReady();
    if (this.pgStore) return this.pgStore.getAllCharacters();
    return this.memoryStore.getAllCharacters();
  }

  public async getCharacterById(id: number): Promise<Character | undefined> {
    await this.ensureReady();
    if (this.pgStore) return this.pgStore.getCharacterById(id);
    return this.memoryStore.getCharacterById(id);
  }

  public async getCharacterDetail(id: number): Promise<CharacterDetail | null> {
    await this.ensureReady();
    if (this.pgStore) return this.pgStore.getCharacterDetail(id);
    return this.memoryStore.getCharacterDetail(id);
  }

  public async createCharacter(
    charData: Omit<Character, 'character_id' | 'created_at' | 'updated_at'>,
    statsData?: Partial<Omit<CharacterStats, 'character_id'>>
  ): Promise<CharacterDetail> {
    await this.ensureReady();
    if (this.pgStore) return this.pgStore.createCharacter(charData, statsData);
    return this.memoryStore.createCharacter(charData, statsData);
  }

  public async updateCharacter(
    id: number,
    charData: Partial<Omit<Character, 'character_id' | 'created_at'>>,
    statsData?: Partial<Omit<CharacterStats, 'character_id'>>
  ): Promise<CharacterDetail | null> {
    await this.ensureReady();
    if (this.pgStore) return this.pgStore.updateCharacter(id, charData, statsData);
    return this.memoryStore.updateCharacter(id, charData, statsData);
  }

  public async deleteCharacter(id: number): Promise<boolean> {
    await this.ensureReady();
    if (this.pgStore) return this.pgStore.deleteCharacter(id);
    return this.memoryStore.deleteCharacter(id);
  }

  public async searchCharacters(query: string): Promise<Character[]> {
    await this.ensureReady();
    if (this.pgStore) return this.pgStore.searchCharacters(query);
    return this.memoryStore.searchCharacters(query);
  }

  public async getInventoryByCharacter(characterId: number): Promise<InventoryItem[]> {
    await this.ensureReady();
    if (this.pgStore) return this.pgStore.getInventoryByCharacter(characterId);
    return this.memoryStore.getInventoryByCharacter(characterId);
  }

  public async addInventoryItem(characterId: number, itemName: string, quantity = 1, weight = 0, description = ''): Promise<InventoryItem | null> {
    await this.ensureReady();
    if (this.pgStore) return this.pgStore.addInventoryItem(characterId, itemName, quantity, weight, description);
    return this.memoryStore.addInventoryItem(characterId, itemName, quantity, weight, description);
  }

  public async updateInventoryItem(itemId: number, update: Partial<Omit<InventoryItem, 'item_id' | 'character_id' | 'added_at'>>): Promise<InventoryItem | null> {
    await this.ensureReady();
    if (this.pgStore) return this.pgStore.updateInventoryItem(itemId, update);
    return this.memoryStore.updateInventoryItem(itemId, update);
  }

  public async deleteInventoryItem(characterId: number, itemId: number): Promise<boolean> {
    await this.ensureReady();
    if (this.pgStore) return this.pgStore.deleteInventoryItem(characterId, itemId);
    return this.memoryStore.deleteInventoryItem(characterId, itemId);
  }

  public async getAllSpells(): Promise<Spell[]> {
    await this.ensureReady();
    if (this.pgStore) return this.pgStore.getAllSpells();
    return this.memoryStore.getAllSpells();
  }

  public async getSpellById(id: number): Promise<Spell | undefined> {
    await this.ensureReady();
    if (this.pgStore) return this.pgStore.getSpellById(id);
    return this.memoryStore.getSpellById(id);
  }

  public async createSpell(spellData: Omit<Spell, 'spell_id'>): Promise<Spell> {
    await this.ensureReady();
    if (this.pgStore) return this.pgStore.createSpell(spellData);
    return this.memoryStore.createSpell(spellData);
  }

  public async getSpellsByCharacter(characterId: number): Promise<(CharacterSpell & { spell: Spell })[]> {
    await this.ensureReady();
    if (this.pgStore) return this.pgStore.getSpellsByCharacter(characterId);
    return this.memoryStore.getSpellsByCharacter(characterId);
  }

  public async assignSpell(characterId: number, spellId: number, isPrepared = false, notes = ''): Promise<(CharacterSpell & { spell: Spell }) | null> {
    await this.ensureReady();
    if (this.pgStore) return this.pgStore.assignSpell(characterId, spellId, isPrepared, notes);
    return this.memoryStore.assignSpell(characterId, spellId, isPrepared, notes);
  }

  public async updateCharacterSpell(characterId: number, spellId: number, isPrepared?: boolean, notes?: string): Promise<(CharacterSpell & { spell: Spell }) | null> {
    await this.ensureReady();
    if (this.pgStore) return this.pgStore.updateCharacterSpell(characterId, spellId, isPrepared, notes);
    return this.memoryStore.updateCharacterSpell(characterId, spellId, isPrepared, notes);
  }

  public async removeCharacterSpell(characterId: number, spellId: number): Promise<boolean> {
    await this.ensureReady();
    if (this.pgStore) return this.pgStore.removeCharacterSpell(characterId, spellId);
    return this.memoryStore.removeCharacterSpell(characterId, spellId);
  }

  public async getSavesByCharacter(characterId: number): Promise<CharacterSave[]> {
    await this.ensureReady();
    if (this.pgStore) return this.pgStore.getSavesByCharacter(characterId);
    return this.memoryStore.getSavesByCharacter(characterId);
  }

  public async createSave(characterId: number, saveName = 'Manual save'): Promise<CharacterSave | null> {
    await this.ensureReady();
    if (this.pgStore) return this.pgStore.createSave(characterId, saveName);
    return this.memoryStore.createSave(characterId, saveName);
  }

  public async restoreSave(characterId: number, saveId: number): Promise<CharacterDetail | null> {
    await this.ensureReady();
    if (this.pgStore) return this.pgStore.restoreSave(characterId, saveId);
    return this.memoryStore.restoreSave(characterId, saveId);
  }

  public async deleteSave(characterId: number, saveId: number): Promise<boolean> {
    await this.ensureReady();
    if (this.pgStore) return this.pgStore.deleteSave(characterId, saveId);
    return this.memoryStore.deleteSave(characterId, saveId);
  }
}

export const db = new DatabaseManager();
