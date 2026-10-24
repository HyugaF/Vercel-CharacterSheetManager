/**
 * Tabletop Player Sheet Manager - Type Definitions
 * Relational schema representing 6 tables:
 * - characters
 * - character_stats
 * - inventory_items
 * - spells
 * - character_spells (Pivot)
 * - character_saves
 */

export interface Character {
  character_id: number;
  character_name: string;
  race: string;
  character_class: string;
  character_level: number;
  experience_points: number;
  background?: string;
  alignment?: string;
  created_at: string;
  updated_at: string;
}

export interface CharacterStats {
  character_id: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  max_hp: number;
  current_hp: number;
  armor_class: number;
}

export interface AbilityModifiers {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface InventoryItem {
  item_id: number;
  character_id: number;
  item_name: string;
  quantity: number;
  weight: number | null;
  description?: string;
  added_at: string;
}

export interface Spell {
  spell_id: number;
  spell_name: string;
  spell_level: number;
  school: string;
  casting_time: string;
  range_text: string;
  duration: string;
  description: string;
}

export interface CharacterSpell {
  character_id: number;
  spell_id: number;
  is_prepared: boolean;
  notes?: string;
  added_at: string;
  spell?: Spell; // Joined spell details
}

export interface CharacterSave {
  save_id: number;
  character_id: number;
  save_name: string;
  snapshot: {
    character: Character;
    stats: CharacterStats;
    inventory: InventoryItem[];
    spells: CharacterSpell[];
    timestamp: string;
  };
  saved_at: string;
}

export interface CharacterDetail extends Character {
  stats: CharacterStats;
  modifiers: AbilityModifiers;
  inventory: InventoryItem[];
  spells: (CharacterSpell & { spell: Spell })[];
  saves_count: number;
  total_weight: number;
  next_level_xp: number;
  level_progress: number;
}

export interface CreateCharacterInput {
  character_name: string;
  race: string;
  character_class: string;
  character_level?: number;
  experience_points?: number;
  background?: string;
  alignment?: string;
  stats?: {
    strength?: number;
    dexterity?: number;
    constitution?: number;
    intelligence?: number;
    wisdom?: number;
    charisma?: number;
    max_hp?: number;
    current_hp?: number;
    armor_class?: number;
  };
}

export interface UpdateCharacterInput {
  character_name?: string;
  race?: string;
  character_class?: string;
  character_level?: number;
  experience_points?: number;
  background?: string;
  alignment?: string;
  stats?: Partial<Omit<CharacterStats, 'character_id'>>;
}

export interface CreateInventoryInput {
  item_name: string;
  quantity?: number;
  weight?: number;
  description?: string;
}

export interface UpdateInventoryInput {
  item_name?: string;
  quantity?: number;
  weight?: number;
  description?: string;
}

export interface AssignSpellInput {
  spell_id: number;
  is_prepared?: boolean;
  notes?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: string[];
}
