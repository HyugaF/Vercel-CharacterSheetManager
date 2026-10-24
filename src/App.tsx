/**
 * Tabletop Player Sheet Manager - Full Stack Application
 * Clean D&D Beyond UI with reliable state management and real PostgreSQL connection
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { CharacterListView } from './components/CharacterListView.tsx';
import { CharacterSheetView } from './components/CharacterSheetView.tsx';
import { CharacterModal } from './components/CharacterModal.tsx';
import { Character, CharacterDetail, Spell, CreateCharacterInput } from './types/index.ts';
import { CheckCircle, AlertCircle, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';

export default function App() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterDetail | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'sheet'>('list');

  const [masterSpells, setMasterSpells] = useState<Spell[]>([]);
  const [saves, setSaves] = useState<any[]>([]);

  // Database Connection State
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [dbHost, setDbHost] = useState<string | null>(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const [customDbUrl, setCustomDbUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('tb_custom_db_url') || '';
    } catch (_) {
      return '';
    }
  });
  const [isConnectingCustom, setIsConnectingCustom] = useState(false);

  // Confirmation Modals State
  const [characterToDelete, setCharacterToDelete] = useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [snapshotToRestore, setSnapshotToRestore] = useState<{ charId: number; saveId: number; saveName: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<CharacterDetail | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Fetch character list
  const fetchCharacterList = useCallback(async (autoSelectId?: number) => {
    try {
      const res = await fetch('/api/characters');
      const json = await res.json();
      if (res.status === 503 || json.error === 'database not connected') {
        setDbConnected(false);
        setDbError(json.detail || json.message);
        return;
      }
      if (json.success && Array.isArray(json.data)) {
        setCharacters(json.data);
        if (autoSelectId) {
          setSelectedId(autoSelectId);
        } else {
          setSelectedId((prev) => {
            if (prev && json.data.some((c: any) => c.character_id === prev)) {
              return prev;
            }
            return json.data.length > 0 ? json.data[0].character_id : null;
          });
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch character list:', err);
    }
  }, []);

  // 2. Fetch master spells
  const fetchSpells = useCallback(async () => {
    try {
      const res = await fetch('/api/spells');
      const json = await res.json();
      if (res.status === 503) {
        setDbConnected(false);
        return;
      }
      if (json.success && Array.isArray(json.data)) {
        setMasterSpells(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch spells:', err);
    }
  }, []);

  // Check Database Status
  const checkDbConnection = useCallback(async () => {
    setIsCheckingDb(true);
    try {
      const res = await fetch('/api/db-status');
      const json = await res.json();
      if (json.connected) {
        setDbConnected(true);
        setDbHost(json.host || 'PostgreSQL Cloud');
        setDbError(null);
        await Promise.all([fetchCharacterList(), fetchSpells()]);
        return;
      }

      // If backend says not connected, check if client has VITE_DATABASE_URL or cached customDbUrl
      const clientViteUrl = (import.meta as any).env?.VITE_DATABASE_URL as string | undefined;
      const cachedUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('tb_custom_db_url') : null;
      const fallbackUrl = clientViteUrl?.trim() || cachedUrl?.trim();

      if (fallbackUrl && fallbackUrl.length > 0) {
        try {
          const autoRes = await fetch('/api/db-connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ databaseUrl: fallbackUrl }),
          });
          const autoJson = await autoRes.json();
          if (autoJson.success) {
            setDbConnected(true);
            setDbHost(autoJson.host || 'PostgreSQL Cloud');
            setDbError(null);
            await Promise.all([fetchCharacterList(), fetchSpells()]);
            return;
          }
        } catch (_) {}
      }

      setDbConnected(false);
      setDbError(json.error || 'DATABASE_URL belum dikonfigurasi di Vercel atau koneksi gagal');
    } catch (err: any) {
      setDbConnected(false);
      setDbError(err.message || 'Gagal menghubungi server');
    } finally {
      setIsCheckingDb(false);
    }
  }, [fetchCharacterList, fetchSpells]);

  // Connect via Custom URL from UI
  const handleConnectCustomUrl = async () => {
    if (!customDbUrl.trim()) return;
    setIsConnectingCustom(true);
    try {
      const res = await fetch('/api/db-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseUrl: customDbUrl.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setDbConnected(true);
        setDbHost(json.host || 'PostgreSQL Cloud');
        setDbError(null);
        try {
          localStorage.setItem('tb_custom_db_url', customDbUrl.trim());
        } catch (_) {}
        showToast('Berhasil terhubung ke database PostgreSQL!', 'success');
        await Promise.all([fetchCharacterList(), fetchSpells()]);
      } else {
        setDbError(json.error || 'Gagal menyambung ke database');
        showToast(json.error || 'Gagal menyambung ke database', 'error');
      }
    } catch (err: any) {
      setDbError(err.message);
      showToast(err.message, 'error');
    } finally {
      setIsConnectingCustom(false);
    }
  };

  // Initial mount: Check DB connection first
  useEffect(() => {
    checkDbConnection();
  }, [checkDbConnection]);

  // Load active character detail whenever selectedId changes
  useEffect(() => {
    if (!selectedId || dbConnected === false) {
      setSelectedCharacter(null);
      setSaves([]);
      return;
    }

    let isCancelled = false;

    fetch(`/api/characters/${selectedId}`)
      .then((res) => res.json())
      .then((json) => {
        if (!isCancelled && json.success) {
          setSelectedCharacter(json.data);
        }
      })
      .catch((err) => console.error('Error loading character detail:', err));

    fetch(`/api/characters/${selectedId}/saves`)
      .then((res) => res.json())
      .then((json) => {
        if (!isCancelled && json.success) {
          setSaves(json.data);
        }
      })
      .catch((err) => console.error('Error loading saves:', err));

    return () => {
      isCancelled = true;
    };
  }, [selectedId, dbConnected]);

  // Refresher for detail after actions
  const refreshDetail = async (id: number) => {
    try {
      const [charRes, savesRes, listRes] = await Promise.all([
        fetch(`/api/characters/${id}`).then((r) => r.json()),
        fetch(`/api/characters/${id}/saves`).then((r) => r.json()),
        fetch('/api/characters').then((r) => r.json()),
      ]);

      if (charRes.success) setSelectedCharacter(charRes.data);
      if (savesRes.success) setSaves(savesRes.data);
      if (listRes.success) setCharacters(listRes.data);
    } catch (err) {
      console.error('Failed to refresh character data:', err);
    }
  };

  const handleSelectCharacter = (id: number) => {
    setSelectedId(id);
    setViewMode('sheet');
  };

  const handleModifyHp = async (id: number, delta: number) => {
    try {
      const res = await fetch(`/api/characters/${id}/hp`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        await refreshDetail(id);
      } else {
        showToast(json.error || 'Gagal mengubah HP', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddXp = async (id: number, amount: number) => {
    try {
      const res = await fetch(`/api/characters/${id}/xp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        await refreshDetail(id);
      } else {
        showToast(json.error || 'Gagal menambah XP', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleResetHp = async (id: number) => {
    try {
      const res = await fetch(`/api/characters/${id}/reset`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        await refreshDetail(id);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveCharacter = async (data: CreateCharacterInput): Promise<boolean> => {
    try {
      if (editingCharacter) {
        const res = await fetch(`/api/characters/${editingCharacter.character_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.success) {
          showToast('Data karakter berhasil diperbarui di database');
          await refreshDetail(editingCharacter.character_id);
          return true;
        } else {
          showToast(json.error || 'Gagal memperbarui karakter', 'error');
          return false;
        }
      } else {
        const res = await fetch('/api/characters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.success) {
          showToast('Karakter baru berhasil disimpan ke database!');
          await fetchCharacterList(json.data.character_id);
          setViewMode('sheet');
          return true;
        } else {
          showToast(json.error || 'Gagal membuat karakter', 'error');
          return false;
        }
      }
    } catch (err: any) {
      showToast(err.message, 'error');
      return false;
    }
  };

  const handleOpenDeleteConfirm = (char: Character) => {
    setCharacterToDelete({ id: char.character_id, name: char.character_name });
  };

  const confirmDeleteCharacter = async () => {
    if (!characterToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/characters/${characterToDelete.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || 'Karakter berhasil dihapus dari database');
        setCharacterToDelete(null);
        await fetchCharacterList();
        setViewMode('list');
      } else {
        showToast(json.error || 'Gagal menghapus karakter', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddItem = async (charId: number, item: any) => {
    try {
      const res = await fetch(`/api/characters/${charId}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Item berhasil ditambahkan ke inventory database');
        await refreshDetail(charId);
      } else {
        showToast(json.error || 'Gagal menambah item', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteItem = async (charId: number, itemId: number) => {
    try {
      const res = await fetch(`/api/characters/${charId}/inventory/${itemId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Item berhasil dihapus');
        await refreshDetail(charId);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAssignSpell = async (charId: number, spellId: number, isPrepared = false, notes = '') => {
    try {
      const res = await fetch(`/api/characters/${charId}/spells`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spell_id: spellId, is_prepared: isPrepared, notes }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Spell berhasil ditambahkan ke spellbook database');
        await refreshDetail(charId);
      } else {
        showToast(json.error || 'Gagal menambahkan spell', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleTogglePrepared = async (charId: number, spellId: number, currentPrepared: boolean) => {
    try {
      const res = await fetch(`/api/characters/${charId}/spells/${spellId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_prepared: !currentPrepared }),
      });
      const json = await res.json();
      if (json.success) {
        await refreshDetail(charId);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRemoveSpell = async (charId: number, spellId: number) => {
    try {
      const res = await fetch(`/api/characters/${charId}/spells/${spellId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Spell berhasil dihapus dari spellbook');
        await refreshDetail(charId);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateSave = async (charId: number, saveName: string) => {
    try {
      const res = await fetch(`/api/characters/${charId}/saves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ save_name: saveName }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Snapshot backup berhasil disimpan ke database');
        await refreshDetail(charId);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenRestoreConfirm = (charId: number, saveId: number, saveName: string) => {
    setSnapshotToRestore({ charId, saveId, saveName });
  };

  const confirmRestoreSave = async () => {
    if (!snapshotToRestore) return;
    setIsRestoring(true);
    try {
      const res = await fetch(`/api/characters/${snapshotToRestore.charId}/restore/${snapshotToRestore.saveId}`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success) {
        showToast('Snapshot berhasil dipulihkan!');
        setSnapshotToRestore(null);
        await refreshDetail(snapshotToRestore.charId);
      } else {
        showToast(json.error || 'Gagal memulihkan snapshot', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteSave = async (charId: number, saveId: number) => {
    try {
      const res = await fetch(`/api/characters/${charId}/saves/${saveId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Snapshot berhasil dihapus');
        await refreshDetail(charId);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const confirmResetDatabase = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/database/reset', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        showToast('Database berhasil di-reset ke data bawaan');
        setIsResetConfirmOpen(false);
        await fetchCharacterList();
        await fetchSpells();
      } else {
        showToast(json.error || 'Gagal reset database', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // --- 1. Screen state: Loading initial check ---
  if (dbConnected === null) {
    return (
      <div className="min-h-screen bg-white text-zinc-900 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin mb-4" />
        <p className="text-sm text-zinc-500 font-medium">Memeriksa koneksi database...</p>
      </div>
    );
  }

  // --- 2. Screen state: DATABASE NOT CONNECTED (White Screen requirement) ---
  if (dbConnected === false) {
    return (
      <div className="min-h-screen bg-white text-zinc-900 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="max-w-lg w-full">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center text-red-500 border border-red-100 shadow-sm">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2 lowercase">
            database not connected
          </h1>
          <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
            Aplikasi tidak dapat mendeteksi atau terhubung ke database PostgreSQL eksternal.
          </p>

          {/* Diagnostic Error Message */}
          {dbError && (
            <div className="p-3 mb-6 bg-red-50/70 border border-red-200 rounded-lg text-xs text-red-700 font-mono text-left overflow-auto max-h-36 whitespace-pre-wrap">
              <span className="font-semibold block mb-1 text-red-800">Status Error:</span>
              {dbError}
            </div>
          )}

          {/* Vercel Troubleshooting Guide */}
          <div className="mb-6 p-4 border border-zinc-200 rounded-xl text-left bg-zinc-50/80 text-xs text-zinc-600 space-y-2.5">
            <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
              <span>Panduan Deteksi Environment Variable di Vercel:</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-600 pl-1 leading-relaxed">
              <li>
                <strong className="text-zinc-800">Wajib Lakukan Redeploy:</strong> Di Vercel, menambahkan variabel baru <em>tidak otomatis</em> berlaku pada deployment aktif. Buka dashboard Vercel &gt; tab <strong>Deployments</strong> &gt; klik titik tiga <code className="bg-zinc-200/70 px-1 py-0.5 rounded text-zinc-800">...</code> pada deployment terbaru &gt; klik <strong>Redeploy</strong>.
              </li>
              <li>
                <strong className="text-zinc-800">Centang Environment:</strong> Pastikan opsi <code className="bg-zinc-200/70 px-1 py-0.5 rounded text-zinc-800">Production</code> dicentang saat menyimpan variable di Vercel Settings.
              </li>
              <li>
                <strong className="text-zinc-800">Format Supabase Pooler:</strong> Gunakan connection string <strong>Transaction Pooler (Port 6543)</strong>: <code className="bg-zinc-200/70 px-1 py-0.5 rounded text-zinc-800 break-all">postgresql://postgres.[ref]:[password]@...pooler.supabase.com:6543/postgres</code>
              </li>
              <li>
                <strong className="text-zinc-800">Tanpa Tanda Petik:</strong> Pastikan nilai di Vercel tidak dibungkus tanda kutip <code className="bg-zinc-200/70 px-1 py-0.5 rounded text-zinc-800">"..."</code>.
              </li>
            </ul>
          </div>

          {/* Quick Connect for testing */}
          <div className="mb-6 p-4 border border-zinc-200 rounded-xl text-left bg-zinc-50/60">
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Hubungkan Cepat (Uji Koneksi Langsung Supabase / Postgres):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="postgresql://postgres.xxx:password@aws-0-...pooler.supabase.com:6543/postgres"
                value={customDbUrl}
                onChange={(e) => setCustomDbUrl(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-900 font-mono bg-white text-zinc-900"
              />
              <button
                type="button"
                onClick={handleConnectCustomUrl}
                disabled={isConnectingCustom || !customDbUrl.trim()}
                className="px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-medium rounded-lg transition disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                {isConnectingCustom ? 'Menghubungkan...' : 'Hubungkan'}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={checkDbConnection}
            disabled={isCheckingDb}
            className="w-full py-2.5 bg-zinc-900 hover:bg-black text-white text-sm font-medium rounded-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {isCheckingDb && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{isCheckingDb ? 'Memeriksa koneksi ke Vercel...' : 'Periksa Ulang Koneksi (Retry)'}</span>
          </button>
        </div>
      </div>
    );
  }

  // --- 3. Screen state: CONNECTED (Full Application) ---
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Toast Alert */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl text-xs font-semibold backdrop-blur-md animate-in slide-in-from-bottom-2 duration-200 border bg-stone-900/95 text-white border-stone-700"
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        onBackToList={() => setViewMode('list')}
        onOpenCreateModal={() => {
          setEditingCharacter(null);
          setIsModalOpen(true);
        }}
        onResetDatabase={() => setIsResetConfirmOpen(true)}
        currentView={viewMode}
      />

      {/* Main Content View */}
      <main className="flex-1 flex flex-col">
        {viewMode === 'list' ? (
          <CharacterListView
            characters={characters}
            onSelectCharacter={handleSelectCharacter}
            onOpenCreateModal={() => {
              setEditingCharacter(null);
              setIsModalOpen(true);
            }}
            onOpenEditModal={(char: Character) => {
              fetch(`/api/characters/${char.character_id}`)
                .then((r) => r.json())
                .then((j) => {
                  if (j.success) {
                    setEditingCharacter(j.data);
                    setIsModalOpen(true);
                  }
                });
            }}
            onDeleteCharacter={(id: number) => {
              const char = characters.find((c) => c.character_id === id);
              if (char) handleOpenDeleteConfirm(char);
            }}
          />
        ) : selectedCharacter ? (
          <CharacterSheetView
            character={selectedCharacter}
            allCharacters={characters}
            onSelectCharacter={(id: number) => handleSelectCharacter(id)}
            onBackToList={() => setViewMode('list')}
            onModifyHp={async (id: number, delta: number) => {
              await handleModifyHp(id, delta);
            }}
            onAddXp={async (id: number, amount: number) => {
              await handleAddXp(id, amount);
            }}
            onResetHp={async (id: number) => {
              await handleResetHp(id);
            }}
            onOpenEditModal={(char: CharacterDetail) => {
              setEditingCharacter(char);
              setIsModalOpen(true);
            }}
            onDeleteCharacter={(id: number) => {
              const char = characters.find((c) => c.character_id === id) || selectedCharacter;
              if (char) handleOpenDeleteConfirm(char);
            }}
            onAddInventoryItem={async (charId: number, item: { item_name: string; quantity: number; weight: number; description: string }) => {
              await handleAddItem(charId, item);
            }}
            onDeleteInventoryItem={async (charId: number, itemId: number) => {
              await handleDeleteItem(charId, itemId);
            }}
            masterSpells={masterSpells}
            onAssignSpell={async (charId: number, spellId: number, isPrepared: boolean, notes: string) => {
              await handleAssignSpell(charId, spellId, isPrepared, notes);
            }}
            onToggleSpellPrepared={async (charId: number, spellId: number, currentPrepared: boolean) => {
              await handleTogglePrepared(charId, spellId, currentPrepared);
            }}
            onDeleteSpell={async (charId: number, spellId: number) => {
              await handleRemoveSpell(charId, spellId);
            }}
            saves={saves}
            onCreateSave={async (charId: number, saveName: string) => {
              await handleCreateSave(charId, saveName);
            }}
            onRestoreSave={(charId: number, saveId: number) => {
              const targetSave = saves.find((s) => s.save_id === saveId);
              handleOpenRestoreConfirm(charId, saveId, targetSave?.save_name || `Snapshot #${saveId}`);
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-stone-400">
            <p className="text-sm">Pilih karakter dari daftar untuk melihat lembar karakter.</p>
            <button
              onClick={() => setViewMode('list')}
              className="mt-4 px-4 py-2 bg-stone-800 text-stone-200 rounded-lg text-xs hover:bg-stone-700 transition"
            >
              Kembali ke Daftar Karakter
            </button>
          </div>
        )}
      </main>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <CharacterModal
          isOpen={isModalOpen}
          initialData={editingCharacter}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCharacter(null);
          }}
          onSubmit={handleSaveCharacter}
        />
      )}

      {/* Delete Confirmation Modal */}
      {characterToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white border border-stone-300 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 id="delete-dialog-title" className="text-lg font-bold text-stone-900 font-serif">
                  Hapus Karakter
                </h3>
                <p className="text-xs text-stone-500">
                  Operasi: DELETE /api/characters/:id (Cascade)
                </p>
              </div>
            </div>

            <p className="text-sm text-stone-700 leading-relaxed">
              Apakah kamu yakin ingin menghapus karakter <strong className="text-stone-950 font-bold">{characterToDelete.name}</strong>? Seluruh data atribut, inventory, spellbook, dan backup snapshot terkait akan dihapus permanen dari database.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCharacterToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-lg transition-colors border border-stone-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteCharacter}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors shadow flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? 'Menghapus...' : 'Hapus Karakter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Database Confirmation Modal */}
      {isResetConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white border border-stone-300 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 id="reset-dialog-title" className="text-lg font-bold text-stone-900 font-serif">
                  Reset Database
                </h3>
                <p className="text-xs text-stone-500">
                  Operasi: POST /api/database/reset
                </p>
              </div>
            </div>

            <p className="text-sm text-stone-700 leading-relaxed">
              Reset seluruh database ke data bawaan awal (seed data)? Semua perubahan kustom yang telah dibuat akan dikembalikan ke kondisi mula-mula.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                disabled={isResetting}
                className="px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-lg transition-colors border border-stone-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmResetDatabase}
                disabled={isResetting}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors shadow flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {isResetting ? 'Mereset...' : 'Reset Database'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Snapshot Confirmation Modal */}
      {snapshotToRestore && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="restore-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white border border-stone-300 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 id="restore-dialog-title" className="text-lg font-bold text-stone-900 font-serif">
                  Pulihkan Snapshot
                </h3>
                <p className="text-xs text-stone-500">
                  Operasi: POST /api/characters/:id/restore/:saveId
                </p>
              </div>
            </div>

            <p className="text-sm text-stone-700 leading-relaxed">
              Apakah kamu yakin ingin memulihkan karakter ke snapshot <strong className="text-stone-950 font-bold">{snapshotToRestore.saveName}</strong>? Status dan atribut saat ini akan ditimpa dengan data snapshot tersebut.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSnapshotToRestore(null)}
                disabled={isRestoring}
                className="px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-lg transition-colors border border-stone-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmRestoreSave}
                disabled={isRestoring}
                className="px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors shadow flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {isRestoring ? 'Memulihkan...' : 'Pulihkan Snapshot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
