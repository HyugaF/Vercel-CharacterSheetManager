/**
 * Implementation of the 20 Core Functions defined in
 * Tabletop Player Sheet Manager (Tugas Akhir Learning Labs)
 * Async database support for PostgreSQL and in-memory store
 */

import { Response } from 'express';
import { db } from './db.ts';
import {
  CharacterDetail,
  Character,
  InventoryItem,
  Spell,
  CharacterSpell,
  CharacterSave,
  CreateCharacterInput,
  UpdateCharacterInput,
  CreateInventoryInput,
  AssignSpellInput,
} from '../types/index.ts';
import {
  hitungModifier,
  ubahHP as calcUbahHP,
  cekLevelUp as calcCekLevelUp,
  validasiData,
} from '../utils/characterRules.ts';

// 6. hitungModifier()
export { hitungModifier };

// 18. validasiData()
export { validasiData };

// 20. handleError()
export function handleError(
  res: Response,
  statusCode: number,
  message: string,
  errors?: string[]
): void {
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(errors && errors.length > 0 ? { errors } : {}),
  });
}

// 1. buatKarakter()
export async function buatKarakter(input: CreateCharacterInput): Promise<{
  success: boolean;
  data?: CharacterDetail;
  error?: string;
  errors?: string[];
}> {
  const validation = validasiData('character', input);
  if (!validation.isValid) {
    return { success: false, error: 'Validasi data karakter gagal', errors: validation.errors };
  }

  if (input.stats) {
    const statsValidation = validasiData('stats', input.stats);
    if (!statsValidation.isValid) {
      return { success: false, error: 'Validasi stats karakter gagal', errors: statsValidation.errors };
    }
  }

  const newChar = await db.createCharacter(
    {
      character_name: input.character_name,
      race: input.race,
      character_class: input.character_class,
      character_level: input.character_level ?? 1,
      experience_points: input.experience_points ?? 0,
      background: input.background,
      alignment: input.alignment,
    },
    input.stats
  );

  return { success: true, data: newChar };
}

// 2. tampilkanKarakter()
export async function tampilkanKarakter(id: number): Promise<{
  success: boolean;
  data?: CharacterDetail;
  error?: string;
}> {
  const char = await db.getCharacterDetail(id);
  if (!char) {
    return { success: false, error: `Karakter dengan ID ${id} tidak ditemukan` };
  }
  return { success: true, data: char };
}

// 3. editKarakter()
export async function editKarakter(
  id: number,
  input: UpdateCharacterInput
): Promise<{
  success: boolean;
  data?: CharacterDetail;
  error?: string;
  errors?: string[];
}> {
  const existing = await db.getCharacterById(id);
  if (!existing) {
    return { success: false, error: `Karakter dengan ID ${id} tidak ditemukan` };
  }

  if (input.character_name !== undefined || input.race !== undefined || input.character_class !== undefined) {
    const validation = validasiData('character', {
      character_name: input.character_name ?? existing.character_name,
      race: input.race ?? existing.race,
      character_class: input.character_class ?? existing.character_class,
      character_level: input.character_level ?? existing.character_level,
      experience_points: input.experience_points ?? existing.experience_points,
    });
    if (!validation.isValid) {
      return { success: false, error: 'Validasi perubahan karakter gagal', errors: validation.errors };
    }
  }

  if (input.stats) {
    const statsValidation = validasiData('stats', input.stats);
    if (!statsValidation.isValid) {
      return { success: false, error: 'Validasi perubahan stats gagal', errors: statsValidation.errors };
    }
  }

  const updated = await db.updateCharacter(
    id,
    {
      ...(input.character_name && { character_name: input.character_name }),
      ...(input.race && { race: input.race }),
      ...(input.character_class && { character_class: input.character_class }),
      ...(input.character_level !== undefined && { character_level: input.character_level }),
      ...(input.experience_points !== undefined && { experience_points: input.experience_points }),
      ...(input.background !== undefined && { background: input.background }),
      ...(input.alignment !== undefined && { alignment: input.alignment }),
    },
    input.stats
  );

  return { success: true, data: updated! };
}

