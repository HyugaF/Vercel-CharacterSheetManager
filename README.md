# Tabletop Player Sheet Manager - REST API

**Tugas Akhir Learning Labs: Backend Development**  
Nama Project: **Tabletop Player Sheet Manager**  
Status: **Production Ready (Vercel & Node.js)**  

---

## 1. Deskripsi Singkat Project

**Tabletop Player Sheet Manager** adalah backend REST API relasional yang dibangun untuk mengelola lembar karakter (*character sheet*) permainan meja (*Tabletop RPG* / Dungeons & Dragons 5e). 

Fokus utama proyek ini adalah backend development yang andal dengan skema database relasional multi-tabel, mencakup:
- **Manajemen Karakter Lengkap**: Mengelola data dasar (nama, ras, class, level 1–20, background, alignment) dan ability scores (Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma).
- **Kalkulasi Aturan Game Otomatis**: Menghitung ability modifier (`floor((score - 10) / 2)`), sistem pelacakan Hit Points (HP) dengan validasi batas (`0 <= current_hp <= max_hp`), serta akumulasi Experience Points (XP) dan auto level-up sesuai tabel ambang batas D&D 5e.
- **Relasi Relasional Multi-Tabel**: Relasi 1:1 untuk stats, 1:M untuk inventory perlengkapan, M:N pivot untuk spellbook sihir yang dikuasai dan dipersiapkan (*prepared spells*), serta 1:M untuk pencadangan snapshot (*character saves*).
- **Validasi dan Error Handling**: Validasi skema ketat dengan respon status code HTTP standar (`200`, `201`, `400`, `404`, `500`) dan format pesan JSON informatif.
- **Frontend Interaktif (Opsional)**: Antarmuka lembar karakter D&D interaktif untuk visualisasi dan demonstrasi data.

---

## 2. Skema Database & ERD (Minimal 5 Tabel)

Database dirancang menggunakan **6 tabel relasional** yang saling terhubung menggunakan **Foreign Key** dengan aturan penghapusan berantai (*ON DELETE CASCADE*) dan *Check Constraints*.

### Diagram Relasi ERD:

```
┌─────────────────────────────────┐       1:1 (CASCADE)       ┌─────────────────────────────────┐
│           characters            ├──────────────────────────►│         character_stats         │
├─────────────────────────────────┤                           ├─────────────────────────────────┤
│ PK  character_id  (BIGINT)      │                           │ PK,FK character_id (BIGINT)     │
│     character_name (VARCHAR)    │                           │       strength     (SMALLINT)   │
│     race           (VARCHAR)    │                           │       dexterity    (SMALLINT)   │
│     character_class(VARCHAR)    │                           │       constitution (SMALLINT)   │
│     character_level(SMALLINT)   │                           │       intelligence (SMALLINT)   │
│     experience_pts (INTEGER)    │                           │       wisdom       (SMALLINT)   │
│     background     (VARCHAR)    │                           │       charisma     (SMALLINT)   │
│     alignment      (VARCHAR)    │                           │       max_hp       (INTEGER)    │
│     created_at     (TIMESTAMPTZ)│                           │       current_hp   (INTEGER)    │
│     updated_at     (TIMESTAMPTZ)│                           │       armor_class  (SMALLINT)   │
└──────────────┬──────────────────┘                           └─────────────────────────────────┘
               │
               │ 1:M (CASCADE)
               ├──────────────────────────────────────────────┐
               │                                              │ 1:M (CASCADE)
               ▼                                              ▼
┌─────────────────────────────────┐            ┌─────────────────────────────────┐
│        inventory_items          │            │         character_saves         │
├─────────────────────────────────┤            ├─────────────────────────────────┤
│ PK  item_id      (BIGINT)       │            │ PK  save_id      (BIGINT)       │
│ FK  character_id (BIGINT)       │            │ FK  character_id (BIGINT)       │
│     item_name    (VARCHAR)      │            │     save_name    (VARCHAR)      │
│     quantity     (INTEGER)      │            │     snapshot     (JSONB)        │
│     weight       (NUMERIC)      │            │     saved_at     (TIMESTAMPTZ)  │
│     description  (TEXT)         │            └─────────────────────────────────┘
│     added_at     (TIMESTAMPTZ)  │
└─────────────────────────────────┘
               │
               │ M:N (Melalui Tabel Pivot)
               ▼
┌─────────────────────────────────┐       M:1                 ┌─────────────────────────────────┐
│        character_spells         ├──────────────────────────►│             spells              │
├─────────────────────────────────┤                           ├─────────────────────────────────┤
│ PK,FK character_id (BIGINT)     │                           │ PK  spell_id     (BIGINT)       │
│ PK,FK spell_id     (BIGINT)     │                           │     spell_name   (VARCHAR, UK)  │
│       is_prepared  (BOOLEAN)    │                           │     spell_level  (SMALLINT)     │
│       notes        (TEXT)       │                           │     school       (VARCHAR)      │
│       added_at     (TIMESTAMPTZ)│                           │     casting_time (VARCHAR)      │
└─────────────────────────────────┘                           │     range_text   (VARCHAR)      │
                                                              │     duration     (VARCHAR)      │
                                                              │     description  (TEXT)         │
                                                              └─────────────────────────────────┘
```

