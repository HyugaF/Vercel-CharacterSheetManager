import React, { useState, useEffect } from 'react';
import { X, UserPlus, Sparkles, AlertCircle } from 'lucide-react';
import { CreateCharacterInput, CharacterDetail } from '../types/index.ts';

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCharacterInput) => Promise<boolean>;
  initialData?: CharacterDetail | null;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [characterName, setCharacterName] = useState(initialData?.character_name || '');
  const [race, setRace] = useState(initialData?.race || 'Human');
  const [characterClass, setCharacterClass] = useState(initialData?.character_class || 'Fighter');
  const [level, setLevel] = useState(initialData?.character_level || 1);
  const [xp, setXp] = useState(initialData?.experience_points || 0);
  const [background, setBackground] = useState(initialData?.background || 'Soldier');
  const [alignment, setAlignment] = useState(initialData?.alignment || 'Neutral Good');

  // Stats
  const [strength, setStrength] = useState(initialData?.stats.strength || 15);
  const [dexterity, setDexterity] = useState(initialData?.stats.dexterity || 14);
  const [constitution, setConstitution] = useState(initialData?.stats.constitution || 13);
  const [intelligence, setIntelligence] = useState(initialData?.stats.intelligence || 10);
  const [wisdom, setWisdom] = useState(initialData?.stats.wisdom || 12);
  const [charisma, setCharisma] = useState(initialData?.stats.charisma || 8);
  const [maxHp, setMaxHp] = useState(initialData?.stats.max_hp || 12);
  const [armorClass, setArmorClass] = useState(initialData?.stats.armor_class || 14);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state when initialData or isOpen changes
  useEffect(() => {
    if (initialData) {
      setCharacterName(initialData.character_name);
      setRace(initialData.race);
      setCharacterClass(initialData.character_class);
      setLevel(initialData.character_level);
      setXp(initialData.experience_points);
      setBackground(initialData.background || 'Soldier');
      setAlignment(initialData.alignment || 'Neutral Good');
      setStrength(initialData.stats.strength);
      setDexterity(initialData.stats.dexterity);
      setConstitution(initialData.stats.constitution);
      setIntelligence(initialData.stats.intelligence);
      setWisdom(initialData.stats.wisdom);
      setCharisma(initialData.stats.charisma);
      setMaxHp(initialData.stats.max_hp);
      setArmorClass(initialData.stats.armor_class);
    } else {
      setCharacterName('');
      setRace('Human');
      setCharacterClass('Fighter');
      setLevel(1);
      setXp(0);
      setBackground('Soldier');
      setAlignment('Neutral Good');
      setStrength(15);
      setDexterity(14);
      setConstitution(13);
      setIntelligence(10);
      setWisdom(12);
      setCharisma(8);
      setMaxHp(12);
      setArmorClass(14);
    }
    setErrorMsg('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!characterName.trim()) {
      setErrorMsg('Nama karakter tidak boleh kosong');
      return;
    }

    setLoading(true);
    const payload: CreateCharacterInput = {
      character_name: characterName.trim(),
      race,
      character_class: characterClass,
      character_level: Number(level),
      experience_points: Number(xp),
      background,
      alignment,
      stats: {
        strength: Number(strength),
        dexterity: Number(dexterity),
        constitution: Number(constitution),
        intelligence: Number(intelligence),
        wisdom: Number(wisdom),
        charisma: Number(charisma),
        max_hp: Number(maxHp),
        current_hp: Number(maxHp),
        armor_class: Number(armorClass),
      },
    };

    const success = await onSubmit(payload);
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  const raceOptions = ['Human', 'Elf', 'Wood Elf', 'High Elf', 'Dwarf', 'Mountain Dwarf', 'Hill Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Tiefling', 'Half-Orc'];
  const classOptions = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];
  const alignmentOptions = [
    'Lawful Good', 'Neutral Good', 'Chaotic Good',
    'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
    'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-stone-300 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-stone-200 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center text-red-800">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900 font-serif">
                {initialData ? 'Edit Karakter' : 'Create a Character'}
              </h2>
              <p className="text-xs text-stone-500">
                Data disimpan dalam tabel relasional <code className="text-red-700 font-bold">characters</code> &amp; <code className="text-red-700 font-bold">character_stats</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="m-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Identity Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-200 pb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-600" /> Informasi Karakter
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Nama Karakter <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Asger Stormcaller"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded text-stone-900 font-medium focus:border-stone-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Ras (Race)</label>
                <select
                  value={race}
                  onChange={(e) => setRace(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded text-stone-900 font-medium focus:border-stone-600 focus:outline-none"
                >
                  {raceOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Class</label>
                <select
                  value={characterClass}
                  onChange={(e) => setCharacterClass(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded text-stone-900 font-medium focus:border-stone-600 focus:outline-none"
                >
                  {classOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Alignment</label>
                <select
                  value={alignment}
                  onChange={(e) => setAlignment(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded text-stone-900 font-medium focus:border-stone-600 focus:outline-none"
                >
                  {alignmentOptions.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Background</label>
                <input
                  type="text"
                  placeholder="Contoh: Sage, Soldier, Acolyte"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded text-stone-900 font-medium focus:border-stone-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Level (1-20)</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={level}
                    onChange={(e) => setLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded text-stone-900 font-medium focus:border-stone-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">XP</label>
                  <input
                    type="number"
                    min={0}
                    value={xp}
                    onChange={(e) => setXp(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded text-stone-900 font-medium focus:border-stone-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ability Scores & Combat Section */}
          <div className="space-y-3 pt-3 border-t border-stone-200">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              Ability Scores (1-30)
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {[
                { label: 'STR', val: strength, set: setStrength },
                { label: 'DEX', val: dexterity, set: setDexterity },
                { label: 'CON', val: constitution, set: setConstitution },
                { label: 'INT', val: intelligence, set: setIntelligence },
                { label: 'WIS', val: wisdom, set: setWisdom },
                { label: 'CHA', val: charisma, set: setCharisma },
              ].map((stat) => (
                <div key={stat.label} className="p-2.5 bg-stone-50 rounded-lg border border-stone-300 text-center">
                  <span className="block text-[10px] font-black text-stone-500 uppercase">{stat.label}</span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={stat.val}
                    onChange={(e) => stat.set(Number(e.target.value))}
                    className="w-full text-center text-lg font-bold bg-transparent text-stone-900 focus:outline-none"
                  />
                  <span className="text-[10px] font-bold text-red-700 font-mono">
                    {Math.floor((stat.val - 10) / 2) >= 0 ? `+${Math.floor((stat.val - 10) / 2)}` : Math.floor((stat.val - 10) / 2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Max Hit Points (HP)</label>
                <input
                  type="number"
                  min={1}
                  value={maxHp}
                  onChange={(e) => setMaxHp(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded text-stone-900 font-medium focus:border-stone-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Armor Class (AC)</label>
                <input
                  type="number"
                  min={0}
                  value={armorClass}
                  onChange={(e) => setArmorClass(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded text-stone-900 font-medium focus:border-stone-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded text-xs font-bold uppercase tracking-wider bg-stone-900 text-white hover:bg-stone-800 transition-all shadow disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : initialData ? 'Update Character' : 'Save Character'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