// 4. hapusKarakter()
export async function hapusKarakter(id: number): Promise<{ success: boolean; error?: string }> {
  const deleted = await db.deleteCharacter(id);
  if (!deleted) {
    return { success: false, error: `Karakter dengan ID ${id} tidak ditemukan` };
  }
  return { success: true };
}

// 5. cariKarakter()
export async function cariKarakter(query: string): Promise<Character[]> {
  return await db.searchCharacters(query);
}

// 7. ubahHP()
export async function ubahHP(
  id: number,
  delta: number
): Promise<{
  success: boolean;
  data?: { current_hp: number; max_hp: number; delta: number };
  error?: string;
}> {
  const detail = await db.getCharacterDetail(id);
  if (!detail) {
    return { success: false, error: `Karakter dengan ID ${id} tidak ditemukan` };
  }

  const newHp = calcUbahHP(detail.stats.current_hp, detail.stats.max_hp, delta);
  await db.updateCharacter(id, {}, { current_hp: newHp });

  return {
    success: true,
    data: {
      current_hp: newHp,
      max_hp: detail.stats.max_hp,
      delta,
    },
  };
}

// 8. tambahXP()
export async function tambahXP(
  id: number,
  amount: number
): Promise<{
  success: boolean;
  data?: {
    previous_xp: number;
    new_xp: number;
    level: number;
    leveled_up: boolean;
    eligible_level: number;
  };
  error?: string;
}> {
  const char = await db.getCharacterById(id);
  if (!char) {
    return { success: false, error: `Karakter dengan ID ${id} tidak ditemukan` };
  }

  if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
    return { success: false, error: 'Jumlah penambahan XP harus berupa angka >= 0' };
  }

  const prevXp = char.experience_points;
  const newXp = prevXp + amount;
  const check = calcCekLevelUp(char.character_level, newXp);

  const newLevel = check.shouldLevelUp ? check.eligibleLevel : char.character_level;
  await db.updateCharacter(id, { experience_points: newXp, character_level: newLevel });

  return {
    success: true,
    data: {
      previous_xp: prevXp,
      new_xp: newXp,
      level: newLevel,
      leveled_up: check.shouldLevelUp,
      eligible_level: check.eligibleLevel,
    },
  };
}

// 9. cekLevelUp()
export async function cekLevelUp(id: number): Promise<{
  success: boolean;
  data?: ReturnType<typeof calcCekLevelUp> & { current_level: number; current_xp: number };
  error?: string;
}> {
  const char = await db.getCharacterById(id);
  if (!char) {
    return { success: false, error: `Karakter dengan ID ${id} tidak ditemukan` };
  }

  const result = calcCekLevelUp(char.character_level, char.experience_points);
  return {
    success: true,
    data: {
      ...result,
      current_level: char.character_level,
      current_xp: char.experience_points,
    },
  };
}

// 10. tambahInventory()
export async function tambahInventory(
  characterId: number,
  input: CreateInventoryInput
): Promise<{
  success: boolean;
  data?: InventoryItem;
  error?: string;
  errors?: string[];
}> {
  const char = await db.getCharacterById(characterId);
  if (!char) {
    return { success: false, error: `Karakter dengan ID ${characterId} tidak ditemukan` };
  }

  const val = validasiData('inventory', input);
  if (!val.isValid) {
    return { success: false, error: 'Data item inventory tidak valid', errors: val.errors };
  }

  const item = await db.addInventoryItem(
    characterId,
    input.item_name,
    input.quantity ?? 1,
    input.weight ?? 0,
    input.description ?? ''
  );

  return { success: true, data: item! };
}

// 11. hapusInventory()
export async function hapusInventory(
  characterId: number,
  itemId: number
): Promise<{ success: boolean; error?: string }> {
  const deleted = await db.deleteInventoryItem(characterId, itemId);
  if (!deleted) {
    return { success: false, error: `Item ID ${itemId} pada karakter ${characterId} tidak ditemukan` };
  }
  return { success: true };
}

