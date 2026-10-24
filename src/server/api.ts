/**
 * REST API Routes for Tabletop Player Sheet Manager
 * Conforms to Tugas Akhir Learning Labs: Backend Development specs:
 * - Minimal 5 related tables (implements 6 tables with FKs)
 * - GET, POST, PUT, PATCH, DELETE
 * - Correct HTTP Status codes (200, 201, 204, 400, 404, 500, 503)
 * - Real PostgreSQL Database support and connection health checks
 */

import { Router, Request, Response } from 'express';
import { db } from './db.ts';
import {
  buatKarakter,
  tampilkanKarakter,
  editKarakter,
  hapusKarakter,
  cariKarakter,
  ubahHP,
  tambahXP,
  cekLevelUp,
  tambahInventory,
  hapusInventory,
  tampilkanInventory,
  tambahSpell,
  hapusSpell,
  tampilkanSpell,
  simpanData,
  muatData,
  resetKarakter,
  handleError,
} from './functions.ts';
import { generatePostmanCollection, generateThunderCollection, RAW_DATABASE_SQL } from './exportCollections.ts';

export const apiRouter = Router();

// Middleware to parse JSON headers
apiRouter.use((_req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// --- Health Check ---
apiRouter.get('/health', async (_req: Request, res: Response) => {
  const dbStatus = await db.checkConnection();
  res.status(200).json({
    status: 'ok',
    app: 'Tabletop Player Sheet Manager API',
    version: '1.0.0',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// --- Database Status Endpoint ---
apiRouter.get('/db-status', async (_req: Request, res: Response) => {
  try {
    const status = await db.checkConnection();
    res.status(200).json(status);
  } catch (err: any) {
    res.status(200).json({
      connected: false,
      database: null,
      host: null,
      error: err.message || 'Database not connected',
    });
  }
});

// --- Dynamic Connect / Test Endpoint ---
apiRouter.post('/db-connect', async (req: Request, res: Response) => {
  const { databaseUrl } = req.body || {};

  // If a manual URL was provided, connect with it
  if (databaseUrl && typeof databaseUrl === 'string') {
    const result = await db.connect(databaseUrl.trim(), 'manual');
    if (!result.connected) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Gagal menyambung ke database',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Berhasil terhubung ke database PostgreSQL eksternal!',
      host: db.getActiveHost(),
    });
  }

  // If no URL was provided, attempt to auto-connect from environment variables
  await db.autoInit();
  if (db.isConnected()) {
    return res.status(200).json({
      success: true,
      message: 'Berhasil terhubung ke database dari environment variable!',
      host: db.getActiveHost(),
    });
  }

  return res.status(400).json({
    success: false,
    error: db.getConnectionError() || 'DATABASE_URL tidak ditemukan atau gagal terhubung',
  });
});

// --- Database Connectivity Guard Middleware ---
// Blocks data access with 503 if database is not connected
apiRouter.use(async (req, res, next) => {
  const allowedWithoutDb = ['/health', '/db-status', '/db-connect', '/export/postman', '/export/thunder-client', '/export/schema.sql'];
  if (allowedWithoutDb.some((p) => req.path === p || req.path.startsWith(p + '/'))) {
    return next();
  }

  await db.ensureReady();

  // If not connected, give it an immediate retry attempt with any configured env var
  if (!db.isConnected() && db.hasConfiguredDatabaseUrl()) {
    await db.autoInit();
  }

  if (!db.isConnected()) {
    return res.status(503).json({
      success: false,
      error: 'database not connected',
      message: 'Database eksternal tidak terhubung. Pastikan DATABASE_URL sudah diatur di environment variable.',
      detail: db.getConnectionError(),
    });
  }

  next();
});

// --- 5. cariKarakter() & Search Endpoint ---
apiRouter.get('/characters/search', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    const results = await cariKarakter(query);
    res.status(200).json({
      success: true,
      message: `Ditemukan ${results.length} karakter untuk pencarian '${query}'`,
      data: results,
    });
  } catch (err: any) {
    handleError(res, 500, err.message || 'Gagal mencari karakter');
  }
});

// --- 1. buatKarakter() -> POST /characters ---
apiRouter.post('/characters', async (req: Request, res: Response) => {
  try {
    const result = await buatKarakter(req.body);
    if (!result.success) {
      return handleError(res, 400, result.error || 'Validasi gagal', result.errors);
    }
    res.status(201).json({
      success: true,
      message: 'Karakter berhasil dibuat di database',
      data: result.data,
    });
  } catch (err: any) {
    handleError(res, 500, err.message || 'Gagal membuat karakter di database');
  }
});

// --- List all characters -> GET /characters ---
apiRouter.get('/characters', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string | undefined;
    const characters = q ? await cariKarakter(q) : await db.getAllCharacters();
    res.status(200).json({
      success: true,
      message: 'Daftar seluruh karakter berhasil diambil dari database',
      data: characters,
    });
  } catch (err: any) {
    handleError(res, 500, err.message || 'Gagal memuat daftar karakter');
  }
});

