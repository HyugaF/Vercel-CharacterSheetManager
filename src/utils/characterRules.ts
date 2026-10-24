/**
 * Pure business logic and rule calculations for Tabletop Player Sheet Manager
 */

export const XP_TABLE: Record<number, number> = {
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
  6: 14000,
  7: 23000,
  8: 34000,
  9: 48000,
  10: 64000,
  11: 85000,
  12: 100000,
  13: 120000,
  14: 140000,
  15: 165000,
  16: 195000,
  17: 225000,
  18: 265000,
  19: 305000,
  20: 355000,
};

/**
 * 6. hitungModifier()
 * Menghitung ability modifier berdasarkan ability score (standar D&D: floor((score - 10) / 2))
 */
export function hitungModifier(score: number): number {
  if (typeof score !== 'number' || isNaN(score)) return 0;
  return Math.floor((score - 10) / 2);
}

/**
 * Hitung Proficiency Bonus D&D 5e berdasarkan level karakter (Level 1-4: +2, 5-8: +3, etc.)
 */
export function hitungProficiency(level: number): number {
  const safeLvl = Math.max(1, Math.min(20, level || 1));
  return Math.floor((safeLvl - 1) / 4) + 2;
}

export const STANDARD_SKILLS: { name: string; ability: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'; defaultProfClasses: string[] }[] = [
  { name: 'Acrobatics', ability: 'DEX', defaultProfClasses: ['Rogue', 'Monk', 'Bard'] },
  { name: 'Animal Handling', ability: 'WIS', defaultProfClasses: ['Druid', 'Ranger'] },
  { name: 'Arcana', ability: 'INT', defaultProfClasses: ['Wizard', 'Warlock', 'Sorcerer'] },
  { name: 'Athletics', ability: 'STR', defaultProfClasses: ['Fighter', 'Barbarian', 'Paladin'] },
  { name: 'Deception', ability: 'CHA', defaultProfClasses: ['Rogue', 'Bard', 'Warlock'] },
  { name: 'History', ability: 'INT', defaultProfClasses: ['Wizard', 'Cleric', 'Bard'] },
  { name: 'Insight', ability: 'WIS', defaultProfClasses: ['Cleric', 'Paladin', 'Monk'] },
  { name: 'Intimidation', ability: 'CHA', defaultProfClasses: ['Barbarian', 'Warlock', 'Paladin'] },
  { name: 'Investigation', ability: 'INT', defaultProfClasses: ['Rogue', 'Wizard'] },
  { name: 'Medicine', ability: 'WIS', defaultProfClasses: ['Cleric', 'Druid'] },
  { name: 'Nature', ability: 'INT', defaultProfClasses: ['Druid', 'Ranger'] },
  { name: 'Perception', ability: 'WIS', defaultProfClasses: ['Ranger', 'Rogue', 'Elf'] },
  { name: 'Performance', ability: 'CHA', defaultProfClasses: ['Bard'] },
  { name: 'Persuasion', ability: 'CHA', defaultProfClasses: ['Paladin', 'Bard', 'Cleric'] },
  { name: 'Religion', ability: 'INT', defaultProfClasses: ['Cleric', 'Paladin', 'Wizard'] },
  { name: 'Sleight of Hand', ability: 'DEX', defaultProfClasses: ['Rogue', 'Bard'] },
  { name: 'Stealth', ability: 'DEX', defaultProfClasses: ['Rogue', 'Ranger', 'Monk'] },
  { name: 'Survival', ability: 'WIS', defaultProfClasses: ['Barbarian', 'Ranger', 'Druid'] },
];

/**
 * Format ability modifier dengan tanda + atau -
 */
export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

/**
 * 7. ubahHP()
 * Menambah atau mengurangi HP karakter (clamped di antara 0 dan max_hp)
 */
export function ubahHP(currentHp: number, maxHp: number, delta: number): number {
  const safeMax = Math.max(1, maxHp);
  const newHp = currentHp + delta;
  return Math.max(0, Math.min(newHp, safeMax));
}

/**
 * 9. cekLevelUp()
 * Memeriksa apakah XP karakter sudah memenuhi syarat untuk naik level
 */
