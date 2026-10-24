# DOKUMEN BUKTI PENGUJIAN REST API

**Project:** Tabletop Player Sheet Manager  
**Mata Kuliah / Program:** Tugas Akhir Learning Labs: Backend Development  
**Tools Pengujian:** Thunder Client (VS Code) & Postman  
**File Koleksi Terlampir:** `thunder-collection.json` & `postman_collection.json`  
**Base URL Pengujian Publik (Deployment):** `https://tabletop-player-sheet-manager.vercel.app`  
**Base URL Pengujian Lokal:** `http://localhost:3000`  
**Tanggal Pengujian:** 24 Oktober 2026  
**Status Pengujian:** **100% PASS (24 / 24 Skenario Berhasil)**  

---

## 1. Ringkasan Pengujian

Pengujian dilakukan untuk membuktikan bahwa seluruh endpoint REST API pada proyek **Tabletop Player Sheet Manager** berfungsi dengan benar, menggunakan HTTP method yang sesuai (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`), mengembalikan kode status HTTP yang tepat (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`), serta menyajikan data dan pesan error dalam format JSON yang terstruktur.

| No | Modul | Endpoint | Method | Status Yang Diharapkan | Hasil Uji |
|---|---|---|---|---|---|
| 1 | Characters | `/api/characters` | GET | `200 OK` | **PASS** |
| 2 | Characters | `/api/characters/1` | GET | `200 OK` | **PASS** |
| 3 | Characters | `/api/characters/999` (Not Found) | GET | `404 Not Found` | **PASS** |
| 4 | Characters | `/api/characters` | POST | `201 Created` | **PASS** |
| 5 | Characters | `/api/characters` (Validation Error) | POST | `400 Bad Request` | **PASS** |
| 6 | Characters | `/api/characters/1` | PUT | `200 OK` | **PASS** |
| 7 | Characters | `/api/characters/3` | DELETE | `200 OK` | **PASS** |
| 8 | Characters | `/api/characters/search?q=wizard` | GET | `200 OK` | **PASS** |
| 9 | Combat / HP | `/api/characters/1/hp` | PATCH | `200 OK` | **PASS** |
| 10 | Combat / HP | `/api/characters/1/hp` (Bad Input) | PATCH | `400 Bad Request` | **PASS** |
| 11 | Progres XP | `/api/characters/1/xp` | POST | `200 OK` | **PASS** |
| 12 | Level Up | `/api/characters/1/levelup` | GET | `200 OK` | **PASS** |
| 13 | Reset Status | `/api/characters/1/reset` | POST | `200 OK` | **PASS** |
| 14 | Inventory | `/api/characters/1/inventory` | GET | `200 OK` | **PASS** |
| 15 | Inventory | `/api/characters/1/inventory` | POST | `201 Created` | **PASS** |
| 16 | Inventory | `/api/characters/1/inventory/1` | DELETE | `200 OK` | **PASS** |
| 17 | Spells | `/api/spells` | GET | `200 OK` | **PASS** |
| 18 | Spells | `/api/characters/1/spells` | GET | `200 OK` | **PASS** |
| 19 | Spells | `/api/characters/1/spells` | POST | `201 Created` | **PASS** |
| 20 | Spells | `/api/characters/1/spells/1` | PATCH | `200 OK` | **PASS** |
| 21 | Spells | `/api/characters/1/spells/1` | DELETE | `200 OK` | **PASS** |
| 22 | Backup Saves | `/api/characters/1/saves` | GET | `200 OK` | **PASS** |
| 23 | Backup Saves | `/api/characters/1/saves` | POST | `201 Created` | **PASS** |
| 24 | Backup Saves | `/api/characters/1/restore/1` | POST | `200 OK` | **PASS** |

---

## 2. Bukti Pengujian Detail Per Endpoint

Berikut adalah rincian rekaman request dan response dari setiap skenario pengujian menggunakan Thunder Client / Postman:

---

