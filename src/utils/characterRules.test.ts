import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hitungModifier,
  formatModifier,
  ubahHP,
  cekLevelUp,
  validasiData,
} from './characterRules.ts';

test('hitungModifier calculates standard D&D ability modifiers correctly', () => {
  assert.equal(hitungModifier(10), 0);
  assert.equal(hitungModifier(11), 0);
  assert.equal(hitungModifier(12), 1);
  assert.equal(hitungModifier(14), 2);
  assert.equal(hitungModifier(18), 4);
  assert.equal(hitungModifier(20), 5);
  assert.equal(hitungModifier(30), 10);
  assert.equal(hitungModifier(8), -1);
  assert.equal(hitungModifier(6), -2);
  assert.equal(hitungModifier(1), -5);
});

test('formatModifier adds sign properly', () => {
  assert.equal(formatModifier(3), '+3');
  assert.equal(formatModifier(0), '+0');
  assert.equal(formatModifier(-2), '-2');
});

test('ubahHP limits HP within [0, max_hp]', () => {
  // Taking damage
  assert.equal(ubahHP(20, 25, -10), 10);
  // Overkill damage caps at 0
  assert.equal(ubahHP(5, 25, -20), 0);
  // Healing
  assert.equal(ubahHP(10, 25, 8), 18);
  // Overhealing caps at max_hp
  assert.equal(ubahHP(20, 25, 10), 25);
});

test('cekLevelUp detects level promotion based on XP', () => {
  // Level 1 with 0 XP shouldn't level up
  const r1 = cekLevelUp(1, 0);
  assert.equal(r1.shouldLevelUp, false);
  assert.equal(r1.eligibleLevel, 1);

  // Level 1 with 300 XP should level up to 2
  const r2 = cekLevelUp(1, 300);
  assert.equal(r2.shouldLevelUp, true);
  assert.equal(r2.eligibleLevel, 2);

  // Level 1 with 1500 XP should be eligible for level 3
  const r3 = cekLevelUp(1, 1500);
  assert.equal(r3.shouldLevelUp, true);
  assert.equal(r3.eligibleLevel, 3);
});

test('validasiData detects valid and invalid character payloads', () => {
  const validChar = {
    character_name: 'Thorin Stonehammer',
    race: 'Dwarf',
    character_class: 'Fighter',
    character_level: 3,
    experience_points: 1000,
  };
  const v1 = validasiData('character', validChar);
  assert.equal(v1.isValid, true);
  assert.equal(v1.errors.length, 0);

  const invalidChar = {
    character_name: '',
    race: '',
    character_class: '',
    character_level: 25, // Above 20
    experience_points: -50,
  };
  const v2 = validasiData('character', invalidChar);
  assert.equal(v2.isValid, false);
  assert.ok(v2.errors.length >= 4);
});

test('validasiData enforces current_hp <= max_hp check constraint', () => {
  const invalidStats = {
    max_hp: 20,
    current_hp: 25, // Illegal by constraint
    strength: 15,
  };
  const res = validasiData('stats', invalidStats);
  assert.equal(res.isValid, false);
  assert.ok(res.errors.some((e) => e.includes('current_hp <= max_hp')));
});
