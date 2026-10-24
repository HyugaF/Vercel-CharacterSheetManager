import React from 'react';
import { CheckCircle, Code, ListOrdered, Sparkles, Terminal } from 'lucide-react';

interface FunctionItem {
  id: number;
  name: string;
  usage: string;
  endpointOrScope: string;
  category: 'Character CRUD' | 'Combat & Rules' | 'Inventory' | 'Spells' | 'Snapshots & System';
}

const FUNCTIONS_LIST: FunctionItem[] = [
  {
    id: 1,
    name: 'buatKarakter()',
    usage: 'Digunakan untuk membuat character sheet baru dengan informasi seperti nama, ras, class, level, dan ability score.',
    endpointOrScope: 'POST /api/characters',
    category: 'Character CRUD',
  },
  {
    id: 2,
    name: 'tampilkanKarakter()',
    usage: 'Digunakan untuk menampilkan informasi lengkap dari character sheet.',
    endpointOrScope: 'GET /api/characters/:id',
    category: 'Character CRUD',
  },
  {
    id: 3,
    name: 'editKarakter()',
    usage: 'Digunakan untuk mengubah informasi karakter yang sudah tersimpan.',
    endpointOrScope: 'PUT /api/characters/:id',
    category: 'Character CRUD',
  },
  {
    id: 4,
    name: 'hapusKarakter()',
    usage: 'Digunakan untuk menghapus character sheet dari sistem.',
    endpointOrScope: 'DELETE /api/characters/:id (CASCADE)',
    category: 'Character CRUD',
  },
  {
    id: 5,
    name: 'cariKarakter()',
    usage: 'Digunakan untuk mencari karakter berdasarkan nama atau ID karakter.',
    endpointOrScope: 'GET /api/characters/search?q=...',
    category: 'Character CRUD',
  },
  {
    id: 6,
    name: 'hitungModifier()',
    usage: 'Digunakan untuk menghitung ability modifier berdasarkan ability score karakter.',
    endpointOrScope: 'Formula: floor((score - 10) / 2) [Pure Util]',
    category: 'Combat & Rules',
  },
  {
    id: 7,
    name: 'ubahHP()',
    usage: 'Digunakan untuk menambah atau mengurangi HP karakter, misalnya ketika menerima damage atau mendapatkan healing.',
    endpointOrScope: 'PATCH /api/characters/:id/hp',
    category: 'Combat & Rules',
  },
  {
    id: 8,
    name: 'tambahXP()',
    usage: 'Digunakan untuk menambahkan experience point (XP) kepada karakter.',
    endpointOrScope: 'POST /api/characters/:id/xp',
    category: 'Combat & Rules',
  },
  {
    id: 9,
    name: 'cekLevelUp()',
    usage: 'Digunakan untuk memeriksa apakah XP karakter sudah memenuhi syarat untuk naik level.',
    endpointOrScope: 'GET /api/characters/:id/levelup',
    category: 'Combat & Rules',
  },
  {
    id: 10,
    name: 'tambahInventory()',
    usage: 'Digunakan untuk menambahkan item baru ke inventory karakter.',
    endpointOrScope: 'POST /api/characters/:id/inventory',
    category: 'Inventory',
  },
  {
    id: 11,
    name: 'hapusInventory()',
    usage: 'Digunakan untuk menghapus item dari inventory karakter.',
    endpointOrScope: 'DELETE /api/characters/:id/inventory/:itemId',
    category: 'Inventory',
  },
  {
    id: 12,
    name: 'tampilkanInventory()',
    usage: 'Digunakan untuk menampilkan seluruh item yang dimiliki karakter.',
    endpointOrScope: 'GET /api/characters/:id/inventory',
    category: 'Inventory',
  },
  {
    id: 13,
    name: 'tambahSpell()',
    usage: 'Digunakan untuk menambahkan spell yang dimiliki atau dikuasai karakter.',
    endpointOrScope: 'POST /api/characters/:id/spells',
    category: 'Spells',
  },
  {
    id: 14,
    name: 'hapusSpell()',
    usage: 'Digunakan untuk menghapus spell dari daftar spell karakter.',
    endpointOrScope: 'DELETE /api/characters/:id/spells/:spellId',
    category: 'Spells',
  },
  {
    id: 15,
    name: 'tampilkanSpell()',
    usage: 'Digunakan untuk menampilkan daftar spell yang dimiliki karakter.',
    endpointOrScope: 'GET /api/characters/:id/spells',
    category: 'Spells',
  },
  {
    id: 16,
    name: 'simpanData()',
    usage: 'Digunakan untuk menyimpan data character sheet agar dapat digunakan kembali.',
    endpointOrScope: 'POST /api/characters/:id/saves (JSONB Snapshot)',
    category: 'Snapshots & System',
  },
  {
    id: 17,
    name: 'muatData()',
    usage: 'Digunakan untuk mengambil dan memuat data character sheet yang telah disimpan.',
    endpointOrScope: 'POST /api/characters/:id/restore/:saveId',
    category: 'Snapshots & System',
  },
  {
    id: 18,
    name: 'validasiData()',
    usage: 'Digunakan untuk memastikan data yang dimasukkan pengguna sesuai dengan format yang diperlukan.',
    endpointOrScope: 'Schema Validator Middleware [Check Constraints]',
    category: 'Snapshots & System',
  },
  {
    id: 19,
    name: 'resetKarakter()',
    usage: 'Digunakan untuk mengembalikan data karakter ke kondisi awal atau mengatur ulang character sheet.',
    endpointOrScope: 'POST /api/characters/:id/reset',
    category: 'Snapshots & System',
  },
  {
    id: 20,
    name: 'handleError()',
    usage: 'Digunakan untuk menangani kesalahan input atau kesalahan saat aplikasi menjalankan suatu proses.',
    endpointOrScope: 'Standard JSON Error Responder (400, 404, 500)',
    category: 'Snapshots & System',
  },
];

export const FunctionsDirectory: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-stone-900/80 rounded-3xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-100 font-serif">
              Daftar 20 Fungsi Utama (Project Function List)
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              100% Implemented
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1 max-w-2xl">
            Seluruh 20 fungsi yang dirancang pada Project Preparation Phase 1-2 telah diimplementasikan penuh pada backend REST API dan logic engine.
          </p>
        </div>
      </div>

      {/* Grid of Functions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FUNCTIONS_LIST.map((fn) => (
          <div
            key={fn.id}
            className="p-5 bg-stone-900 rounded-2xl border border-stone-800 space-y-3 hover:border-amber-500/40 transition-colors shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/30">
                  {fn.id}
                </span>
                <h3 className="font-mono font-bold text-stone-100 text-sm">
                  {fn.name}
                </h3>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-800 text-stone-300">
                {fn.category}
              </span>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              <strong>Kegunaan:</strong> {fn.usage}
            </p>

            <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs">
              <span className="text-stone-500 text-[11px]">Mapping:</span>
              <code className="text-amber-400 font-mono text-[11px] px-2 py-0.5 rounded bg-stone-950 border border-stone-850">
                {fn.endpointOrScope}
              </code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