### Pengujian 01: Mengambil Seluruh Karakter
- **Method**: `GET`
- **URL**: `https://tabletop-player-sheet-manager.vercel.app/api/characters`
- **Headers**:
  ```http
  Accept: application/json
  ```
- **Request Body**: *(None)*
- **Status Response**: `200 OK`
- **Response Body**:
  ```json
  {
    "success": true,
    "message": "Daftar seluruh karakter berhasil diambil",
    "data": [
      {
        "character_id": 3,
        "character_name": "Balgor Ironheart",
        "race": "Hill Dwarf",
        "character_class": "Cleric",
        "character_level": 1,
        "experience_points": 150,
        "background": "Acolyte",
        "alignment": "Lawful Good",
        "created_at": "2026-10-24T12:39:35.555Z",
        "updated_at": "2026-10-24T12:39:35.555Z"
      },
      {
        "character_id": 2,
        "character_name": "Kaelen Swiftstrike",
        "race": "Wood Elf",
        "character_class": "Rogue",
        "character_level": 2,
        "experience_points": 450,
        "background": "Criminal",
        "alignment": "Chaotic Good",
        "created_at": "2026-10-24T12:39:35.555Z",
        "updated_at": "2026-10-24T12:39:35.555Z"
      },
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
- **Hasil**: **PASS (BERHASIL)**

---

### Pengujian 02: Mengambil Detail Karakter Berdasarkan ID
- **Method**: `GET`
- **URL**: `https://tabletop-player-sheet-manager.vercel.app/api/characters/1`
- **Headers**:
  ```http
  Accept: application/json
  ```
- **Request Body**: *(None)*
- **Status Response**: `200 OK`
- **Response Body**:
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
      "background": "Sage",
      "alignment": "Neutral Good",
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
      "inventory": [
        {
          "item_id": 1,
          "character_id": 1,
          "item_name": "Spellbook (Bound in Blue Leather)",
          "quantity": 1,
          "weight": 3,
          "description": "Contains prepared arcane spells and rituals.",
          "added_at": "2026-10-24T12:39:35.556Z"
        }
      ],
      "spells": [
        {
          "character_id": 1,
          "spell_id": 1,
          "is_prepared": true,
          "notes": "Cantrip attack",
          "spell": {
            "spell_id": 1,
            "spell_name": "Fire Bolt",
            "spell_level": 0,
            "school": "Evocation"
          }
        }
      ],
      "saves_count": 1,
      "total_weight": 9.5,
      "next_level_xp": 2700,
      "level_progress": 44
    }
  }
  ```
- **Hasil**: **PASS (BERHASIL)**

---

### Pengujian 03: Mengambil Karakter ID yang Tidak Ada (Uji Error 404)
- **Method**: `GET`
- **URL**: `https://tabletop-player-sheet-manager.vercel.app/api/characters/999`
- **Headers**:
  ```http
  Accept: application/json
  ```
- **Request Body**: *(None)*
- **Status Response**: `404 Not Found`
- **Response Body**:
  ```json
  {
    "success": false,
    "error": "Karakter dengan ID 999 tidak ditemukan"
  }
  ```
- **Hasil**: **PASS (BERHASIL)**

---

### Pengujian 04: Menambahkan Karakter Baru
- **Method**: `POST`
- **URL**: `https://tabletop-player-sheet-manager.vercel.app/api/characters`
- **Headers**:
  ```http
  Content-Type: application/json
  Accept: application/json
  ```
- **Request Body**:
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
- **Status Response**: `201 Created`
- **Response Body**:
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
      "experience_points": 1200,
      "background": "Soldier",
      "alignment": "Chaotic Good",
      "stats": {
        "character_id": 4,
        "strength": 18,
        "dexterity": 12,
        "constitution": 16,
        "intelligence": 8,
        "wisdom": 12,
        "charisma": 10,
        "max_hp": 35,
        "current_hp": 35,
        "armor_class": 15
      },
      "modifiers": {
        "strength": 4,
        "dexterity": 1,
        "constitution": 3,
        "intelligence": -1,
        "wisdom": 1,
        "charisma": 0
      }
    }
  }
  ```
- **Hasil**: **PASS (BERHASIL)**

---

### Pengujian 05: Validasi Gagal Saat Buat Karakter (Uji Error 400)
- **Method**: `POST`
- **URL**: `https://tabletop-player-sheet-manager.vercel.app/api/characters`
- **Headers**:
  ```http
  Content-Type: application/json
  Accept: application/json
  ```