export function cekLevelUp(currentLevel: number, totalXp: number): {
  shouldLevelUp: boolean;
  eligibleLevel: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
  xpNeeded: number;
} {
  const safeLevel = Math.max(1, Math.min(20, currentLevel));
  const safeXp = Math.max(0, totalXp);

  // Cari level tertinggi yang berhak didapatkan berdasarkan XP
  let eligibleLevel = 1;
  for (let lvl = 20; lvl >= 1; lvl--) {
    if (safeXp >= (XP_TABLE[lvl] ?? 0)) {
      eligibleLevel = lvl;
      break;
    }
  }

  const shouldLevelUp = eligibleLevel > safeLevel;
  const currentThreshold = XP_TABLE[safeLevel] ?? 0;
  const nextThreshold = safeLevel < 20 ? (XP_TABLE[safeLevel + 1] ?? XP_TABLE[20]) : XP_TABLE[20];

  const range = Math.max(1, nextThreshold - currentThreshold);
  const xpIntoLevel = Math.max(0, safeXp - currentThreshold);
  const progressPercent = safeLevel >= 20 ? 100 : Math.min(100, Math.round((xpIntoLevel / range) * 100));
  const xpNeeded = safeLevel >= 20 ? 0 : Math.max(0, nextThreshold - safeXp);

  return {
    shouldLevelUp,
    eligibleLevel,
    currentLevelXp: currentThreshold,
    nextLevelXp: nextThreshold,
    progressPercent,
    xpNeeded,
  };
}

/**
 * 18. validasiData()
 * Memastikan data input sesuai format dan batasan tabel SQL
 */
export function validasiData(
  type: 'character' | 'stats' | 'inventory' | 'spell' | 'character_spell',
  data: Record<string, any>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Payload data harus berupa object JSON valid'] };
  }

  if (type === 'character') {
    if (!data.character_name || typeof data.character_name !== 'string' || !data.character_name.trim()) {
      errors.push('Nama karakter (character_name) wajib diisi');
    } else if (data.character_name.length > 100) {
      errors.push('Nama karakter maksimal 100 karakter');
    }

    if (!data.race || typeof data.race !== 'string' || !data.race.trim()) {
      errors.push('Ras karakter (race) wajib diisi');
    }

    if (!data.character_class || typeof data.character_class !== 'string' || !data.character_class.trim()) {
      errors.push('Class karakter (character_class) wajib diisi');
    }

    if (data.character_level !== undefined) {
      const lvl = Number(data.character_level);
      if (isNaN(lvl) || lvl < 1 || lvl > 20) {
        errors.push('Level karakter harus berupa angka antara 1 dan 20');
      }
    }

    if (data.experience_points !== undefined) {
      const xp = Number(data.experience_points);
      if (isNaN(xp) || xp < 0) {
        errors.push('Experience points (XP) harus berupa angka >= 0');
      }
    }
  }

  if (type === 'stats') {
    const abilityFields = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    for (const field of abilityFields) {
      if (data[field] !== undefined) {
        const val = Number(data[field]);
        if (isNaN(val) || val < 1 || val > 30) {
          errors.push(`Stat ${field} harus berada dalam rentang 1 hingga 30`);
        }
      }
    }

    if (data.max_hp !== undefined) {
      const maxHp = Number(data.max_hp);
      if (isNaN(maxHp) || maxHp < 1) {
        errors.push('Max HP minimal harus bernilai 1');
      }
    }

    if (data.current_hp !== undefined) {
      const currHp = Number(data.current_hp);
      if (isNaN(currHp) || currHp < 0) {
        errors.push('Current HP tidak boleh negatif');
      }
      if (data.max_hp !== undefined && currHp > Number(data.max_hp)) {
        errors.push('Current HP tidak boleh melebihi Max HP (constraint: current_hp <= max_hp)');
      }
    }

    if (data.armor_class !== undefined) {
      const ac = Number(data.armor_class);
      if (isNaN(ac) || ac < 0) {
        errors.push('Armor Class tidak boleh bernilai negatif');
      }
    }
  }

  if (type === 'inventory') {
    if (!data.item_name || typeof data.item_name !== 'string' || !data.item_name.trim()) {
      errors.push('Nama item (item_name) wajib diisi');
    } else if (data.item_name.length > 100) {
      errors.push('Nama item maksimal 100 karakter');
    }

    if (data.quantity !== undefined) {
      const qty = Number(data.quantity);
      if (isNaN(qty) || qty < 1) {
        errors.push('Jumlah (quantity) minimal bernilai 1');
      }
    }

    if (data.weight !== undefined && data.weight !== null) {
      const w = Number(data.weight);
      if (isNaN(w) || w < 0) {
        errors.push('Berat item (weight) tidak boleh negatif');
      }
    }
  }

  if (type === 'spell') {
    if (!data.spell_name || typeof data.spell_name !== 'string' || !data.spell_name.trim()) {
      errors.push('Nama spell (spell_name) wajib diisi');
    }

    if (data.spell_level !== undefined) {
      const lvl = Number(data.spell_level);
      if (isNaN(lvl) || lvl < 0 || lvl > 9) {
        errors.push('Level spell harus di antara 0 (Cantrip) dan 9');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