### Penjelasan 6 Tabel Relasional:
1. **`characters`** (Resource Utama): Menyimpan identitas inti karakter (nama, ras, class, level, XP, latar belakang, dan alignment).
2. **`character_stats`** (Relasi 1:1): Terhubung ke `characters` via `character_id`. Menyimpan 6 ability scores (rentang nilai 1–30), Max HP, Current HP (`current_hp <= max_hp`), dan Armor Class.
3. **`inventory_items`** (Relasi 1:M): Terhubung ke `characters` via `character_id`. Menyimpan peralatan, jumlah (`quantity > 0`), dan berat beban (`weight >= 0`).
4. **`spells`** (Master Table): Pustaka master mantra sihir (nama unik, level 0–9, sekolah sihir, casting time, range, durasi, dan deskripsi).
5. **`character_spells`** (Tabel Pivot M:N): Menghubungkan banyak karakter ke banyak spell dengan atribut khusus seperti status persiapan (`is_prepared`) dan catatan mantra (`notes`).
6. **`character_saves`** (Relasi 1:M): Terhubung ke `characters` via `character_id`. Menyimpan snapshot riwayat backup karakter dalam format dokumen `JSONB`.

File skema DDL SQL lengkap tersedia di file `database.sql`.

---

## 3. Link URL Deployment

- **Public Production Deployment URL**: `https://tabletop-player-sheet-manager.vercel.app`
- **Base API URL**: `https://tabletop-player-sheet-manager.vercel.app/api`
- **Vercel Configuration**: Tersedia berkas `vercel.json` dan serverless API handler `api/index.ts` untuk kemudahan deployment ke platform Vercel.

---

## 4. Dokumentasi Pemanggilan REST API

Berikut adalah format pemanggilan untuk setiap endpoint REST API sesuai dengan spesifikasi penugasan:

---

### 1. Mengambil Seluruh Karakter
- **Method**       : `GET`
- **URL**          : `https://tabletop-player-sheet-manager.vercel.app/api/characters`
- **Deskripsi**    : Mengambil daftar semua karakter yang tersimpan di database
- **Headers**      : `Accept: application/json`
- **Request Body** : *(None)*
- **Response Sukses (200)**:
```json
{
  "success": true,
  "message": "Daftar seluruh karakter berhasil diambil",
  "data": [
    {
      "character_id": 1,
      "character_name": "Aric Stormcaller",
      "race": "Human",
      "character_class": "Wizard",
      "character_level": 3,
      "experience_points": 1200,
      "background": "Sage",
      "alignment": "Neutral Good",
      "created_at": "2026-10-24T12:39:35.555Z",
      "updated_at": "2026-10-24T12:39:35.555Z"
    }
  ]
}
```
- **Response Error (500)**:
```json
{
  "success": false,
  "error": "Terjadi kesalahan internal pada server database"
}
```

---

### 2. Mengambil Detail Karakter Berdasarkan ID
- **Method**       : `GET`
- **URL**          : `https://tabletop-player-sheet-manager.vercel.app/api/characters/1`
- **Deskripsi**    : Menampilkan detail lengkap karakter beserta stats kemampuan, ability modifier, inventory, dan spell
- **Headers**      : `Accept: application/json`
- **Request Body** : *(None)*
- **Response Sukses (200)**:
```json
{
  "success": true,
  "message": "Detail karakter berhasil diambil",
  "data": {
    "character_id": 1,
    "character_name": "Aric Stormcaller",
    "race": "Human",
    "character_class": "Wizard",
    "character_level": 3,
    "experience_points": 1200,
    "stats": {
      "character_id": 1,
      "strength": 9,
      "dexterity": 14,
      "constitution": 14,
      "intelligence": 17,
      "wisdom": 12,
      "charisma": 10,
      "max_hp": 20,
      "current_hp": 18,
      "armor_class": 12
    },
    "modifiers": {
      "strength": -1,
      "dexterity": 2,
      "constitution": 2,
      "intelligence": 3,
      "wisdom": 1,
      "charisma": 0
    },
    "inventory": [],
    "spells": [],
    "total_weight": 9.5
  }
}
```
- **Response Error (404)**:
```json
{
  "success": false,
  "error": "Karakter dengan ID 999 tidak ditemukan"
}
```