// 12. tampilkanInventory()
export async function tampilkanInventory(characterId: number): Promise<{
  success: boolean;
  data?: { items: InventoryItem[]; total_count: number; total_weight: number };
  error?: string;
}> {
  const char = await db.getCharacterById(characterId);
  if (!char) {
    return { success: false, error: `Karakter dengan ID ${characterId} tidak ditemukan` };
  }

  const items = await db.getInventoryByCharacter(characterId);
  const total_weight = items.reduce((acc, curr) => acc + (curr.weight ?? 0) * curr.quantity, 0);

  return {
    success: true,
    data: {
      items,
      total_count: items.length,
      total_weight: Math.round(total_weight * 100) / 100,
    },
  };
}

// 13. tambahSpell()
export async function tambahSpell(
  characterId: number,
  input: AssignSpellInput
): Promise<{
  success: boolean;
  data?: CharacterSpell & { spell: Spell };
  error?: string;
}> {
  const char = await db.getCharacterById(characterId);
  if (!char) {
    return { success: false, error: `Karakter dengan ID ${characterId} tidak ditemukan` };
  }

  const spell = await db.getSpellById(input.spell_id);
  if (!spell) {
    return { success: false, error: `Spell dengan ID ${input.spell_id} tidak ditemukan di master spell library` };
  }

  const assigned = await db.assignSpell(characterId, input.spell_id, input.is_prepared ?? false, input.notes ?? '');
  return { success: true, data: assigned! };
}

// 14. hapusSpell()
export async function hapusSpell(
  characterId: number,
  spellId: number
): Promise<{ success: boolean; error?: string }> {
  const removed = await db.removeCharacterSpell(characterId, spellId);
  if (!removed) {
    return { success: false, error: `Spell ID ${spellId} tidak terkait dengan karakter ${characterId}` };
  }
  return { success: true };
}

// 15. tampilkanSpell()
export async function tampilkanSpell(characterId: number): Promise<{
  success: boolean;
  data?: (CharacterSpell & { spell: Spell })[];
  error?: string;
}> {
  const char = await db.getCharacterById(characterId);
  if (!char) {
    return { success: false, error: `Karakter dengan ID ${characterId} tidak ditemukan` };
  }

  const spells = await db.getSpellsByCharacter(characterId);
  return { success: true, data: spells };
}

// 16. simpanData()
export async function simpanData(
  characterId: number,
  saveName = 'Manual snapshot'
): Promise<{
  success: boolean;
  data?: CharacterSave;
  error?: string;
}> {
  const save = await db.createSave(characterId, saveName);
  if (!save) {
    return { success: false, error: `Gagal menyimpan snapshot, karakter ${characterId} tidak ditemukan` };
  }
  return { success: true, data: save };
}

// 17. muatData()
export async function muatData(
  characterId: number,
  saveId: number
): Promise<{
  success: boolean;
  data?: CharacterDetail;
  error?: string;
}> {
  const restored = await db.restoreSave(characterId, saveId);
  if (!restored) {
    return { success: false, error: `Snapshot ID ${saveId} tidak ditemukan untuk karakter ${characterId}` };
  }
  return { success: true, data: restored };
}

// 19. resetKarakter()
export async function resetKarakter(characterId: number): Promise<{
  success: boolean;
  data?: CharacterDetail;
  error?: string;
}> {
  const detail = await db.getCharacterDetail(characterId);
  if (!detail) {
    return { success: false, error: `Karakter dengan ID ${characterId} tidak ditemukan` };
  }

  const resetStats = {
    ...detail.stats,
    current_hp: detail.stats.max_hp,
  };
  await db.updateCharacter(characterId, {}, resetStats);

  const fresh = await db.getCharacterDetail(characterId);
  return { success: true, data: fresh! };
}
