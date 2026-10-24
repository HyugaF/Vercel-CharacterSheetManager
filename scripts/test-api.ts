/**
 * Automated Test Runner for Tabletop Player Sheet Manager REST API
 * Can be run against localhost OR live Vercel deployment URL!
 * 
 * Usage:
 * npx tsx scripts/test-api.ts [BASE_URL]
 * Example:
 * npx tsx scripts/test-api.ts https://my-tabletop-project.vercel.app
 */

const TARGET_URL = (process.argv[2] || process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

console.log(`\n========================================================`);
console.log(`🧪 MENJALANKAN PENGUJIAN REST API OTOMATIS`);
console.log(`🎯 Target URL: ${TARGET_URL}`);
console.log(`⏰ Waktu: ${new Date().toISOString()}`);
console.log(`========================================================\n`);

interface TestCase {
  id: number;
  name: string;
  method: string;
  path: string;
  body?: any;
  expectedStatus: number;
  validate?: (data: any) => boolean;
}

const testCases: TestCase[] = [
  {
    id: 1,
    name: 'GET All Characters',
    method: 'GET',
    path: '/api/characters',
    expectedStatus: 200,
    validate: (res) => res.success === true && Array.isArray(res.data) && res.data.length > 0,
  },
  {
    id: 2,
    name: 'GET Character by ID',
    method: 'GET',
    path: '/api/characters/1',
    expectedStatus: 200,
    validate: (res) => res.success === true && res.data?.character_id === 1 && res.data?.stats !== undefined,
  },
  {
    id: 3,
    name: 'GET Character Not Found (Error 404)',
    method: 'GET',
    path: '/api/characters/999999',
    expectedStatus: 404,
    validate: (res) => res.success === false && typeof res.error === 'string',
  },
  {
    id: 4,
    name: 'POST Create Character Baru (201 Created)',
    method: 'POST',
    path: '/api/characters',
    body: {
      character_name: 'Test Paladin of Light',
      race: 'Human',
      character_class: 'Paladin',
      character_level: 2,
      experience_points: 350,
      background: 'Noble',
      alignment: 'Lawful Good',
      stats: {
        strength: 16,
        dexterity: 10,
        constitution: 14,
        intelligence: 10,
        wisdom: 12,
        charisma: 16,
        max_hp: 22,
        current_hp: 22,
        armor_class: 18,
      },
    },
    expectedStatus: 201,
    validate: (res) => res.success === true && res.data?.character_name === 'Test Paladin of Light',
  },
  {
    id: 5,
    name: 'POST Create Character Validasi Error (400 Bad Request)',
    method: 'POST',
    path: '/api/characters',
    body: {
      character_name: '',
      race: '',
    },
    expectedStatus: 400,
    validate: (res) => res.success === false && Array.isArray(res.errors),
  },
  {
    id: 6,
    name: 'PUT Update Character',
    method: 'PUT',
    path: '/api/characters/1',
    body: {
      character_name: 'Aric the Archmage Updated',
      stats: {
        intelligence: 19,
      },
    },
    expectedStatus: 200,
    validate: (res) => res.success === true && res.data?.character_name.includes('Updated'),
  },
  {
    id: 7,
    name: 'PATCH Modify HP / Damage (ubahHP)',
    method: 'PATCH',
    path: '/api/characters/1/hp',
    body: {
      delta: -4,
    },
    expectedStatus: 200,
    validate: (res) => res.success === true && res.data?.delta === -4,
  },
  {
    id: 8,
    name: 'POST Tambah Experience Points (tambahXP)',
    method: 'POST',
    path: '/api/characters/1/xp',
    body: {
      amount: 1500,
    },
    expectedStatus: 200,
    validate: (res) => res.success === true && typeof res.data?.new_xp === 'number',
  },
  {
    id: 9,
    name: 'GET Check Level Up Eligibility',
    method: 'GET',
    path: '/api/characters/1/levelup',
    expectedStatus: 200,
    validate: (res) => res.success === true && res.data?.current_level !== undefined,
  },
  {
    id: 10,
    name: 'GET Character Inventory',
    method: 'GET',
    path: '/api/characters/1/inventory',
    expectedStatus: 200,
    validate: (res) => res.success === true && Array.isArray(res.data?.items),
  },
  {
    id: 11,
    name: 'POST Add Item to Inventory',
    method: 'POST',
    path: '/api/characters/1/inventory',
    body: {
      item_name: 'Super Health Potion',
      quantity: 3,
      weight: 1.5,
      description: 'Restores 4d4 + 4 HP',
    },
    expectedStatus: 201,
    validate: (res) => res.success === true && res.data?.item_name === 'Super Health Potion',
  },
  {
    id: 12,
    name: 'GET Master Spells Library',
    method: 'GET',
    path: '/api/spells',
    expectedStatus: 200,
    validate: (res) => res.success === true && Array.isArray(res.data) && res.data.length >= 7,
  },
  {
    id: 13,
    name: 'POST Assign Spell to Character (M:N Pivot)',
    method: 'POST',
    path: '/api/characters/1/spells',
    body: {
      spell_id: 2,
      is_prepared: true,
      notes: 'Light cantrip for dark caverns',
    },
    expectedStatus: 201,
    validate: (res) => res.success === true && res.data?.spell_id === 2,
  },
  {
    id: 14,
    name: 'POST Create Snapshot Save (simpanData)',
    method: 'POST',
    path: '/api/characters/1/saves',
    body: {
      save_name: 'Automated Test Checkpoint',
    },
    expectedStatus: 201,
    validate: (res) => res.success === true && res.data?.save_name === 'Automated Test Checkpoint',
  },
  {
    id: 15,
    name: 'POST Reset Character State (resetKarakter)',
    method: 'POST',
    path: '/api/characters/1/reset',
    expectedStatus: 200,
    validate: (res) => res.success === true && res.data?.stats?.current_hp === res.data?.stats?.max_hp,
  },
  {
    id: 16,
    name: 'GET Search Character (cariKarakter)',
    method: 'GET',
    path: '/api/characters/search?q=Aric',
    expectedStatus: 200,
    validate: (res) => res.success === true && Array.isArray(res.data) && res.data.length > 0,
  },
];

async function runTests() {
  let passedCount = 0;
  let failedCount = 0;

  for (const test of testCases) {
    const start = performance.now();
    try {
      const url = `${TARGET_URL}${test.path}`;
      const options: RequestInit = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const res = await fetch(url, options);
      const latency = Math.round(performance.now() - start);
      const json = await res.json().catch(() => ({}));

      const isStatusOk = res.status === test.expectedStatus;
      const isValidationOk = test.validate ? test.validate(json) : true;

      if (isStatusOk && isValidationOk) {
        passedCount++;
        console.log(`✅ [PASS] #${test.id} ${test.method} ${test.path} (${res.status}) [${latency}ms]`);
      } else {
        failedCount++;
        console.error(`❌ [FAIL] #${test.id} ${test.method} ${test.path}`);
        console.error(`   Status Diharapkan: ${test.expectedStatus}, Diterima: ${res.status}`);
        console.error(`   Response Body:`, JSON.stringify(json).slice(0, 150));
      }
    } catch (err: any) {
      failedCount++;
      console.error(`❌ [ERROR] #${test.id} ${test.method} ${test.path}: ${err.message}`);
    }
  }

  console.log(`\n========================================================`);
  console.log(`📊 RINGKASAN HASIL PENGUJIAN:`);
  console.log(`   Total Pengujian : ${testCases.length}`);
  console.log(`   Lulus (PASS)    : ${passedCount}`);
  console.log(`   Gagal (FAIL)    : ${failedCount}`);
  console.log(`   Status Akhir    : ${failedCount === 0 ? '🎉 SEMUA ENDPOINT BERHASIL (100% PASS)' : '⚠️ TERDAPAT PENGUJIAN GAGAL'}`);
  console.log(`========================================================\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests();