---

### 3. Menambahkan Karakter Baru
- **Method**       : `POST`
- **URL**          : `https://tabletop-player-sheet-manager.vercel.app/api/characters`
- **Deskripsi**    : Menambahkan karakter baru beserta nilai ability score awal
- **Headers**      : `Content-Type: application/json`
- **Request Body** :
```json
{
  "character_name": "Gimli Son of Gloin",
  "race": "Dwarf",
  "character_class": "Barbarian",
  "character_level": 3,
  "experience_points": 1200,
  "background": "Soldier",
  "alignment": "Chaotic Good",
  "stats": {
    "strength": 18,
    "dexterity": 12,
    "constitution": 16,
    "intelligence": 8,
    "wisdom": 12,
    "charisma": 10,
    "max_hp": 35,
    "current_hp": 35,
    "armor_class": 15
  }
}
```
- **Response Sukses (201)**:
```json
{
  "success": true,
  "message": "Karakter berhasil dibuat",
  "data": {
    "character_id": 4,
    "character_name": "Gimli Son of Gloin",
    "race": "Dwarf",
    "character_class": "Barbarian",
    "character_level": 3,
    "experience_points": 1200
  }
}
```
- **Response Error (400)**:
```json
{
  "success": false,
  "error": "Validasi data karakter gagal",
  "errors": [
    "Nama karakter (character_name) wajib diisi",
    "Ras karakter (race) wajib diisi",
    "Class karakter (character_class) wajib diisi"
  ]
}
```

---

### 4. Mengubah Data Karakter
- **Method**       : `PUT`
- **URL**          : `https://tabletop-player-sheet-manager.vercel.app/api/characters/1`
- **Deskripsi**    : Mengubah informasi karakter yang sudah tersimpan
- **Headers**      : `Content-Type: application/json`
- **Request Body** :
```json
{
  "character_name": "Aric the Archmage",
  "stats": {
    "intelligence": 18,
    "armor_class": 13
  }
}
```
- **Response Sukses (200)**:
```json
{
  "success": true,
  "message": "Data karakter berhasil diperbarui",
  "data": {
    "character_id": 1,
    "character_name": "Aric the Archmage",
    "stats": {
      "intelligence": 18,
      "armor_class": 13
    }
  }
}
```
- **Response Error (404)**:
```json
{
  "success": false,
  "error": "Karakter dengan ID 999 tidak ditemukan"
}
```

---

### 5. Menghapus Karakter
- **Method**       : `DELETE`
- **URL**          : `https://tabletop-player-sheet-manager.vercel.app/api/characters/1`
- **Deskripsi**    : Menghapus character sheet dari sistem beserta seluruh relasinya (ON DELETE CASCADE)
- **Headers**      : `Accept: application/json`
- **Request Body** : *(None)*
- **Response Sukses (200)**:
```json
{
  "success": true,
  "message": "Karakter dengan ID 1 beserta relasinya berhasil dihapus"
}
```
- **Response Error (404)**:
```json
{
  "success": false,
  "error": "Karakter dengan ID 999 tidak ditemukan"
}
```

---

### 6. Mengubah Hit Points (HP Karakter)
- **Method**       : `PATCH`
- **URL**          : `https://tabletop-player-sheet-manager.vercel.app/api/characters/1/hp`
- **Deskripsi**    : Menambah atau mengurangi HP karakter (delta < 0 untuk damage, delta > 0 untuk heal)
- **Headers**      : `Content-Type: application/json`
- **Request Body** :
```json
{
  "delta": -5
}
```
- **Response Sukses (200)**:
```json
{
  "success": true,
  "message": "Karakter menerima damage sebesar 5 HP",
  "data": {
    "current_hp": 13,
    "max_hp": 20,
    "delta": -5
  }
}
```
- **Response Error (400)**:
```json
{
  "success": false,
  "error": "Field delta atau amount harus berupa angka (contoh: -5 untuk damage, +5 untuk heal)"
}
```

