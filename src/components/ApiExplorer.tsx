import React, { useState } from 'react';
import {
  Send,
  Download,
  Copy,
  Check,
  Play,
  RotateCcw,
  Code,
  Clock,
  Sparkles,
  Server,
  Layers,
} from 'lucide-react';

interface EndpointPreset {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  category: string;
  body?: Record<string, any>;
  description: string;
}

const PRESETS: EndpointPreset[] = [
  {
    name: 'GET All Characters',
    method: 'GET',
    endpoint: '/api/characters',
    category: 'Characters',
    description: 'Mengambil daftar semua karakter',
  },
  {
    name: 'GET Character by ID',
    method: 'GET',
    endpoint: '/api/characters/1',
    category: 'Characters',
    description: 'Menampilkan detail lengkap karakter beserta stats dan inventory',
  },
  {
    name: 'POST Create Character',
    method: 'POST',
    endpoint: '/api/characters',
    category: 'Characters',
    body: {
      character_name: 'Thorin Oakenshield II',
      race: 'Dwarf',
      character_class: 'Fighter',
      character_level: 3,
      experience_points: 1200,
      background: 'Noble',
      alignment: 'Lawful Good',
      stats: {
        strength: 18,
        dexterity: 12,
        constitution: 16,
        intelligence: 10,
        wisdom: 12,
        charisma: 14,
        max_hp: 32,
        current_hp: 32,
        armor_class: 17,
      },
    },
    description: 'Menambahkan karakter baru beserta nilai ability score',
  },
  {
    name: 'PUT Update Character',
    method: 'PUT',
    endpoint: '/api/characters/1',
    category: 'Characters',
    body: {
      character_name: 'Aric the Archmage',
      stats: {
        intelligence: 18,
        armor_class: 13,
      },
    },
    description: 'Mengubah informasi karakter yang sudah tersimpan',
  },
  {
    name: 'DELETE Character',
    method: 'DELETE',
    endpoint: '/api/characters/2',
    category: 'Characters',
    description: 'Menghapus karakter dan seluruh relasinya (CASCADE)',
  },
  {
    name: 'PATCH Modify HP (Damage / Heal)',
    method: 'PATCH',
    endpoint: '/api/characters/1/hp',
    category: 'Actions',
    body: {
      delta: -6,
    },
    description: 'Mengubah HP karakter (negatif untuk damage, positif untuk heal)',
  },
  {
    name: 'POST Add Experience Points (XP)',
    method: 'POST',
    endpoint: '/api/characters/1/xp',
    category: 'Actions',
    body: {
      amount: 1500,
    },
    description: 'Menambahkan XP dan memeriksa syarat kenaikan level',
  },
  {
    name: 'GET Check Level Up Eligibility',
    method: 'GET',
    endpoint: '/api/characters/1/levelup',
    category: 'Actions',
    description: 'Memeriksa progres level dan ambang XP berikutnya',
  },
  {
    name: 'GET Character Inventory',
    method: 'GET',
    endpoint: '/api/characters/1/inventory',
    category: 'Inventory',
    description: 'Menampilkan seluruh item di inventory karakter',
  },
  {
    name: 'POST Add Inventory Item',
    method: 'POST',
    endpoint: '/api/characters/1/inventory',
    category: 'Inventory',
    body: {
      item_name: 'Potion of Greater Healing',
      quantity: 2,
      weight: 1.0,
      description: 'Restores 4d4 + 4 hit points when consumed',
    },
    description: 'Menambahkan item ke dalam inventory karakter',
  },
  {
    name: 'GET Master Spells Library',
    method: 'GET',
    endpoint: '/api/spells',
    category: 'Spells',
    description: 'Daftar master spell dari library',
  },
  {
    name: 'GET Character Spells',
    method: 'GET',
    endpoint: '/api/characters/1/spells',
    category: 'Spells',
    description: 'Daftar spell yang dikuasai karakter',
  },
  {
    name: 'POST Assign Spell to Character',
    method: 'POST',
    endpoint: '/api/characters/1/spells',
    category: 'Spells',
    body: {
      spell_id: 4,
      is_prepared: true,
      notes: 'Emergency healing spell',
    },
    description: 'Menghubungkan spell ke karakter melalui tabel pivot',
  },
  {
    name: 'POST Create Snapshot Save',
    method: 'POST',
    endpoint: '/api/characters/1/saves',
    category: 'Saves',
    body: {
      save_name: 'Before Dragon Boss Fight',
    },
    description: 'Menyimpan snapshot backup lengkap karakter (simpanData)',
  },
  {
    name: 'POST Restore Snapshot Save',
    method: 'POST',
    endpoint: '/api/characters/1/restore/1',
    category: 'Saves',
    description: 'Memulihkan kondisi karakter dari snapshot tersimpan (muatData)',
  },
];

