import React, { useState } from 'react';
import {
  Heart,
  Zap,
  Sword,
  Backpack,
  Sparkles,
  Camera,
  Trash2,
  Edit3,
  RotateCcw,
  Plus,
  Minus,
  ArrowLeft,
  Flame,
  BookOpen,
  Info,
} from 'lucide-react';
import { CharacterDetail, Spell, InventoryItem, Character } from '../types/index.ts';
import { formatModifier, hitungProficiency, STANDARD_SKILLS } from '../utils/characterRules.ts';

interface CharacterSheetViewProps {
  character: CharacterDetail;
  allCharacters: Character[];
  onSelectCharacter: (id: number) => void;
  onBackToList: () => void;
  onModifyHp: (id: number, delta: number) => Promise<void>;
  onAddXp: (id: number, amount: number) => Promise<void>;
  onResetHp: (id: number) => Promise<void>;
  onOpenEditModal: (char: CharacterDetail) => void;
  onDeleteCharacter: (id: number) => void | Promise<void>;
  onAddInventoryItem: (charId: number, item: { item_name: string; quantity: number; weight: number; description: string }) => Promise<void>;
  onDeleteInventoryItem: (charId: number, itemId: number) => Promise<void>;
  onAssignSpell: (charId: number, spellId: number, isPrepared: boolean, notes: string) => Promise<void>;
  onToggleSpellPrepared: (charId: number, spellId: number, isPrepared: boolean) => Promise<void>;
  onDeleteSpell: (charId: number, spellId: number) => Promise<void>;
  onCreateSave: (charId: number, saveName: string) => Promise<void>;
  onRestoreSave: (charId: number, saveId: number) => void | Promise<void>;
  masterSpells: Spell[];
  saves: any[];
}