---

### 7. Menambahkan Experience Points (XP) & Naik Level
- **Method**       : `POST`
- **URL**          : `https://tabletop-player-sheet-manager.vercel.app/api/characters/1/xp`
- **Deskripsi**    : Menambahkan XP kepada karakter dan menaikkan level jika mencapai syarat batas XP
- **Headers**      : `Content-Type: application/json`
- **Request Body** :
```json
{
  "amount": 1600
}
```
- **Response Sukses (200)**:
```json
{
  "success": true,
  "message": "Selamat! Karakter naik ke level 4!",
  "data": {
    "previous_xp": 1200,
    "new_xp": 2800,
    "level": 4,
    "leveled_up": true,
    "eligible_level": 4
  }
}
```
- **Response Error (400)**:
```json
{
  "success": false,
  "error": "Field amount harus berupa angka positif >= 0"
}
```

---

### 8. Menambahkan Item ke Inventory
- **Method**       : `POST`
- **URL**          : `https://tabletop-player-sheet-manager.vercel.app/api/characters/1/inventory`
- **Deskripsi**    : Menambahkan item baru ke dalam inventory karakter
- **Headers**      : `Content-Type: application/json`
- **Request Body** :
```json
{
  "item_name": "Potion of Greater Healing",
  "quantity": 2,
  "weight": 1.0,
  "description": "Restores 4d4 + 4 hit points when consumed"
}
```
- **Response Sukses (201)**:
```json
{
  "success": true,
  "message": "Item berhasil ditambahkan ke inventory",
  "data": {
    "item_id": 5,
    "character_id": 1,
    "item_name": "Potion of Greater Healing",
    "quantity": 2,
    "weight": 1.0,
    "description": "Restores 4d4 + 4 hit points when consumed"
  }
}
```
- **Response Error (400)**:
```json
{
  "success": false,
  "error": "Data item inventory tidak valid",
  "errors": [
    "Nama item (item_name) wajib diisi"
  ]
}
```

---

### 9. Menghubungkan Spell ke Karakter
- **Method**       : `POST`
- **URL**          : `https://tabletop-player-sheet-manager.vercel.app/api/characters/1/spells`
- **Deskripsi**    : Menghubungkan spell master ke spellbook karakter via tabel pivot
- **Headers**      : `Content-Type: application/json`
- **Request Body** :
```json
{
  "spell_id": 4,
  "is_prepared": true,
  "notes": "Emergency party healing"
}
```
- **Response Sukses (201)**:
```json
{
  "success": true,
  "message": "Spell berhasil dipelajari/didaftarkan ke spellbook karakter",
  "data": {
    "character_id": 1,
    "spell_id": 4,
    "is_prepared": true,
    "notes": "Emergency party healing"
  }
}
```
- **Response Error (404)**:
```json
{
  "success": false,
  "error": "Spell dengan ID 4 tidak ditemukan di master spell library"
}
```

---

### 10. Menyimpan Snapshot Backup Karakter (simpanData)
- **Method**       : `POST`
- **URL**          : `https://tabletop-player-sheet-manager.vercel.app/api/characters/1/saves`
- **Deskripsi**    : Menyimpan seluruh kondisi karakter, stats, inventory, dan spells ke dalam format snapshot JSONB
- **Headers**      : `Content-Type: application/json`
- **Request Body** :
```json
{
  "save_name": "Sebelum Masuk Gua Naga Merah"
}
```
- **Response Sukses (201)**:
```json
{
  "success": true,
  "message": "Snapshot backup karakter berhasil disimpan ke database",
  "data": {
    "save_id": 2,
    "character_id": 1,
    "save_name": "Sebelum Masuk Gua Naga Merah",
    "saved_at": "2026-10-24T12:55:00.000Z"
  }
}
```
- **Response Error (404)**:
```json
{
  "success": false,
  "error": "Gagal menyimpan snapshot, karakter 1 tidak ditemukan"
}
```

---

### 11. Memulihkan Snapshot Karakter (muatData)
- **Method**       : `POST`
- **URL**          : `https://tabletop-player-sheet-manager.vercel.app/api/characters/1/restore/2`
- **Deskripsi**    : Memulihkan kondisi karakter dari snapshot tersimpan
- **Headers**      : `Accept: application/json`
- **Request Body** : *(None)*
- **Response Sukses (200)**:
```json
{
  "success": true,
  "message": "Data karakter berhasil dipulihkan dari snapshot ID 2",
  "data": {
    "character_id": 1,
    "character_name": "Aric the Archmage"
  }
}
```
- **Response Error (404)**:
```json
{
  "success": false,
  "error": "Snapshot ID 2 tidak ditemukan untuk karakter 1"
}
```