// --- 2. tampilkanKarakter() -> GET /characters/:id ---
apiRouter.get('/characters/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return handleError(res, 400, 'Parameter ID karakter harus berupa angka');
  }

  try {
    const result = await tampilkanKarakter(id);
    if (!result.success) {
      return handleError(res, 404, result.error || 'Karakter tidak ditemukan');
    }
    res.status(200).json({
      success: true,
      message: 'Detail karakter berhasil diambil dari database',
      data: result.data,
    });
  } catch (err: any) {
    handleError(res, 500, err.message || 'Gagal memuat detail karakter');
  }
});

// --- 3. editKarakter() -> PUT /characters/:id ---
apiRouter.put('/characters/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return handleError(res, 400, 'Parameter ID karakter harus berupa angka');
  }

  try {
    const result = await editKarakter(id, req.body);
    if (!result.success) {
      const status = result.error?.includes('tidak ditemukan') ? 404 : 400;
      return handleError(res, status, result.error || 'Gagal mengubah karakter', result.errors);
    }

    res.status(200).json({
      success: true,
      message: 'Data karakter berhasil diperbarui di database',
      data: result.data,
    });
  } catch (err: any) {
    handleError(res, 500, err.message || 'Gagal mengubah karakter');
  }
});

// --- 4. hapusKarakter() -> DELETE /characters/:id ---
apiRouter.delete('/characters/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return handleError(res, 400, 'Parameter ID karakter harus berupa angka');
  }

  try {
    const result = await hapusKarakter(id);
    if (!result.success) {
      return handleError(res, 404, result.error || 'Karakter tidak ditemukan');
    }

    res.status(200).json({
      success: true,
      message: `Karakter dengan ID ${id} beserta relasinya berhasil dihapus dari database`,
    });
  } catch (err: any) {
    handleError(res, 500, err.message || 'Gagal menghapus karakter');
  }
});

// --- 7. ubahHP() -> PATCH /characters/:id/hp ---
apiRouter.patch('/characters/:id/hp', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return handleError(res, 400, 'Parameter ID karakter harus berupa angka');
  }

  const delta = Number(req.body.delta ?? req.body.amount);
  if (isNaN(delta)) {
    return handleError(res, 400, 'Field delta atau amount harus berupa angka (contoh: -5 untuk damage, +5 untuk heal)');
  }

  try {
    const result = await ubahHP(id, delta);
    if (!result.success) {
      return handleError(res, 404, result.error || 'Karakter tidak ditemukan');
    }

    res.status(200).json({
      success: true,
      message: delta >= 0 ? `Karakter berhasil di-heal sebesar +${delta} HP` : `Karakter menerima damage sebesar ${Math.abs(delta)} HP`,
      data: result.data,
    });
  } catch (err: any) {
    handleError(res, 500, err.message || 'Gagal mengubah HP karakter');
  }
});

// --- 8. tambahXP() -> POST /characters/:id/xp ---
apiRouter.post('/characters/:id/xp', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return handleError(res, 400, 'Parameter ID karakter harus berupa angka');
  }

  const amount = Number(req.body.amount ?? req.body.xp);
  if (isNaN(amount) || amount < 0) {
    return handleError(res, 400, 'Field amount harus berupa angka positif >= 0');
  }

  try {
    const result = await tambahXP(id, amount);
    if (!result.success) {
      return handleError(res, 404, result.error || 'Karakter tidak ditemukan');
    }

    res.status(200).json({
      success: true,
      message: result.data?.leveled_up
        ? `Selamat! Karakter naik ke level ${result.data.level}!`
        : `Berhasil menambahkan ${amount} XP`,
      data: result.data,
    });
  } catch (err: any) {
    handleError(res, 500, err.message || 'Gagal menambahkan XP');
  }
});