export const CharacterSheetView: React.FC<CharacterSheetViewProps> = ({
  character,
  allCharacters,
  onSelectCharacter,
  onBackToList,
  onModifyHp,
  onAddXp,
  onResetHp,
  onOpenEditModal,
  onDeleteCharacter,
  onAddInventoryItem,
  onDeleteInventoryItem,
  onAssignSpell,
  onToggleSpellPrepared,
  onDeleteSpell,
  onCreateSave,
  onRestoreSave,
  masterSpells,
  saves,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'actions' | 'spells' | 'inventory' | 'saves' | 'xp'>('actions');
  const [actionSubTab, setActionSubTab] = useState<'all' | 'attack' | 'action' | 'bonus' | 'reaction'>('all');

  // HP Modals & Inputs
  const [hpInput, setHpInput] = useState<number>(5);
  const [showHpDialog, setShowHpDialog] = useState<'heal' | 'damage' | null>(null);

  // Inventory Form
  const [showItemForm, setShowItemForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemWeight, setNewItemWeight] = useState(1.0);
  const [newItemDesc, setNewItemDesc] = useState('');

  // Spell Form
  const [showSpellForm, setShowSpellForm] = useState(false);
  const [selectedSpellId, setSelectedSpellId] = useState<number>(masterSpells[0]?.spell_id || 1);
  const [spellPrepared, setSpellPrepared] = useState(false);
  const [spellNotes, setSpellNotes] = useState('');

  // Save Form
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState('');

  // XP Add
  const [xpAmount, setXpAmount] = useState(300);

  // Proficiency Bonus based on level
  const profBonus = hitungProficiency(character.character_level);
  const dexMod = character.modifiers.dexterity;
  const initiative = formatModifier(dexMod);

  // Passive senses
  const wisMod = character.modifiers.wisdom;
  const intMod = character.modifiers.intelligence;
  const passivePerception = 10 + wisMod;
  const passiveInvestigation = 10 + intMod;
  const passiveInsight = 10 + wisMod;

  // Unlearned spells
  const unlearnedSpells = masterSpells.filter(
    (ms) => !character.spells.some((cs) => cs.spell_id === ms.spell_id)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-stone-900 pb-16">
      {/* Top Breadcrumb & Switcher - Matching Screenshot 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900 text-stone-100 p-3.5 rounded-xl shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToList}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-lg transition-colors border border-stone-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All Characters
          </button>

          {/* Character Quick Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 font-medium hidden md:inline">Switch:</span>
            <select
              value={character.character_id}
              onChange={(e) => onSelectCharacter(Number(e.target.value))}
              className="bg-stone-800 border border-stone-700 text-stone-100 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500 font-medium"
            >
              {allCharacters.map((c) => (
                <option key={c.character_id} value={c.character_id}>
                  {c.character_name} (Lvl {c.character_level} {c.character_class})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onResetHp(character.character_id)}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-300 rounded-lg border border-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset HP to Max (Long Rest)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-400" /> Long Rest (Full HP)
          </button>
          <button
            type="button"
            onClick={() => onOpenEditModal(character)}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 rounded-lg border border-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            type="button"
            onClick={() => onDeleteCharacter(character.character_id)}
            aria-label={`Delete ${character.character_name}`}
            className="px-3 py-1.5 bg-red-900/80 hover:bg-red-800 text-xs font-bold text-white rounded-lg border border-red-700/60 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* Character Profile Header - Matching Screenshot 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-700 to-amber-900 text-white font-serif font-black text-2xl flex items-center justify-center border-2 border-stone-300 shadow">
            {character.character_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-serif tracking-tight">
                {character.character_name}
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                Level {character.character_level}
              </span>
            </div>
            <p className="text-sm font-semibold text-stone-600 mt-0.5">
              {character.race} {character.character_class} • {character.alignment || 'Neutral'} • {character.background || 'Adventurer'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm text-stone-600 font-medium">
          <div>
            <span className="block text-[11px] text-stone-400 font-bold uppercase">Experience Points</span>
            <span className="font-bold text-stone-900">{character.experience_points} / {character.next_level_xp} XP</span>
          </div>
          <div>
            <span className="block text-[11px] text-stone-400 font-bold uppercase">Speed</span>
            <span className="font-bold text-stone-900">30 ft.</span>
          </div>
          <div>
            <span className="block text-[11px] text-stone-400 font-bold uppercase">Proficiency</span>
            <span className="font-bold text-red-700 font-mono">+{profBonus}</span>
          </div>
        </div>
      </div>

      {/* Top Ability Score Blocks Row - Matching Screenshot 1 Ornate Red Borders */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-11 gap-3">
        {/* 6 Ability Scores */}
        {[
          { code: 'STR', label: 'STRENGTH', mod: character.modifiers.strength, score: character.stats.strength },
          { code: 'DEX', label: 'DEXTERITY', mod: character.modifiers.dexterity, score: character.stats.dexterity },
          { code: 'CON', label: 'CONSTITUTION', mod: character.modifiers.constitution, score: character.stats.constitution },
          { code: 'INT', label: 'INTELLIGENCE', mod: character.modifiers.intelligence, score: character.stats.intelligence },
          { code: 'WIS', label: 'WISDOM', mod: character.modifiers.wisdom, score: character.stats.wisdom },
          { code: 'CHA', label: 'CHARISMA', mod: character.modifiers.charisma, score: character.stats.charisma },
        ].map((stat) => (
          <div
            key={stat.code}
            className="bg-white rounded-xl border-2 border-red-700/80 p-2 text-center shadow-sm relative flex flex-col justify-between"
          >
            <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider block">
              {stat.label}
            </span>
            <span className="text-2xl font-black text-stone-900 font-serif my-1 block">
              {formatModifier(stat.mod)}
            </span>
            <div className="inline-block mx-auto px-2 py-0.5 rounded-full bg-stone-100 border border-stone-300 text-xs font-bold text-stone-700">
              {stat.score}
            </div>
          </div>
        ))}

        {/* Proficiency Bonus */}
        <div className="bg-white rounded-xl border-2 border-red-700/80 p-2 text-center shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider block">
            PROFICIENCY
          </span>
          <span className="text-2xl font-black text-stone-900 font-serif my-1 block">
            +{profBonus}
          </span>
          <span className="text-[10px] font-bold text-stone-500 uppercase">BONUS</span>
        </div>

        {/* Speed */}
        <div className="bg-white rounded-xl border-2 border-red-700/80 p-2 text-center shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider block">
            WALKING
          </span>
          <span className="text-2xl font-black text-stone-900 font-serif my-1 block">
            30 <span className="text-xs font-sans">ft.</span>
          </span>
          <span className="text-[10px] font-bold text-stone-500 uppercase">SPEED</span>
        </div>

        {/* Initiative */}
        <div className="bg-white rounded-xl border-2 border-red-700/80 p-2 text-center shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider block">
            INITIATIVE
          </span>
          <span className="text-2xl font-black text-stone-900 font-serif my-1 block">
            {initiative}
          </span>
          <span className="text-[10px] font-bold text-stone-500 uppercase">DEX MOD</span>
        </div>

        {/* Armor Class Shield */}
        <div className="bg-white rounded-xl border-2 border-red-700/80 p-2 text-center shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider block">
            ARMOR
          </span>
          <span className="text-2xl font-black text-stone-900 font-serif my-1 block">
            {character.stats.armor_class}
          </span>
          <span className="text-[10px] font-bold text-stone-500 uppercase">CLASS</span>
        </div>

        {/* Hit Points Box - Matching Screenshot 1 with HEAL & DAMAGE controls */}
        <div className="col-span-2 sm:col-span-3 lg:col-span-2 bg-white rounded-xl border-2 border-red-700/80 p-2.5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">
              HIT POINTS
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHpDialog('heal')}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
              >
                HEAL
              </button>
              <button
                onClick={() => setShowHpDialog('damage')}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-300 hover:bg-red-100"
              >
                DAMAGE
              </button>
            </div>
          </div>

          <div className="flex items-baseline justify-center gap-1.5 my-1">
            <span className="text-2xl font-black text-stone-900 font-serif">
              {character.stats.current_hp}
            </span>
            <span className="text-stone-400 font-bold">/</span>
            <span className="text-base font-bold text-stone-600">
              {character.stats.max_hp}
            </span>
          </div>

          {/* Quick HP Bar */}
          <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                character.stats.current_hp / character.stats.max_hp > 0.5
                  ? 'bg-emerald-500'
                  : character.stats.current_hp / character.stats.max_hp > 0.25
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{
                width: `${Math.min(100, Math.max(0, (character.stats.current_hp / character.stats.max_hp) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* HP Heal / Damage Quick Modal */}
      {showHpDialog && (
        <div className="p-4 bg-white rounded-xl border-2 border-red-600 shadow-lg flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${showHpDialog === 'heal' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
              {showHpDialog === 'heal' ? 'Heal Character' : 'Apply Damage'}
            </span>
            <input
              type="number"
              min={1}
              value={hpInput}
              onChange={(e) => setHpInput(Number(e.target.value))}
              className="w-20 px-2 py-1 border border-stone-300 rounded text-center font-bold text-sm"
            />
            <span className="text-xs text-stone-500">Hit Points</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                const delta = showHpDialog === 'heal' ? Math.abs(hpInput) : -Math.abs(hpInput);
                await onModifyHp(character.character_id, delta);
                setShowHpDialog(null);
              }}
              className={`px-4 py-1.5 rounded text-xs font-bold text-white ${showHpDialog === 'heal' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              Konfirmasi {showHpDialog === 'heal' ? '+Heal' : '-Damage'}
            </button>
            <button
              onClick={() => setShowHpDialog(null)}
              className="px-3 py-1.5 rounded text-xs font-semibold text-stone-600 hover:bg-stone-100"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Main Sheet 3-Column Layout - Matching Screenshot 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Column 1: Saving Throws, Senses, Proficiencies (3 Cols) */}
        <div className="lg:col-span-3 space-y-5">
          {/* 1. SAVING THROWS */}
          <div className="bg-white rounded-xl border-2 border-red-700/80 p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-stone-800 uppercase tracking-wider text-center border-b border-stone-200 pb-2">
              Saving Throws
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              {[
                { name: 'STR', mod: character.modifiers.strength },
                { name: 'DEX', mod: character.modifiers.dexterity },
                { name: 'CON', mod: character.modifiers.constitution },
                { name: 'INT', mod: character.modifiers.intelligence },
                { name: 'WIS', mod: character.modifiers.wisdom },
                { name: 'CHA', mod: character.modifiers.charisma },
              ].map((st) => (
                <div key={st.name} className="flex items-center justify-between p-1.5 bg-stone-50 rounded border border-stone-200">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full border border-stone-400 bg-white inline-block" />
                    <span className="text-stone-700">{st.name}</span>
                  </div>
                  <span className="font-mono font-bold text-stone-900">{formatModifier(st.mod)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. PASSIVE SENSES */}
          <div className="bg-white rounded-xl border-2 border-red-700/80 p-4 shadow-sm space-y-2.5">
            <h3 className="text-xs font-black text-stone-800 uppercase tracking-wider text-center border-b border-stone-200 pb-2">
              Senses
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-1.5 bg-stone-50 rounded border border-stone-200">
                <span className="text-stone-600 font-medium">Passive Perception</span>
                <span className="font-mono font-bold text-stone-900 px-2 py-0.5 bg-white border border-stone-300 rounded">
                  {passivePerception}
                </span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-stone-50 rounded border border-stone-200">
                <span className="text-stone-600 font-medium">Passive Investigation</span>
                <span className="font-mono font-bold text-stone-900 px-2 py-0.5 bg-white border border-stone-300 rounded">
                  {passiveInvestigation}
                </span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-stone-50 rounded border border-stone-200">
                <span className="text-stone-600 font-medium">Passive Insight</span>
                <span className="font-mono font-bold text-stone-900 px-2 py-0.5 bg-white border border-stone-300 rounded">
                  {passiveInsight}
                </span>
              </div>
            </div>
          </div>

          {/* 3. PROFICIENCIES & TRAINING */}
          <div className="bg-white rounded-xl border-2 border-red-700/80 p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-stone-800 uppercase tracking-wider text-center border-b border-stone-200 pb-2">
              Proficiencies &amp; Training
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="block text-[11px] font-bold text-stone-500 uppercase">Armor</span>
                <p className="text-stone-800 font-medium">Light Armor, Simple Shields</p>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-stone-500 uppercase">Weapons</span>
                <p className="text-stone-800 font-medium">Simple Weapons, Martial Weapons</p>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-stone-500 uppercase">Languages</span>
                <p className="text-stone-800 font-medium">Common, Elvish, Dwarvish</p>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: 18 Skills List (3.5 Cols) - Matching Screenshot 1 */}
        <div className="lg:col-span-4 bg-white rounded-xl border-2 border-red-700/80 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <h3 className="text-xs font-black text-stone-800 uppercase tracking-wider">
              Skills (18 Skills)
            </h3>
            <span className="text-[10px] font-bold text-stone-500 uppercase">Bonus</span>
          </div>

          <div className="space-y-1 max-h-[620px] overflow-y-auto pr-1 text-xs">
            {STANDARD_SKILLS.map((skill) => {
              const abilityKey =
                skill.ability === 'STR'
                  ? 'strength'
                  : skill.ability === 'DEX'
                  ? 'dexterity'
                  : skill.ability === 'CON'
                  ? 'constitution'
                  : skill.ability === 'INT'
                  ? 'intelligence'
                  : skill.ability === 'WIS'
                  ? 'wisdom'
                  : 'charisma';
              const baseMod = character.modifiers[abilityKey];
              const isProf = skill.defaultProfClasses.some((c) =>
                character.character_class.toLowerCase().includes(c.toLowerCase())
              );
              const totalBonus = isProf ? baseMod + profBonus : baseMod;

              return (
                <div
                  key={skill.name}
                  className="flex items-center justify-between py-1 px-1.5 hover:bg-stone-50 rounded transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full inline-block ${
                        isProf ? 'bg-stone-900 border border-stone-900' : 'bg-white border border-stone-400'
                      }`}
                    />
                    <span className="text-[10px] font-mono text-stone-500 font-bold uppercase w-7">
                      {skill.ability}
                    </span>
                    <span className="font-semibold text-stone-800">{skill.name}</span>
                  </div>

                  <span className="font-mono font-bold text-stone-900 px-2 py-0.5 rounded bg-stone-100 border border-stone-300 text-xs">
                    {formatModifier(totalBonus)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: Main Action, Spells, Inventory & Saves Panel (5.5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border-2 border-red-700/80 overflow-hidden shadow-sm flex flex-col justify-between">
          {/* Tabs Bar - Matching Screenshot 1 */}
          <div className="flex border-b border-stone-200 bg-stone-50 px-2 pt-2 gap-1 overflow-x-auto text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => setActiveMainTab('actions')}
              className={`px-3 py-2 border-b-2 transition-all ${
                activeMainTab === 'actions'
                  ? 'border-red-700 text-red-700 bg-white rounded-t'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              Actions
            </button>
            <button
              onClick={() => setActiveMainTab('spells')}
              className={`px-3 py-2 border-b-2 transition-all ${
                activeMainTab === 'spells'
                  ? 'border-red-700 text-red-700 bg-white rounded-t'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              Spells ({character.spells.length})
            </button>
            <button
              onClick={() => setActiveMainTab('inventory')}
              className={`px-3 py-2 border-b-2 transition-all ${
                activeMainTab === 'inventory'
                  ? 'border-red-700 text-red-700 bg-white rounded-t'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              Inventory ({character.inventory.length})
            </button>
            <button
              onClick={() => setActiveMainTab('saves')}
              className={`px-3 py-2 border-b-2 transition-all ${
                activeMainTab === 'saves'
                  ? 'border-red-700 text-red-700 bg-white rounded-t'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              Snapshots ({saves.length})
            </button>
            <button
              onClick={() => setActiveMainTab('xp')}
              className={`px-3 py-2 border-b-2 transition-all ${
                activeMainTab === 'xp'
                  ? 'border-red-700 text-red-700 bg-white rounded-t'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              XP &amp; Level
            </button>
          </div>

          <div className="p-4 space-y-4 min-h-[500px]">
            {/* 1. ACTIONS TAB */}
            {activeMainTab === 'actions' && (
              <div className="space-y-4">
                {/* Subtabs - Matching Screenshot 1: ALL, ATTACK, ACTION, BONUS ACTION, REACTION */}
                <div className="flex items-center gap-1.5 pb-2 border-b border-stone-200 text-[11px] font-bold uppercase">
                  {(['all', 'attack', 'action', 'bonus', 'reaction'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setActionSubTab(st)}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        actionSubTab === st
                          ? 'bg-red-700 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Weapons & Attacks Table - Matching Screenshot 1 */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-stone-700 uppercase tracking-wider">
                    Serangan &amp; Kemampuan Pertarungan
                  </h4>

                  <div className="divide-y divide-stone-200 border border-stone-200 rounded-lg overflow-hidden text-xs">
                    {/* Attack 1 */}
                    <div className="p-3 bg-white flex items-center justify-between hover:bg-stone-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <Sword className="w-4 h-4 text-stone-700" />
                          <span className="font-bold text-stone-900">Dagger</span>
                          <span className="text-[10px] text-stone-500 font-semibold">(Simple Weapon)</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">Range: 20/60 ft. • Finesse, Light, Thrown</p>
                      </div>
                      <div className="flex items-center gap-2 text-right">
                        <span className="px-2 py-0.5 bg-stone-100 border border-stone-300 rounded font-mono font-bold text-stone-800">
                          +{dexMod + profBonus}
                        </span>
                        <span className="px-2 py-0.5 bg-stone-100 border border-stone-300 rounded font-mono font-bold text-stone-800">
                          1d4+{dexMod}
                        </span>
                      </div>
                    </div>

                    {/* Attack 2 */}
                    <div className="p-3 bg-white flex items-center justify-between hover:bg-stone-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <Flame className="w-4 h-4 text-amber-600" />
                          <span className="font-bold text-stone-900">Cantrip: Fire Bolt</span>
                          <span className="text-[10px] text-stone-500 font-semibold">(Evocation)</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">Range: 120 ft. • 1 Action</p>
                      </div>
                      <div className="flex items-center gap-2 text-right">
                        <span className="px-2 py-0.5 bg-stone-100 border border-stone-300 rounded font-mono font-bold text-stone-800">
                          +{intMod + profBonus}
                        </span>
                        <span className="px-2 py-0.5 bg-stone-100 border border-stone-300 rounded font-mono font-bold text-stone-800">
                          1d10 Fire
                        </span>
                      </div>
                    </div>

                    {/* Attack 3 */}
                    <div className="p-3 bg-white flex items-center justify-between hover:bg-stone-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <Sword className="w-4 h-4 text-stone-700" />
                          <span className="font-bold text-stone-900">Unarmed Strike</span>
                          <span className="text-[10px] text-stone-500 font-semibold">(Melee)</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">Reach: 5 ft. • Bludgeoning</p>
                      </div>
                      <div className="flex items-center gap-2 text-right">
                        <span className="px-2 py-0.5 bg-stone-100 border border-stone-300 rounded font-mono font-bold text-stone-800">
                          +{character.modifiers.strength + profBonus}
                        </span>
                        <span className="px-2 py-0.5 bg-stone-100 border border-stone-300 rounded font-mono font-bold text-stone-800">
                          1+{character.modifiers.strength}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Standard Combat Actions info */}
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs text-stone-600 space-y-1">
                  <h5 className="font-bold text-stone-800 uppercase text-[11px]">Actions in Combat</h5>
                  <p className="text-[11px] leading-relaxed">
                    Attack, Dash, Disengage, Dodge, Grapple, Help, Hide, Improvise, Influence, Magic/Cast Spell, Ready, Search, Shove, Study, Utilize.
                  </p>
                </div>
              </div>
            )}

            {/* 2. SPELLS TAB */}
            {activeMainTab === 'spells' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-stone-800 uppercase tracking-wider">
                    Spellbook Karakter (Tabel Pivot M:N)
                  </h4>
                  <button
                    onClick={() => setShowSpellForm(!showSpellForm)}
                    className="flex items-center gap-1 px-3 py-1 bg-red-700 text-white rounded text-xs font-bold hover:bg-red-800"
                  >
                    <Plus className="w-3.5 h-3.5" /> Pelajari Spell
                  </button>
                </div>

                {showSpellForm && (
                  <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-300 space-y-3 text-xs">
                    <h5 className="font-bold text-stone-800 uppercase text-[11px]">Pilih Dari Library Master Spells</h5>
                    {unlearnedSpells.length === 0 ? (
                      <p className="text-stone-500">Semua spell master telah dipelajari karakter ini.</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-stone-500 mb-0.5">Spell Master</label>
                            <select
                              value={selectedSpellId}
                              onChange={(e) => setSelectedSpellId(Number(e.target.value))}
                              className="w-full p-1.5 border border-stone-300 rounded bg-white"
                            >
                              {unlearnedSpells.map((s) => (
                                <option key={s.spell_id} value={s.spell_id}>
                                  {s.spell_name} (Lvl {s.spell_level} • {s.school})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-stone-500 mb-0.5">Catatan Mantra</label>
                            <input
                              type="text"
                              placeholder="Misal: Prepared utama"
                              value={spellNotes}
                              onChange={(e) => setSpellNotes(e.target.value)}
                              className="w-full p-1.5 border border-stone-300 rounded bg-white"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="prepChkBx"
                            checked={spellPrepared}
                            onChange={(e) => setSpellPrepared(e.target.checked)}
                          />
                          <label htmlFor="prepChkBx" className="text-stone-700 font-medium">
                            Tandai sebagai Prepared Spell
                          </label>
                        </div>

                        <button
                          onClick={async () => {
                            await onAssignSpell(character.character_id, selectedSpellId, spellPrepared, spellNotes);
                            setSpellNotes('');
                            setShowSpellForm(false);
                          }}
                          className="px-4 py-1.5 bg-stone-900 text-white rounded text-xs font-bold"
                        >
                          Daftarkan ke Spellbook
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Spell List */}
                {character.spells.length === 0 ? (
                  <p className="text-center py-10 text-stone-400 text-xs">Belum ada spell di spellbook karakter.</p>
                ) : (
                  <div className="space-y-2">
                    {character.spells.map((cs) => (
                      <div
                        key={cs.spell_id}
                        className={`p-3 rounded-lg border transition-colors ${
                          cs.is_prepared ? 'bg-red-50/50 border-red-300' : 'bg-white border-stone-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-stone-900 text-xs">{cs.spell.spell_name}</h5>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 font-bold text-stone-600">
                                {cs.spell.spell_level === 0 ? 'Cantrip' : `Level ${cs.spell.spell_level}`}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 mt-0.5">
                              {cs.spell.school} • {cs.spell.casting_time} • {cs.spell.range_text}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onToggleSpellPrepared(character.character_id, cs.spell_id, !cs.is_prepared)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                cs.is_prepared
                                  ? 'bg-red-700 text-white border-red-700'
                                  : 'bg-stone-100 text-stone-600 border-stone-300'
                              }`}
                            >
                              {cs.is_prepared ? 'Prepared' : 'Prepare'}
                            </button>
                            <button
                              onClick={() => onDeleteSpell(character.character_id, cs.spell_id)}
                              className="p-1 text-stone-400 hover:text-red-700"
                              title="Hapus spell"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-stone-600 mt-1.5 line-clamp-2">{cs.spell.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. INVENTORY TAB */}
            {activeMainTab === 'inventory' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-stone-800 uppercase tracking-wider">
                      Inventory Perlengkapan (Tabel 1:M)
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Total Beban: <strong className="text-stone-900">{character.total_weight} lbs</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowItemForm(!showItemForm)}
                    className="flex items-center gap-1 px-3 py-1 bg-stone-900 text-white rounded text-xs font-bold hover:bg-stone-800"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Item
                  </button>
                </div>

                {showItemForm && (
                  <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-300 space-y-3 text-xs">
                    <h5 className="font-bold text-stone-800 uppercase text-[11px]">Input Item Baru (tambahInventory)</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-stone-500 mb-0.5">Nama Item *</label>
                        <input
                          type="text"
                          placeholder="Misal: Potion of Healing"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          className="w-full p-1.5 border border-stone-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-500 mb-0.5">Qty</label>
                        <input
                          type="number"
                          min={1}
                          value={newItemQty}
                          onChange={(e) => setNewItemQty(Number(e.target.value))}
                          className="w-full p-1.5 border border-stone-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-500 mb-0.5">Berat (lbs)</label>
                        <input
                          type="number"
                          step="0.1"
                          min={0}
                          value={newItemWeight}
                          onChange={(e) => setNewItemWeight(Number(e.target.value))}
                          className="w-full p-1.5 border border-stone-300 rounded bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-500 mb-0.5">Deskripsi</label>
                      <input
                        type="text"
                        placeholder="Kegunaan atau efek item"
                        value={newItemDesc}
                        onChange={(e) => setNewItemDesc(e.target.value)}
                        className="w-full p-1.5 border border-stone-300 rounded bg-white"
                      />
                    </div>
                    <button
                      onClick={async () => {
                        if (!newItemName.trim()) return;
                        await onAddInventoryItem(character.character_id, {
                          item_name: newItemName.trim(),
                          quantity: newItemQty,
                          weight: newItemWeight,
                          description: newItemDesc,
                        });
                        setNewItemName('');
                        setNewItemDesc('');
                        setShowItemForm(false);
                      }}
                      className="px-4 py-1.5 bg-stone-900 text-white rounded text-xs font-bold"
                    >
                      Simpan Item
                    </button>
                  </div>
                )}

                {/* Inventory Table */}
                {character.inventory.length === 0 ? (
                  <p className="text-center py-10 text-stone-400 text-xs">Inventory masih kosong.</p>
                ) : (
                  <div className="border border-stone-200 rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">Item</th>
                          <th className="p-2.5">Qty</th>
                          <th className="p-2.5">Berat</th>
                          <th className="p-2.5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {character.inventory.map((item) => (
                          <tr key={item.item_id} className="hover:bg-stone-50">
                            <td className="p-2.5 font-bold text-stone-900">
                              {item.item_name}
                              {item.description && (
                                <span className="block font-normal text-stone-500 text-[11px] truncate max-w-xs">
                                  {item.description}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 font-semibold text-stone-700">{item.quantity}x</td>
                            <td className="p-2.5 font-mono text-stone-700">
                              {item.weight !== null ? `${(item.weight * item.quantity).toFixed(1)} lbs` : '-'}
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                onClick={() => onDeleteInventoryItem(character.character_id, item.item_id)}
                                className="p-1 text-stone-400 hover:text-red-700"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 4. SAVES / SNAPSHOTS TAB */}
            {activeMainTab === 'saves' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-stone-800 uppercase tracking-wider">
                      Backup Snapshots (simpanData &amp; muatData)
                    </h4>
                    <p className="text-[11px] text-stone-500">Tersimpan dalam tabel JSONB character_saves</p>
                  </div>
                  <button
                    onClick={() => setShowSaveForm(!showSaveForm)}
                    className="flex items-center gap-1 px-3 py-1 bg-red-700 text-white rounded text-xs font-bold hover:bg-red-800"
                  >
                    <Camera className="w-3.5 h-3.5" /> Simpan Snapshot
                  </button>
                </div>

                {showSaveForm && (
                  <div className="p-3 bg-stone-50 rounded border border-stone-300 flex gap-2">
                    <input
                      type="text"
                      placeholder="Nama snapshot (misal: Sebelum Boss Dungeon)"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      className="flex-1 p-1.5 border border-stone-300 rounded text-xs bg-white"
                    />
                    <button
                      onClick={async () => {
                        await onCreateSave(character.character_id, saveName.trim() || 'Manual Snapshot');
                        setSaveName('');
                        setShowSaveForm(false);
                      }}
                      className="px-4 py-1.5 bg-stone-900 text-white rounded text-xs font-bold"
                    >
                      Simpan
                    </button>
                  </div>
                )}

                {saves.length === 0 ? (
                  <p className="text-center py-10 text-stone-400 text-xs">Belum ada snapshot tersimpan.</p>
                ) : (
                  <div className="space-y-2">
                    {saves.map((s) => (
                      <div
                        key={s.save_id}
                        className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between"
                      >
                        <div>
                          <h5 className="font-bold text-stone-900 text-xs">{s.save_name}</h5>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {new Date(s.saved_at).toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={() => onRestoreSave(character.character_id, s.save_id)}
                          className="px-3 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-bold flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Restore
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. XP & LEVEL TAB */}
            {activeMainTab === 'xp' && (
              <div className="space-y-4">
                <h4 className="text-xs font-black text-stone-800 uppercase tracking-wider">
                  Progres Experience Points &amp; Auto Level Up
                </h4>

                <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-700">Level {character.character_level}</span>
                    <span className="font-bold text-red-700">{character.experience_points} / {character.next_level_xp} XP</span>
                  </div>

                  <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-700 transition-all duration-300"
                      style={{ width: `${character.level_progress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-stone-500">
                    {character.level_progress}% menuju Level {character.character_level + 1}
                  </p>
                </div>

                <div className="p-4 bg-white rounded-lg border border-stone-200 flex items-center gap-3">
                  <span className="text-xs font-bold text-stone-800">Tambah XP (tambahXP):</span>
                  <input
                    type="number"
                    min={1}
                    value={xpAmount}
                    onChange={(e) => setXpAmount(Number(e.target.value))}
                    className="w-24 p-1.5 border border-stone-300 rounded text-center text-xs font-bold"
                  />
                  <button
                    onClick={async () => {
                      await onAddXp(character.character_id, xpAmount);
                    }}
                    className="px-4 py-1.5 bg-red-700 text-white rounded text-xs font-bold hover:bg-red-800"
                  >
                    Kirim XP
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