---

## 5. Cara Menjalankan Project Secara Lokal

### Prasyarat:
- Node.js (v18 atau lebih baru)
- npm / npx

### Langkah-langkah:
1. **Clone repository ini**:
   ```bash
   git clone <URL_REPOSITORY_ANDA>
   cd tabletop-player-sheet-manager
   ```

2. **Install dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan unit test logika aturan game**:
   ```bash
   npm test
   ```

4. **Jalankan aplikasi (Full-Stack dev server port 3000)**:
   ```bash
   npm run dev
   ```

5. **Akses aplikasi**:
   - Web App UI: `http://localhost:3000`
   - REST API Base: `http://localhost:3000/api`

---

## 6. Pengujian & Bukti Uji (Thunder Client & Postman)

Sesuai instruksi tugas akhir, seluruh pengujian REST API telah didokumentasikan dalam format resmi:
- **Dokumen Bukti Pengujian Lengkap**: Lihat berkas [`DOKUMEN_PENGUJIAN.md`](./DOKUMEN_PENGUJIAN.md) di repository ini.
- **Export Koleksi Postman**: [`postman_collection.json`](./postman_collection.json)
- **Export Koleksi Thunder Client**: [`thunder-collection.json`](./thunder-collection.json)

---

## 7. Daftar 20 Fungsi Utama Project

Seluruh 20 fungsi yang dirancang pada fase persiapan (*Project Preparation Phase 1–2*) telah diimplementasikan lengkap:

1. `buatKarakter()` — Membuat character sheet baru (`POST /api/characters`).
2. `tampilkanKarakter()` — Menampilkan informasi lengkap character sheet (`GET /api/characters/:id`).
3. `editKarakter()` — Mengubah informasi karakter yang tersimpan (`PUT /api/characters/:id`).
4. `hapusKarakter()` — Menghapus character sheet dari sistem (`DELETE /api/characters/:id`).
5. `cariKarakter()` — Mencari karakter berdasarkan nama atau ID (`GET /api/characters/search?q=...`).
6. `hitungModifier()` — Menghitung ability modifier (`floor((score - 10) / 2)`).
7. `ubahHP()` — Menambah atau mengurangi HP karakter (`PATCH /api/characters/:id/hp`).
8. `tambahXP()` — Menambahkan experience point ke karakter (`POST /api/characters/:id/xp`).
9. `cekLevelUp()` — Memeriksa syarat kenaikan level karakter (`GET /api/characters/:id/levelup`).
10. `tambahInventory()` — Menambahkan item baru ke inventory (`POST /api/characters/:id/inventory`).
11. `hapusInventory()` — Menghapus item dari inventory (`DELETE /api/characters/:id/inventory/:itemId`).
12. `tampilkanInventory()` — Menampilkan seluruh item di inventory (`GET /api/characters/:id/inventory`).
13. `tambahSpell()` — Menambahkan spell yang dikuasai karakter (`POST /api/characters/:id/spells`).
14. `hapusSpell()` — Menghapus spell dari spellbook karakter (`DELETE /api/characters/:id/spells/:spellId`).
15. `tampilkanSpell()` — Menampilkan daftar spell karakter (`GET /api/characters/:id/spells`).
16. `simpanData()` — Menyimpan snapshot data karakter (`POST /api/characters/:id/saves`).
17. `muatData()` — Memulihkan data karakter dari snapshot tersimpan (`POST /api/characters/:id/restore/:saveId`).
18. `validasiData()` — Memastikan format dan batasan input sesuai aturan (*middleware & helper*).
19. `resetKarakter()` — Mengembalikan kondisi karakter ke status prima (`POST /api/characters/:id/reset`).
20. `handleError()` — Menangani kesalahan input dan mengirim respon JSON error terstandar.

---

## 8. Checklist Sebelum Mengumpulkan

- [x] Minimal 5 tabel dengan relasi foreign key (Tersedia 6 tabel relasional)
- [x] Ada endpoint GET, POST, PUT/PATCH, dan DELETE
- [x] API sudah live dan bisa diakses publik
- [x] Semua endpoint sudah dites lewat Postman / Thunder Client
- [x] Dokumentasi lengkap dan ERD tersedia
- [x] Tidak ada password atau secret key di repository