// --- 9. cekLevelUp() -> GET /characters/:id/levelup ---
apiRouter.get('/characters/:id/levelup', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return handleError(res, 400, 'Parameter ID karakter harus berupa angka');
  }

  try {
    const result = await cekLevelUp(id);
    if (!result.success) {
      return handleError(res, 404, result.error || 'Karakter tidak ditemukan');
    }

    res.status(200).json({
      success: true,
      message: result.data?.shouldLevelUp
        ? `Karakter siap naik level ke Level ${result.data.eligibleLevel}!`
        : 'Informasi status level up berhasil dimuat',
      data: result.data,
    });
  } catch (err: any) {
    handleError(res, 500, err.message || 'Gagal mengecek status level up');
  }
});

// --- 19. resetKarakter() -> POST /characters/:id/reset ---
apiRouter.post('/characters/:id/reset', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return handleError(res, 400, 'Parameter ID karakter harus berupa angka');
  }

  try {
    const result = await resetKarakter(id);
    if (!result.success) {
      return handleError(res, 404, result.error || 'Karakter tidak ditemukan');
    }

    res.status(200).json({
      success: true,
      message: 'Karakter berhasil di-reset ke kondisi prima (HP terisi penuh)',
      data: result.data,
    });
  } catch (err: any) {
    handleError(res, 500, err.message || 'Gagal mereset karakter');
  }
});

// --- 12. tampilkanInventory() -> GET /characters/:id/inventory ---
apiRouter.get('/characters/:id/inventory', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return handleError(res, 400, 'Parameter ID karakter harus berupa angka');
  }

  try {
    const result = await tampilkanInventory(id);
    if (!result.success) {
      return handleError(res, 404, result.error || 'Karakter tidak ditemukan');
    }

    res.status(200).json({
      success: true,
      message: 'Inventory karakter berhasil diambil dari database',
      data: result.data,
    });
  } catch (err: any) {
    handleError(res, 500, err.message || 'Gagal memuat inventory');
  }
});

// --- 10. tambahInventory() -> POST /characters/:id/inventory ---
apiRouter.post('/characters/:id/inventory', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return handleError(res, 400, 'Parameter ID karakter harus berupa angka');
  }

  try {
    const result = await tambahInventory(id, req.body);
    if (!result.success) {
      const status = result.error?.includes('tidak ditemukan') ? 404 : 400;
      return handleError(res, status, result.error || 'Validasi item gagal', result.errors);
    }

    res.status(201).json({
      success: true,
      message: 'Item berhasil ditambahkan ke inventory database',
      data: result.data,
    });
  } catch (err: any) {
    handleError(res, 500, err.message || 'Gagal menambahkan item inventory');
  }
});

// --- Update Inventory Item -> PUT /characters/:id/inventory/:itemId ---
apiRouter.put('/characters/:id/inventory/:itemId', async (req: Request, res: Response) => {
  const charId = Number(req.params.id);
  const itemId = Number(req.params.itemId);
  if (isNaN(charId) || isNaN(itemId)) {
    return handleError(res, 400, 'Parameter ID harus berupa angka');
  }

  try {
    const updated = await db.updateInventoryItem(itemId, req.body);
    if (!updated || updated.character_id !== charId) {
      return handleError(res, 404, 'Item tidak ditemukan pada karakter ini');
    }

    res.status(200).json({
      success: true,
      message: 'Item inventory berhasil diperbarui di database',
      data: updated,
    });
  } catch (err: any) {
    handleError(res, 500, err.message || 'Gagal memperbarui item inventory');
  }
});

// --- 11. hapusInventory() -> DELETE /characters/:id/inventory/:itemId ---
apiRouter.delete('/characters/:id/inventory/:itemId', async (req: Request, res: Response) => {
  const charId = Number(req.params.id);
  const itemId = Number(req.params.itemId);
  if (isNaN(charId) || isNaN(itemId)) {
    return handleError(res, 400, 'Parameter ID harus berupa angka');
  }

  try {
    const result = await hapusInventory(charId, itemId);
    if (!result.success) {
      return handleError(res, 404, result.error || 'Item tidak ditemukan');
    }

    res.status(200).json({
      success: true,
      message: `Item dengan ID ${itemId} berhasil dihapus dari inventory database`,
    });
  } catch (err: any) {
    handleError(res, 500, err.message || 'Gagal menghapus item inventory');
  }
});

