import React, { useState } from 'react';
import { Search, Plus, User } from 'lucide-react';
import { Character } from '../types/index.ts';

interface CharacterListViewProps {
  characters: Character[];
  onSelectCharacter: (id: number) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (char: Character) => void;
  onDeleteCharacter: (id: number) => void;
  onDuplicateCharacter?: (id: number) => void;
}

export const CharacterListView: React.FC<CharacterListViewProps> = ({
  characters,
  onSelectCharacter,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteCharacter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'oldest' | 'newest' | 'name' | 'level'>('oldest');

  // Filter & Sort
  const filtered = characters
    .filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        c.character_name.toLowerCase().includes(q) ||
        c.race.toLowerCase().includes(q) ||
        c.character_class.toLowerCase().includes(q) ||
        (c.background && c.background.toLowerCase().includes(q)) ||
        (c.alignment && c.alignment.toLowerCase().includes(q)) ||
        c.character_id.toString() === q
      );
    })
    .sort((a, b) => {
      if (sortBy === 'oldest') return a.character_id - b.character_id;
      if (sortBy === 'newest') return b.character_id - a.character_id;
      if (sortBy === 'name') return a.character_name.localeCompare(b.character_name);
      if (sortBy === 'level') return b.character_level - a.character_level;
      return 0;
    });

  // Avatar generator color based on class
  const getClassColor = (cClass: string) => {
    switch (cClass.toLowerCase()) {
      case 'wizard':
      case 'sorcerer':
        return 'from-indigo-600 to-purple-800';
      case 'rogue':
        return 'from-stone-700 to-stone-900';
      case 'cleric':
      case 'paladin':
        return 'from-amber-600 to-yellow-700';
      case 'fighter':
      case 'barbarian':
        return 'from-red-700 to-amber-900';
      case 'ranger':
      case 'druid':
        return 'from-emerald-700 to-green-900';
      case 'warlock':
        return 'from-purple-900 to-violet-950';
      default:
        return 'from-stone-600 to-stone-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Header - Matching Screenshot 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight font-serif">
            My Characters
          </h1>
          <p className="text-base text-stone-600 font-medium mt-1">
            Slots: <span className="text-sky-600 font-bold">{characters.length}/6 Used</span>
          </p>
        </div>

        <div>
          <button
            onClick={onOpenCreateModal}
            className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm tracking-wider uppercase rounded shadow hover:shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> CREATE A CHARACTER
          </button>
        </div>
      </div>

      {/* Filter and Search Bar - Matching Screenshot 2 */}
      <div className="p-4 bg-white rounded-lg border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
            Search
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Name, Level, Class, Species, or Campaign"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded text-stone-800 text-sm focus:outline-none focus:border-stone-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Sort */}
        <div className="w-full sm:w-56">
          <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded text-stone-800 text-sm focus:outline-none focus:border-stone-500 focus:bg-white"
          >
            <option value="oldest">Created: Oldest</option>
            <option value="newest">Created: Newest</option>
            <option value="name">Name: A-Z</option>
            <option value="level">Level: High to Low</option>
          </select>
        </div>
      </div>

      {/* Characters Cards Grid - Matching Screenshot 2 */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-stone-300 p-8">
          <User className="w-12 h-12 text-stone-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-lg font-bold text-stone-800">Tidak ada karakter yang cocok</h3>
          <p className="text-sm text-stone-500 max-w-md mx-auto mt-1 mb-4">
            Coba ubah kata kunci pencarian atau buat karakter baru.
          </p>
          <button
            onClick={onOpenCreateModal}
            className="px-5 py-2 bg-stone-900 text-white rounded text-sm font-semibold hover:bg-stone-800"
          >
            Buat Karakter Baru
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((char) => {
            const classGradient = getClassColor(char.character_class);
            return (
              <div
                key={char.character_id}
                className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                {/* Card Banner & Avatar Header */}
                <div
                  onClick={() => onSelectCharacter(char.character_id)}
                  className="p-5 bg-gradient-to-r from-stone-900 to-stone-800 text-white cursor-pointer group relative overflow-hidden"
                >
                  <div className="flex items-center gap-4 relative z-10">
                    {/* Character Avatar Icon */}
                    <div
                      className={`w-14 h-14 rounded-lg bg-gradient-to-br ${classGradient} flex items-center justify-center border-2 border-stone-400 shadow-inner shrink-0 group-hover:scale-105 transition-transform`}
                    >
                      <span className="font-serif font-black text-xl text-white">
                        {char.character_name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div className="truncate">
                      <h3 className="text-lg font-bold text-white font-serif truncate group-hover:text-amber-300 transition-colors">
                        {char.character_name}
                      </h3>
                      <p className="text-xs text-stone-300 mt-0.5 truncate">
                        Level {char.character_level} | {char.race} | {char.character_class}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Action Bar - Matching Screenshot 2: VIEW, EDIT, SHEET, DELETE */}
                <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50/80 px-4 py-2.5 text-xs font-bold tracking-wider">
                  <button
                    type="button"
                    onClick={() => onSelectCharacter(char.character_id)}
                    className="text-stone-700 hover:text-stone-950 uppercase transition-colors cursor-pointer"
                  >
                    VIEW
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenEditModal(char)}
                    className="text-stone-700 hover:text-stone-950 uppercase transition-colors cursor-pointer"
                  >
                    EDIT
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectCharacter(char.character_id)}
                    className="text-stone-700 hover:text-stone-950 uppercase transition-colors cursor-pointer"
                  >
                    SHEET
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteCharacter(char.character_id)}
                    aria-label={`Delete ${char.character_name}`}
                    className="text-red-700 hover:text-red-900 font-extrabold uppercase transition-colors cursor-pointer"
                  >
                    DELETE
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