- **Request Body**:
  ```json
  {
    "character_name": "",
    "race": "",
    "character_class": ""
  }
  ```
- **Status Response**: `400 Bad Request`
- **Response Body**:
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
- **Hasil**: **PASS (BERHASIL)**

---

### Pengujian 06: Mengubah Data Karakter (PUT)
- **Method**: `PUT`
- **URL**: `https://tabletop-player-sheet-manager.vercel.app/api/characters/1`
- **Headers**:
  ```http
  Content-Type: application/json
  Accept: application/json
  ```
- **Request Body**:
  ```json
  {
    "character_name": "Aric the Archmage",
    "stats": {
      "intelligence": 18,
      "armor_class": 13
    }
  }
  ```
- **Status Response**: `200 OK`
- **Response Body**:
  ```json
  {
    "success": true,
    "message": "Data karakter berhasil diperbarui",
    "data": {
      "character_id": 1,
      "character_name": "Aric the Archmage",
      "race": "Human",
      "character_class": "Wizard",
      "stats": {
        "character_id": 1,
        "strength": 9,
        "dexterity": 14,
        "constitution": 14,
        "intelligence": 18,
        "wisdom": 12,
        "charisma": 10,
        "max_hp": 20,
        "current_hp": 18,
        "armor_class": 13
      },
      "modifiers": {
        "intelligence": 4
      }
    }
  }
  ```
- **Hasil**: **PASS (BERHASIL)**

---

### Pengujian 07: Menghapus Karakter (DELETE - CASCADE)
- **Method**: `DELETE`
- **URL**: `https://tabletop-player-sheet-manager.vercel.app/api/characters/3`
- **Headers**:
  ```http
  Accept: application/json
  ```
- **Request Body**: *(None)*
- **Status Response**: `200 OK`
- **Response Body**:
  ```json
  {
    "success": true,
    "message": "Karakter dengan ID 3 beserta relasinya berhasil dihapus"
  }
  ```
- **Hasil**: **PASS (BERHASIL)**

---

### Pengujian 08: Mencari Karakter Berdasarkan Kata Kunci
- **Method**: `GET`
- **URL**: `https://tabletop-player-sheet-manager.vercel.app/api/characters/search?q=wizard`
- **Headers**:
  ```http
  Accept: application/json
  ```
- **Status Response**: `200 OK`
- **Response Body**:
  ```json
  {
    "success": true,
    "message": "Ditemukan 1 karakter untuk pencarian 'wizard'",
    "data": [
      {
        "character_id": 1,
        "character_name": "Aric the Archmage",
        "race": "Human",
        "character_class": "Wizard"
      }
    ]
  }
  ```
- **Hasil**: **PASS (BERHASIL)**

---

### Pengujian 09: Mengubah Hit Points / Damage (PATCH)
- **Method**: `PATCH`
- **URL**: `https://tabletop-player-sheet-manager.vercel.app/api/characters/1/hp`
- **Headers**:
  ```http
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "delta": -5
  }
  ```
- **Status Response**: `200 OK`
- **Response Body**:
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
- **Hasil**: **PASS (BERHASIL)**

---

### Pengujian 10: Validasi Error Saat Mengubah HP (Uji Error 400)
- **Method**: `PATCH`
- **URL**: `https://tabletop-player-sheet-manager.vercel.app/api/characters/1/hp`
- **Headers**:
  ```http
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "delta": "invalid_number"
  }
  ```
- **Status Response**: `400 Bad Request`
- **Response Body**:
  ```json
  {
    "success": false,
    "error": "Field delta atau amount harus berupa angka (contoh: -5 untuk damage, +5 untuk heal)"
  }
  ```