// --- Master Spells Library -> GET /spells ---
apiRouter.get('/spells', async (_req: Request, res: Response) => {
  try {
    const spells = await db.getAllSpells();
    res.status(200).json({
      success: true,
      message: 'Daftar spell master berhasil diambil dari database',
      data: spells,
    });
  } catch (err: any) {
    handleError(res, 500, err.message || 'Gagal memuat master spells');
  }
});

// --- Create Master Spell -> POST /spells ---
apiRouter.post('/spells', async (req: Request, res: Response) => {
  const { spell_name, spell_level, school, casting_time, range_text, duration, description } = req.body;
  if (!spell_name) {
    return handleError(res, 400, 'Field spell_name wajib diisi');
  }

  try {
    const created = await db.createSpell({
      spell_name,
      spell_level: spell_level ?? 0,
      school: school || 'Evocation',
      casting_time: casting_time || '1 action',
      range_text: range_text || '30 feet',
      duration: duration || 'Instantaneous',
      description: description || '',
    });

    res.status(201).json({
      success: true,
      message: 'Spell baru berhasil didaftarkan ke database',
      data: created,
    });
  } catch (err: any) {
    handleError(res, 500, err.message || 'Gagal menambahkan spell ke library');
  }
});

// --- 15. tampilkanSpell() -> GET /characters/:id/spells ---
apiRouter.get('/characters/:id/spells', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return handleError(res, 400, 'Parameter ID karakter harus berupa angka');
  }

  try {
    const result = await tampilkanSpell(id);
    if (!result.success) {
      return handleError(res, 404, result.error || 'Karakter tidak ditemukan');
    }

    res.status(200).json({
      success: true,
      message: 'Daftar spell karakter berhasil diambil dari database',
      data: result.data,
    });
  } catch (err: any) {
    handleError(res, 500, err.message || 'Gagal memuat spell karakter');
  }
});

// --- 13. tambahSpell() -> POST /characters/:id/spells ---
apiRouter.post('/characters/:id/spells', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return handleError(res, 400, 'Parameter ID karakter harus berupa angka');
  }

  const spellId = Number(req.body.spell_id);
  if (isNaN(spellId)) {
    return handleError(res, 400, 'Field spell_id wajib diisi dengan ID spell yang valid');
  }

  try {
    const result = await tambahSpell(id, {
      spell_id: spellId,
      is_prepared: req.body.is_prepared ?? false,
      notes: req.body.notes ?? '',
    });

    if (!result.success) {
      return handleError(res, 404, result.error || 'Gagal menambahkan spell');
    }

    res.status(201).json({
      success: true,
      message: 'Spell berhasil dipelajari/didaftarkan ke database spellbook karakter',
      data: result.data,
    });
  } catch (err: any) {
    handleError(res, 500, err.message || 'Gagal menambahkan spell ke karakter');
  }
});

// --- Toggle Prepared / Update Spell Notes -> PATCH /characters/:id/spells/:spellId ---
apiRouter.patch('/characters/:id/spells/:spellId', async (req: Request, res: Response) => {
  const charId = Number(req.params.id);
  const spellId = Number(req.params.spellId);
  if (isNaN(charId) || isNaN(spellId)) {
    return handleError(res, 400, 'Parameter ID harus berupa angka');
  }

  try {
    const updated = await db.updateCharacterSpell(charId, spellId, req.body.is_prepared, req.body.notes);
    if (!updated) {
      return handleError(res, 404, 'Spell tidak terpasang pada karakter ini');
    }

    res.status(200).json({
      success: true,
      message: 'Status persiapan spell berhasil diperbarui di database',
      data: updated,
    });
  } catch (err: any) {
    handleError(res, 500, err.message || 'Gagal memperbarui status spell');
  }
});

