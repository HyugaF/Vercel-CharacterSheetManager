import React from 'react';
import { Plus, RotateCcw, Users } from 'lucide-react';

interface NavbarProps {
  onBackToList: () => void;
  onOpenCreateModal: () => void;
  onResetDatabase: () => void;
  currentView: 'list' | 'sheet';
}

export const Navbar: React.FC<NavbarProps> = ({
  onBackToList,
  onOpenCreateModal,
  onResetDatabase,
  currentView,
}) => {
  return (
    <header className="bg-stone-900 border-b border-stone-800 text-stone-100 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <div
              onClick={onBackToList}
              className="cursor-pointer group"
            >
              <h1 className="text-lg font-bold tracking-tight text-white font-serif group-hover:text-amber-300 transition-colors">
                Tabletop Player Sheet Manager
              </h1>
              <p className="text-[11px] text-stone-400">
                Relational TTRPG Character Sheet Engine
              </p>
            </div>

            {/* Quick Link to My Characters */}
            <button
              onClick={onBackToList}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentView === 'list'
                  ? 'bg-stone-800 text-white'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> My Characters
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onResetDatabase}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors border border-stone-800"
              title="Reset seluruh tabel database ke data awal bawaan"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
              <span className="hidden md:inline">Reset DB</span>
            </button>

            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded font-bold text-xs tracking-wider uppercase bg-stone-100 hover:bg-white text-stone-900 shadow hover:shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Character</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