export const ApiExplorer: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
  const [urlPath, setUrlPath] = useState('/api/characters');
  const [requestBody, setRequestBody] = useState('');
  const [headers, setHeaders] = useState('Content-Type: application/json\nAccept: application/json');

  const [loading, setLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [responseBody, setResponseBody] = useState<string>('');
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSelectPreset = (preset: EndpointPreset) => {
    setSelectedMethod(preset.method);
    setUrlPath(preset.endpoint);
    if (preset.body) {
      setRequestBody(JSON.stringify(preset.body, null, 2));
    } else {
      setRequestBody('');
    }
  };

  const handleSendRequest = async () => {
    setLoading(true);
    setResponseStatus(null);
    setResponseBody('');
    const startTime = performance.now();

    try {
      const options: RequestInit = {
        method: selectedMethod,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      };

      if (['POST', 'PUT', 'PATCH'].includes(selectedMethod) && requestBody.trim()) {
        try {
          JSON.parse(requestBody); // validate JSON
          options.body = requestBody;
        } catch {
          setLoading(false);
          setResponseStatus(400);
          setResponseBody(JSON.stringify({ error: 'Request body bukan format JSON yang valid' }, null, 2));
          return;
        }
      }

      const res = await fetch(urlPath, options);
      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));
      setResponseStatus(res.status);

      // Collect headers
      const resHeaders: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        resHeaders[key] = val;
      });
      setResponseHeaders(resHeaders);

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        setResponseBody(JSON.stringify(json, null, 2));
      } else {
        const text = await res.text();
        setResponseBody(text);
      }
    } catch (err: any) {
      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));
      setResponseStatus(500);
      setResponseBody(JSON.stringify({ error: err.message || 'Network request failed' }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const methodColors: Record<string, string> = {
    GET: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    POST: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    PATCH: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) {
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
    if (status >= 400 && status < 500) {
      return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    }
    return 'bg-red-500/20 text-red-400 border-red-500/40';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 bg-stone-900/80 rounded-3xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-100 font-serif">
              Built-in Thunder Client / Postman REST API Tester
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Live Evaluation
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1 max-w-2xl">
            Uji seluruh endpoint REST API secara real-time langsung di dalam aplikasi. Evaluator dapat memilih endpoint preset di bawah, mengubah method atau body, mengirim request, dan memeriksa status code serta response JSON.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/export/postman"
            download="Tabletop_Player_Sheet_Manager.postman_collection.json"
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold transition-colors border border-stone-700"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" /> Export Postman
          </a>
          <a
            href="/api/export/thunder-client"
            download="thunder-collection_tabletop_manager.json"
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" /> Export Thunder Client
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Preset Endpoints Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-500" /> Koleksi Endpoint ({PRESETS.length})
            </h3>
          </div>

          <div className="space-y-1.5 max-h-[650px] overflow-y-auto pr-1">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectPreset(p)}
                className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                  urlPath === p.endpoint && selectedMethod === p.method
                    ? 'bg-amber-950/30 border-amber-500/50 shadow-sm'
                    : 'bg-stone-900/60 border-stone-800/80 hover:bg-stone-800/60 hover:border-stone-700'
                }`}
              >
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-black border ${methodColors[p.method]}`}>
                      {p.method}
                    </span>
                    <span className="text-xs font-semibold text-stone-200 truncate">
                      {p.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-mono mt-0.5 truncate">{p.endpoint}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Request & Response Panel (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* URL & Method Bar */}
          <div className="p-3 bg-stone-900 rounded-2xl border border-stone-800 flex flex-col sm:flex-row items-center gap-2 shadow-lg">
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value as any)}
              className={`w-full sm:w-28 px-3 py-2 rounded-xl text-xs font-black border uppercase tracking-wider focus:outline-none ${methodColors[selectedMethod]}`}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>

            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={urlPath}
                onChange={(e) => setUrlPath(e.target.value)}
                placeholder="/api/characters"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 font-mono text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              onClick={handleSendRequest}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-100 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-950 transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Mengirim...' : 'Send Request'}</span>
            </button>
          </div>

          {/* Request Body (For POST/PUT/PATCH) */}
          {['POST', 'PUT', 'PATCH'].includes(selectedMethod) && (
            <div className="p-4 bg-stone-900/90 rounded-2xl border border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span className="font-semibold text-stone-300">Request Body (JSON)</span>
                <button
                  onClick={() => {
                    try {
                      setRequestBody(JSON.stringify(JSON.parse(requestBody), null, 2));
                    } catch {}
                  }}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  Format JSON
                </button>
              </div>
              <textarea
                rows={6}
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                placeholder='{\n  "character_name": "Thorin"\n}'
                className="w-full p-3 bg-stone-950 border border-stone-800 rounded-xl text-amber-200 font-mono text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Response Viewer */}
          <div className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-stone-300">Response</span>
                {responseStatus !== null && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${getStatusBadge(responseStatus)}`}>
                    {responseStatus} {responseStatus === 200 ? 'OK' : responseStatus === 201 ? 'Created' : responseStatus === 400 ? 'Bad Request' : responseStatus === 404 ? 'Not Found' : 'Response'}
                  </span>
                )}
                {responseTime !== null && (
                  <span className="text-xs text-stone-500 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" /> {responseTime} ms
                  </span>
                )}
              </div>

              {responseBody && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(responseBody);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Tersalin' : 'Copy'}</span>
                </button>
              )}
            </div>

            <div className="p-4">
              {loading ? (
                <div className="py-12 text-center text-stone-400 text-xs flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4 animate-spin text-amber-500" />
                  <span>Memproses request ke endpoint...</span>
                </div>
              ) : responseBody ? (
                <pre className="p-4 bg-stone-950 rounded-xl border border-stone-850 font-mono text-xs text-stone-200 overflow-x-auto max-h-[450px]">
                  {responseBody}
                </pre>
              ) : (
                <div className="py-12 text-center text-stone-500 text-xs">
                  <Play className="w-6 h-6 mx-auto mb-2 opacity-30" />
                  Pilih preset di sebelah kiri dan klik &quot;Send Request&quot; untuk melihat response status code dan payload JSON.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