// --- 14. hapusSpell() -> DELETE /characters/:id/spells/:spellId ---
apiRouter.delete('/characters/:id/spells/:spellId', async (req: Request, res: Response) => {
  const charId = Number(req.params.id);
  const spellId = Number(req.params.spellId);
  if (isNaN(charId) || isNaN(spellId)) {
    return handleError(res, 400, 'Parameter ID harus berupa angka');
  }

  try {
    const result = await hapusSpell(charId, spellId);
    if (!result.success) {
      return handleError(res, 404, result.error || 'Spell tidak terdaftar pada karakter');
    }

    res.status(200).json({
      success: true,
      message: `Spell dengan ID ${spellId} berhasil dihapus dari spellbook karakter`,
    });
  } catch (err: any) {
    handleError(res, 500, err.message || 'Gagal menghapus spell dari karakter');
  }
});

// --- Character Saves (Snapshots) -> GET /characters/:id/saves ---
apiRouter.get('/characters/:id/saves', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return handleError(res, 400, 'Parameter ID karakter harus berupa angka');
  }

  try {
    const saves = await db.getSavesByCharacter(id);
    res.status(200).json({
      success: true,
      message: 'Daftar backup snapshot karakter berhasil dimuat dari database',
      data: saves,
    });
  } catch (err: any) {
    handleError(res, 500, err.message || 'Gagal memuat daftar backup');
  }
});

// --- 16. simpanData() -> POST /characters/:id/saves ---
apiRouter.post('/characters/:id/saves', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return handleError(res, 400, 'Parameter ID karakter harus berupa angka');
  }

  const saveName = req.body.save_name || 'Manual save snapshot';
  try {
    const result = await simpanData(id, saveName);
    if (!result.success) {
      return handleError(res, 404, result.error || 'Gagal membuat backup');
    }

    res.status(201).json({
      success: true,
      message: 'Snapshot backup karakter berhasil disimpan ke database',
      data: result.data,
    });
  } catch (err: any) {
    handleError(res, 500, err.message || 'Gagal menyimpan snapshot');
  }
});

// --- 17. muatData() -> POST /characters/:id/restore/:saveId ---
apiRouter.post('/characters/:id/restore/:saveId', async (req: Request, res: Response) => {
  const charId = Number(req.params.id);
  const saveId = Number(req.params.saveId);
  if (isNaN(charId) || isNaN(saveId)) {
    return handleError(res, 400, 'Parameter ID harus berupa angka');
  }

  try {
    const result = await muatData(charId, saveId);
    if (!result.success) {
      return handleError(res, 404, result.error || 'Snapshot tidak ditemukan');
    }

    res.status(200).json({
      success: true,
      message: `Data karakter berhasil dipulihkan dari snapshot ID ${saveId}`,
      data: result.data,
    });
  } catch (err: any) {
    handleError(res, 500, err.message || 'Gagal memulihkan data dari snapshot');
  }
});

// --- Delete Save -> DELETE /characters/:id/saves/:saveId ---
apiRouter.delete('/characters/:id/saves/:saveId', async (req: Request, res: Response) => {
  const charId = Number(req.params.id);
  const saveId = Number(req.params.saveId);
  if (isNaN(charId) || isNaN(saveId)) {
    return handleError(res, 400, 'Parameter ID harus berupa angka');
  }

  try {
    const deleted = await db.deleteSave(charId, saveId);
    if (!deleted) {
      return handleError(res, 404, 'Snapshot save tidak ditemukan');
    }

    res.status(200).json({
      success: true,
      message: `Snapshot save ID ${saveId} berhasil dihapus dari database`,
    });
  } catch (err: any) {
    handleError(res, 500, err.message || 'Gagal menghapus snapshot');
  }
});

// --- Export Collections & Schema ---
apiRouter.get('/export/postman', (req: Request, res: Response) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const collection = generatePostmanCollection(baseUrl);
  res.setHeader('Content-Disposition', 'attachment; filename="Tabletop_Player_Sheet_Manager.postman_collection.json"');
  res.status(200).json(collection);
});

apiRouter.get('/export/thunder-client', (req: Request, res: Response) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const collection = generateThunderCollection(baseUrl);
  res.setHeader('Content-Disposition', 'attachment; filename="thunder-collection_tabletop_manager.json"');
  res.status(200).json(collection);
});

apiRouter.get('/export/schema.sql', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="tabletop_database.sql"');
  res.status(200).send(RAW_DATABASE_SQL);
});