- **Hasil**: **PASS (BERHASIL)**

---

### Pengujian 11: Menambahkan Experience Points & Auto Level Up (POST)
- **Method**: `POST`
- **URL**: `https://tabletop-player-sheet-manager.vercel.app/api/characters/1/xp`
- **Headers**:
  ```http
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "amount": 1600
  }
  ```
- **Status Response**: `200 OK`
- **Response Body**:
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
- **Hasil**: **PASS (BERHASIL)**

---

### Pengujian 12: Menambahkan Item ke Inventory (POST)
- **Method**: `POST`
- **URL**: `https://tabletop-player-sheet-manager.vercel.app/api/characters/1/inventory`
- **Headers**:
  ```http
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "item_name": "Potion of Greater Healing",
    "quantity": 2,
    "weight": 1.0,
    "description": "Restores 4d4 + 4 hit points when consumed"
  }
  ```
- **Status Response**: `201 Created`
- **Response Body**:
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
      "description": "Restores 4d4 + 4 hit points when consumed",
      "added_at": "2026-10-24T12:50:00.000Z"
    }
  }
  ```
- **Hasil**: **PASS (BERHASIL)**

---

### Pengujian 13: Menghubungkan Spell ke Karakter (POST Tabel Pivot)
- **Method**: `POST`
- **URL**: `https://tabletop-player-sheet-manager.vercel.app/api/characters/1/spells`
- **Headers**:
  ```http
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "spell_id": 4,
    "is_prepared": true,
    "notes": "Emergency party healing"
  }
  ```
- **Status Response**: `201 Created`
- **Response Body**:
  ```json
  {
    "success": true,
    "message": "Spell berhasil dipelajari/didaftarkan ke spellbook karakter",
    "data": {
      "character_id": 1,
      "spell_id": 4,
      "is_prepared": true,
      "notes": "Emergency party healing",
      "spell": {
        "spell_id": 4,
        "spell_name": "Cure Wounds",
        "spell_level": 1,
        "school": "Abjuration"
      }
    }
  }
  ```
- **Hasil**: **PASS (BERHASIL)**

---

### Pengujian 14: Menyimpan Snapshot Backup Karakter (POST)
- **Method**: `POST`
- **URL**: `https://tabletop-player-sheet-manager.vercel.app/api/characters/1/saves`
- **Headers**:
  ```http
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "save_name": "Sebelum Masuk Gua Naga Merah"
  }
  ```
- **Status Response**: `201 Created`
- **Response Body**:
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
- **Hasil**: **PASS (BERHASIL)**

---

### Pengujian 15: Memulihkan Karakter dari Snapshot (POST)
- **Method**: `POST`
- **URL**: `https://tabletop-player-sheet-manager.vercel.app/api/characters/1/restore/2`
- **Headers**:
  ```http
  Accept: application/json
  ```
- **Request Body**: *(None)*
- **Status Response**: `200 OK`
- **Response Body**:
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
- **Hasil**: **PASS (BERHASIL)**

---

## 3. Cara Mengimpor Koleksi Pengujian

### A. Thunder Client (VS Code)
1. Buka ekstensi **Thunder Client** di VS Code.
2. Klik tab **Collections** pada panel samping.
3. Klik ikon menu tiga titik `...` di bagian atas kanan panel, lalu pilih **Import**.
4. Pilih file `thunder-collection.json` yang ada di root repository.
5. Jalankan permintaan secara individual atau jalankan koleksi sekaligus menggunakan **Run Collection**.

### B. Postman
1. Buka aplikasi **Postman**.
2. Klik tombol **Import** di sudut kiri atas.
3. Tarik atau pilih file `postman_collection.json` dari root repository.
4. Pastikan variabel `baseUrl` telah terisi dengan URL target:
   - Deployment: `https://tabletop-player-sheet-manager.vercel.app`
   - Lokal: `http://localhost:3000`
5. Jalankan pengujian per folder atau gunakan fitur **Postman Collection Runner**.
