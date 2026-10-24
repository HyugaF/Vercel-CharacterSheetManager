import React, { useState } from 'react';
import { Database, Key, ArrowRight, Copy, Check, Download, Layers } from 'lucide-react';
import { RAW_DATABASE_SQL } from '../server/exportCollections.ts';

interface TableDefinition {
  name: string;
  type: string;
  description: string;
  columns: {
    name: string;
    type: string;
    key?: 'PK' | 'FK' | 'PK,FK';
    ref?: string;
    constraint?: string;
  }[];
}

const TABLES: TableDefinition[] = [
  {
    name: 'characters',
    type: 'Resource Utama (1)',
    description: 'Menyimpan identitas karakter, ras, class, level (1-20), XP, latar belakang, dan alignment.',
    columns: [
      { name: 'character_id', type: 'BIGINT', key: 'PK', constraint: 'GENERATED ALWAYS AS IDENTITY' },
      { name: 'character_name', type: 'VARCHAR(100)', constraint: 'NOT NULL' },
      { name: 'race', type: 'VARCHAR(50)', constraint: 'NOT NULL' },
      { name: 'character_class', type: 'VARCHAR(50)', constraint: 'NOT NULL' },
      { name: 'character_level', type: 'SMALLINT', constraint: 'DEFAULT 1, CHECK (1..20)' },
      { name: 'experience_points', type: 'INTEGER', constraint: 'DEFAULT 0, CHECK (>= 0)' },
      { name: 'background', type: 'VARCHAR(100)' },
      { name: 'alignment', type: 'VARCHAR(50)' },
      { name: 'created_at', type: 'TIMESTAMPTZ', constraint: 'DEFAULT CURRENT_TIMESTAMP' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', constraint: 'DEFAULT CURRENT_TIMESTAMP' },
    ],
  },
  {
    name: 'character_stats',
    type: 'Relasi 1:1 (CASCADE)',
    description: 'Menyimpan 6 ability scores (STR, DEX, CON, INT, WIS, CHA 1-30), Max HP, Current HP, dan AC.',
    columns: [
      { name: 'character_id', type: 'BIGINT', key: 'PK,FK', ref: 'characters(character_id)', constraint: 'ON DELETE CASCADE' },
      { name: 'strength', type: 'SMALLINT', constraint: 'CHECK (1..30), DEFAULT 10' },
      { name: 'dexterity', type: 'SMALLINT', constraint: 'CHECK (1..30), DEFAULT 10' },
      { name: 'constitution', type: 'SMALLINT', constraint: 'CHECK (1..30), DEFAULT 10' },
      { name: 'intelligence', type: 'SMALLINT', constraint: 'CHECK (1..30), DEFAULT 10' },
      { name: 'wisdom', type: 'SMALLINT', constraint: 'CHECK (1..30), DEFAULT 10' },
      { name: 'charisma', type: 'SMALLINT', constraint: 'CHECK (1..30), DEFAULT 10' },
      { name: 'max_hp', type: 'INTEGER', constraint: 'CHECK (>= 1), DEFAULT 1' },
      { name: 'current_hp', type: 'INTEGER', constraint: 'CHECK (>= 0), CHECK (current_hp <= max_hp)' },
      { name: 'armor_class', type: 'SMALLINT', constraint: 'CHECK (>= 0), DEFAULT 10' },
    ],
  },
  {
    name: 'inventory_items',
    type: 'Relasi 1:M (CASCADE)',
    description: 'Menyimpan item, perlengkapan senjata, armor, ramuan, jumlah (qty > 0), dan berat beban.',
    columns: [
      { name: 'item_id', type: 'BIGINT', key: 'PK', constraint: 'GENERATED ALWAYS AS IDENTITY' },
      { name: 'character_id', type: 'BIGINT', key: 'FK', ref: 'characters(character_id)', constraint: 'ON DELETE CASCADE' },
      { name: 'item_name', type: 'VARCHAR(100)', constraint: 'NOT NULL' },
      { name: 'quantity', type: 'INTEGER', constraint: 'DEFAULT 1, CHECK (> 0)' },
      { name: 'weight', type: 'NUMERIC(8,2)', constraint: 'CHECK (>= 0)' },
      { name: 'description', type: 'TEXT' },
      { name: 'added_at', type: 'TIMESTAMPTZ', constraint: 'DEFAULT CURRENT_TIMESTAMP' },
    ],
  },
  {
    name: 'spells',
    type: 'Master Library',
    description: 'Daftar master spell (cantrip level 0 s.d. 9), sekolah sihir, casting time, jarak, dan durasi.',
    columns: [
      { name: 'spell_id', type: 'BIGINT', key: 'PK', constraint: 'GENERATED ALWAYS AS IDENTITY' },
      { name: 'spell_name', type: 'VARCHAR(100)', constraint: 'NOT NULL, UNIQUE' },
      { name: 'spell_level', type: 'SMALLINT', constraint: 'DEFAULT 0, CHECK (0..9)' },
      { name: 'school', type: 'VARCHAR(50)' },
      { name: 'casting_time', type: 'VARCHAR(100)' },
      { name: 'range_text', type: 'VARCHAR(100)' },
      { name: 'duration', type: 'VARCHAR(100)' },
      { name: 'description', type: 'TEXT' },
    ],
  },
  {
    name: 'character_spells',
    type: 'Tabel Pivot (M:N CASCADE)',
    description: 'Menghubungkan karakter dengan spell yang dikuasai beserta status is_prepared dan catatan mantra.',
    columns: [
      { name: 'character_id', type: 'BIGINT', key: 'PK,FK', ref: 'characters(character_id)', constraint: 'ON DELETE CASCADE' },
      { name: 'spell_id', type: 'BIGINT', key: 'PK,FK', ref: 'spells(spell_id)', constraint: 'ON DELETE CASCADE' },
      { name: 'is_prepared', type: 'BOOLEAN', constraint: 'DEFAULT FALSE' },
      { name: 'notes', type: 'TEXT' },
      { name: 'added_at', type: 'TIMESTAMPTZ', constraint: 'DEFAULT CURRENT_TIMESTAMP' },
    ],
  },
  {
    name: 'character_saves',
    type: 'Relasi 1:M (CASCADE)',
    description: 'Menyimpan riwayat snapshot backup karakter secara lengkap dalam format dokumen JSONB.',
    columns: [
      { name: 'save_id', type: 'BIGINT', key: 'PK', constraint: 'GENERATED ALWAYS AS IDENTITY' },
      { name: 'character_id', type: 'BIGINT', key: 'FK', ref: 'characters(character_id)', constraint: 'ON DELETE CASCADE' },
      { name: 'save_name', type: 'VARCHAR(100)', constraint: "DEFAULT 'Manual save'" },
      { name: 'snapshot', type: 'JSONB', constraint: 'NOT NULL' },
      { name: 'saved_at', type: 'TIMESTAMPTZ', constraint: 'DEFAULT CURRENT_TIMESTAMP' },
    ],
  },
];

export const ErdViewer: React.FC = () => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSql, setShowSql] = useState(false);

  return (
    <div className="space-y-6">
      {/* ERD Header */}
      <div className="p-6 bg-stone-900/80 rounded-3xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-100 font-serif">
              Skema Relasi Database (ERD - 6 Tabel Relasional)
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Foreign Keys & Cascades
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1 max-w-2xl">
            Sesuai kriteria tugas: minimal 5 tabel relasional dengan foreign key, relasi 1:1, 1:M, dan pivot M:N, serta check constraints ketat (e.g. current_hp &lt;= max_hp).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSql(!showSql)}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold transition-colors border border-stone-700"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" /> {showSql ? 'Tutup SQL' : 'Lihat DDL SQL'}
          </button>
          <a
            href="/api/export/schema.sql"
            download="database.sql"
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" /> Unduh database.sql
          </a>
        </div>
      </div>

      {/* SQL Raw Viewer modal/collapse */}
      {showSql && (
        <div className="p-6 bg-stone-950 rounded-3xl border border-amber-500/40 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-400 font-mono">PostgreSQL DDL &amp; Seed Script (database.sql)</h3>
            <button
              onClick={() => {
                navigator.clipboard.writeText(RAW_DATABASE_SQL);
                setCopiedSql(true);
                setTimeout(() => setCopiedSql(false), 2000);
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs transition-colors"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Tersalin!' : 'Copy SQL'}</span>
            </button>
          </div>
          <pre className="p-4 bg-stone-900 rounded-2xl text-xs font-mono text-amber-200 overflow-x-auto max-h-[400px]">
            {RAW_DATABASE_SQL}
          </pre>
        </div>
      )}

      {/* Visual Relationship Flow */}
      <div className="p-6 bg-stone-950/60 rounded-3xl border border-stone-800 space-y-4">
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-500" /> Ringkasan Relasi Antar Tabel
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 space-y-1">
            <div className="flex items-center justify-between text-stone-200 font-bold">
              <span>characters</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
              <span>character_stats</span>
            </div>
            <p className="text-[11px] text-stone-400">Relasi 1:1 (One-to-One)</p>
            <span className="inline-block px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 text-[10px]">
              ON DELETE CASCADE
            </span>
          </div>

          <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 space-y-1">
            <div className="flex items-center justify-between text-stone-200 font-bold">
              <span>characters</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
              <span>inventory_items</span>
            </div>
            <p className="text-[11px] text-stone-400">Relasi 1:M (One-to-Many)</p>
            <span className="inline-block px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 text-[10px]">
              ON DELETE CASCADE
            </span>
          </div>

          <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 space-y-1">
            <div className="flex items-center justify-between text-stone-200 font-bold">
              <span>characters</span>
              <span className="text-[10px] text-amber-400 font-mono">&lt;&gt;</span>
              <span>spells</span>
            </div>
            <p className="text-[11px] text-stone-400">Pivot character_spells (M:N)</p>
            <span className="inline-block px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 text-[10px]">
              Many-to-Many
            </span>
          </div>

          <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 space-y-1">
            <div className="flex items-center justify-between text-stone-200 font-bold">
              <span>characters</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
              <span>character_saves</span>
            </div>
            <p className="text-[11px] text-stone-400">Relasi 1:M Snapshots (JSONB)</p>
            <span className="inline-block px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 text-[10px]">
              Backup History
            </span>
          </div>
        </div>
      </div>

      {/* Grid of 6 Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TABLES.map((table) => (
          <div
            key={table.name}
            className="p-5 bg-stone-900 rounded-3xl border border-stone-800 shadow-xl flex flex-col justify-between hover:border-amber-500/40 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between pb-3 border-b border-stone-800">
                <div>
                  <h4 className="font-bold text-stone-100 font-mono text-base flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-500" /> {table.name}
                  </h4>
                  <span className="text-[10px] font-semibold text-amber-400">
                    {table.type}
                  </span>
                </div>
              </div>
              <p className="text-xs text-stone-400 my-3">{table.description}</p>

              {/* Column definitions */}
              <div className="space-y-1.5 font-mono text-xs">
                {table.columns.map((col) => (
                  <div
                    key={col.name}
                    className="p-2 rounded-lg bg-stone-950/70 border border-stone-850 flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        {col.key && (
                          <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold">
                            {col.key}
                          </span>
                        )}
                        <span className="font-semibold text-stone-200">{col.name}</span>
                      </div>
                      {col.ref && (
                        <p className="text-[10px] text-amber-400/80 mt-0.5">
                          → {col.ref}
                        </p>
                      )}
                      {col.constraint && (
                        <p className="text-[9px] text-stone-500 truncate max-w-[200px]">
                          {col.constraint}
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] text-stone-400">{col.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
