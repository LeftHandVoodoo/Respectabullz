// Legacy functions that need to be implemented for SQLite
// These are placeholders that maintain API compatibility

import type {
  PacketData,
  Dog,
  HeatCyclePrediction,
  MatingCompatibilityResult,
  CommonGeneticTest,
} from '@/types';
import { invoke } from '@tauri-apps/api/core';

import { getDogs, getDogPhotos } from './dogs';
import { getVaccinations, getMedicalRecords, getWeightEntries, getGeneticTests, getHealthScheduleTemplate, createPuppyHealthTask } from './health';
import { getSale, getClient } from './sales';
import { getExpenses } from './operations';
import { getBreederSettings } from './settings';
import { query } from './connection';
import { getHeatCycles } from './breeding';
import { getLitters, getLitter } from './litters';
import type { Client, PuppyHealthTaskType } from '@/types';

// Common genetic tests list
export const COMMON_GENETIC_TESTS: Array<{
  type: CommonGeneticTest;
  name: string;
  fullName: string;
  description: string;
}> = [
  { type: 'DM', name: 'DM', fullName: 'Degenerative Myelopathy', description: 'Progressive neurological disease' },
  { type: 'HUU', name: 'HUU', fullName: 'Hyperuricosuria', description: 'Bladder/kidney stones risk' },
  { type: 'CMR1', name: 'CMR1', fullName: 'Canine Multifocal Retinopathy 1', description: 'Eye condition' },
  { type: 'EIC', name: 'EIC', fullName: 'Exercise Induced Collapse', description: 'Exercise intolerance' },
  { type: 'vWD1', name: 'vWD1', fullName: 'Von Willebrand Disease Type 1', description: 'Bleeding disorder' },
  { type: 'PRA-prcd', name: 'PRA-prcd', fullName: 'Progressive Retinal Atrophy', description: 'Blindness risk' },
  { type: 'CDDY', name: 'CDDY', fullName: 'Chondrodystrophy', description: 'Dwarfism' },
  { type: 'CDPA', name: 'CDPA', fullName: 'Chondrodysplasia', description: 'Skeletal condition' },
  { type: 'NCL', name: 'NCL', fullName: 'Neuronal Ceroid Lipofuscinosis', description: 'Neurological disorder' },
  { type: 'JHC', name: 'JHC', fullName: 'Juvenile Hereditary Cataracts', description: 'Eye condition' },
  { type: 'HSF4', name: 'HSF4', fullName: 'Hereditary Cataracts', description: 'Eye condition' },
  { type: 'MDR1', name: 'MDR1', fullName: 'Multi-Drug Resistance 1', description: 'Drug sensitivity' },
  { type: 'other', name: 'Other', fullName: 'Other', description: 'Custom test' },
];

/**
 * Get packet data for a dog (for PDF export)
 */
export async function getPacketData(dogId: string): Promise<PacketData | null> {
  const dogs = await getDogs();
  const dog = dogs.find(d => d.id === dogId);
  if (!dog) return null;

  const sire = dog.sireId ? dogs.find(d => d.id === dog.sireId) || null : null;
  const dam = dog.damId ? dogs.find(d => d.id === dog.damId) || null : null;

  // Build pedigree ancestors (simplified - up to 4 generations)
  const pedigreeAncestors: PacketData['pedigreeAncestors'] = [];

  const addAncestors = (parent: Dog | null, generation: number, positionPrefix: string) => {
    if (!parent || generation > 4) return;

    const parentSire = parent.sireId ? dogs.find(d => d.id === parent.sireId) || null : null;
    const parentDam = parent.damId ? dogs.find(d => d.id === parent.damId) || null : null;

    if (parentSire) {
      pedigreeAncestors.push({
        generation,
        position: positionPrefix + 'S',
        dog: parentSire,
        name: parentSire.name,
        registrationNumber: parentSire.registrationNumber || null,
        color: parentSire.color || null,
      });
      addAncestors(parentSire, generation + 1, positionPrefix + 'S');
    }

    if (parentDam) {
      pedigreeAncestors.push({
        generation,
        position: positionPrefix + 'D',
        dog: parentDam,
        name: parentDam.name,
        registrationNumber: parentDam.registrationNumber || null,
        color: parentDam.color || null,
      });
      addAncestors(parentDam, generation + 1, positionPrefix + 'D');
    }
  };

  if (sire) addAncestors(sire, 1, 'S');
  if (dam) addAncestors(dam, 1, 'D');

  // Get health records
  const vaccinations = await getVaccinations(dogId);
  const medicalRecords = await getMedicalRecords(dogId);
  const weightEntries = await getWeightEntries(dogId);
  const geneticTests = await getGeneticTests(dogId);

  // Get dog photos
  const dogPhotos = await getDogPhotos(dogId);

  // Get sale and client info
  type SaleLinkRow = { sale_id: string };
  const sales = await query<SaleLinkRow>(
    `SELECT sp.sale_id
     FROM sale_puppies sp
     INNER JOIN sales s ON s.id = sp.sale_id
     WHERE sp.dog_id = ?
     ORDER BY s.sale_date DESC, s.id DESC
     LIMIT 1`,
    [dogId]
  );
  const latestSale = sales[0];
  const sale = latestSale ? await getSale(latestSale.sale_id) : null;
  const client: Client | null = sale && sale.clientId ? await getClient(sale.clientId) : null;

  // Get expenses
  const expenses = await getExpenses({ dogId });

  // Get breeder settings
  const breederSettings = await getBreederSettings();

  return {
    dog,
    sire,
    dam,
    pedigreeAncestors,
    vaccinations,
    medicalRecords,
    weightEntries,
    geneticTests,
    dogPhotos,
    sirePhoto: sire?.profilePhotoPath || null,
    damPhoto: dam?.profilePhotoPath || null,
    sale,
    client,
    expenses,
    breederSettings,
  };
}

/**
 * Get heat cycle prediction for a dog
 * Calculates based on historical heat cycle data
 */
export async function getHeatCyclePrediction(dogId: string): Promise<HeatCyclePrediction | null> {
  const cycles = await getHeatCycles(dogId);

  if (cycles.length === 0) {
    return {
      dogId,
      averageCycleLength: null,
      averageIntervalDays: null,
      predictedNextHeat: null,
      confidence: 'low',
      dataPointCount: 0,
    };
  }

  // Calculate average cycle length (from start to end)
  const cycleLengths = cycles
    .filter(c => c.startDate && c.endDate)
    .map(c => {
      const start = new Date(c.startDate);
      const end = new Date(c.endDate!);
      return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    });

  const averageCycleLength = cycleLengths.length > 0
    ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
    : null;

  // Calculate average interval between cycles (start to next start)
  const intervals: number[] = [];
  const sortedCycles = [...cycles].sort((a, b) =>
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  for (let i = 1; i < sortedCycles.length; i++) {
    const prev = new Date(sortedCycles[i - 1].startDate);
    const curr = new Date(sortedCycles[i].startDate);
    intervals.push(Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)));
  }

  const averageIntervalDays = intervals.length > 0
    ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
    : 180; // Default to 6 months if no interval data

  // Predict next heat based on last cycle + average interval
  const lastCycle = sortedCycles[sortedCycles.length - 1];
  const lastStart = new Date(lastCycle.startDate);
  const predictedNextHeat = new Date(lastStart.getTime() + averageIntervalDays * 24 * 60 * 60 * 1000);

  // Determine confidence based on data points
  let confidence: 'low' | 'medium' | 'high' = 'low';
  if (cycles.length >= 4) {
    confidence = 'high';
  } else if (cycles.length >= 2) {
    confidence = 'medium';
  }

  return {
    dogId,
    averageCycleLength,
    averageIntervalDays,
    predictedNextHeat,
    confidence,
    dataPointCount: cycles.length,
  };
}

/**
 * Get females expecting heat soon based on heat cycle predictions
 */
export async function getFemalesExpectingHeatSoon(days: number = 30): Promise<Dog[]> {
  const dogs = await getDogs();
  const females = dogs.filter(d => d.sex === 'F' && d.status === 'active');
  const now = new Date();
  const cutoffDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const results: Dog[] = [];

  for (const dog of females) {
    const prediction = await getHeatCyclePrediction(dog.id);
    if (prediction?.predictedNextHeat) {
      const predictedDate = new Date(prediction.predictedNextHeat);
      if (predictedDate >= now && predictedDate <= cutoffDate) {
        results.push(dog);
      }
    }
  }

  return results;
}

/**
 * Get genetic test summary for a dog
 */
export async function getDogGeneticTestSummary(dogId: string): Promise<{
  clearCount: number;
  carrierCount: number;
  affectedCount: number;
  pendingCount: number;
}> {
  const tests = await getGeneticTests(dogId);
  return {
    clearCount: tests.filter(t => t.result === 'clear').length,
    carrierCount: tests.filter(t => t.result === 'carrier').length,
    affectedCount: tests.filter(t => t.result === 'affected').length,
    pendingCount: tests.filter(t => t.result === 'pending').length,
  };
}

/**
 * Check mating compatibility between two dogs based on genetic tests
 */
export async function checkMatingCompatibility(damId: string, sireId: string): Promise<MatingCompatibilityResult> {
  const damTests = await getGeneticTests(damId);
  const sireTests = await getGeneticTests(sireId);

  const warnings: MatingCompatibilityResult['warnings'] = [];
  let isCompatible = true;

  // Group tests by type for comparison
  const damTestMap = new Map(damTests.map(t => [t.testType, t]));
  const sireTestMap = new Map(sireTests.map(t => [t.testType, t]));

  // Check each test type for compatibility issues
  const allTestTypes = new Set([...damTestMap.keys(), ...sireTestMap.keys()]);

  for (const testType of allTestTypes) {
    const damTest = damTestMap.get(testType);
    const sireTest = sireTestMap.get(testType);

    // If both are carriers, there's a 25% chance of affected puppies
    if (damTest?.result === 'carrier' && sireTest?.result === 'carrier') {
      warnings.push({
        testName: testType,
        severity: 'high',
        message: `Both parents are carriers for ${testType}. 25% of puppies may be affected.`,
        damStatus: 'carrier',
        sireStatus: 'carrier',
      });
    }

    // If one is affected and other is carrier, all puppies will be at least carriers
    if ((damTest?.result === 'affected' && sireTest?.result === 'carrier') ||
        (damTest?.result === 'carrier' && sireTest?.result === 'affected')) {
      warnings.push({
        testName: testType,
        severity: 'high',
        message: `One parent is affected and one is a carrier for ${testType}. 50% of puppies will be affected.`,
        damStatus: damTest?.result || null,
        sireStatus: sireTest?.result || null,
      });
      isCompatible = false;
    }

    // If both are affected, all puppies will be affected
    if (damTest?.result === 'affected' && sireTest?.result === 'affected') {
      warnings.push({
        testName: testType,
        severity: 'high',
        message: `Both parents are affected for ${testType}. All puppies will be affected.`,
        damStatus: 'affected',
        sireStatus: 'affected',
      });
      isCompatible = false;
    }

    // If one is affected and other is clear, all puppies will be carriers
    if ((damTest?.result === 'affected' && sireTest?.result === 'clear') ||
        (damTest?.result === 'clear' && sireTest?.result === 'affected')) {
      warnings.push({
        testName: testType,
        severity: 'medium',
        message: `One parent is affected for ${testType}. All puppies will be carriers.`,
        damStatus: damTest?.result || null,
        sireStatus: sireTest?.result || null,
      });
    }
  }

  const summary = warnings.length === 0
    ? 'No genetic compatibility issues detected.'
    : `Found ${warnings.length} potential genetic concern(s).`;

  return {
    isCompatible,
    warnings,
    summary,
  };
}

/**
 * Generate puppy health tasks for a litter based on a health schedule template
 */
export async function generatePuppyHealthTasksForLitter(
  litterId: string,
  whelpDate: Date,
  templateId?: string
): Promise<void> {
  // Get litter with puppies
  const litter = await getLitter(litterId);
  const puppies = litter?.puppies || [];
  if (puppies.length === 0) return;

  // Get template if specified, otherwise use default tasks
  interface TaskItem {
    taskType: PuppyHealthTaskType;
    taskName: string;
    daysFromBirth: number;
    isPerPuppy: boolean;
    notes?: string;
  }

  let taskItems: TaskItem[] = [];

  if (templateId) {
    const template = await getHealthScheduleTemplate(templateId);
    if (template?.items) {
      taskItems = template.items;
    }
  }

  // Default health schedule if no template
  if (taskItems.length === 0) {
    taskItems = [
      { taskType: 'dewclaw_removal', taskName: 'Dewclaw removal', daysFromBirth: 3, isPerPuppy: true, notes: 'If needed' },
      { taskType: 'deworming', taskName: 'First deworming', daysFromBirth: 14, isPerPuppy: true, notes: 'Pyrantel' },
      { taskType: 'deworming', taskName: 'Second deworming', daysFromBirth: 28, isPerPuppy: true, notes: 'Pyrantel' },
      { taskType: 'vaccination', taskName: 'First vaccination', daysFromBirth: 42, isPerPuppy: true, notes: 'DHPP' },
      { taskType: 'deworming', taskName: 'Third deworming', daysFromBirth: 42, isPerPuppy: true, notes: 'Pyrantel' },
      { taskType: 'vaccination', taskName: 'Second vaccination', daysFromBirth: 56, isPerPuppy: true, notes: 'DHPP' },
      { taskType: 'microchipping', taskName: 'Microchip implant', daysFromBirth: 56, isPerPuppy: true, notes: 'Register with registry' },
    ];
  }

  // Create tasks for each puppy or for the litter
  const whelpDateMs = whelpDate.getTime();

  for (const task of taskItems) {
    const dueDate = new Date(whelpDateMs + task.daysFromBirth * 24 * 60 * 60 * 1000);

    if (task.isPerPuppy) {
      // Create a task for each puppy
      for (const puppy of puppies) {
        await createPuppyHealthTask({
          puppyId: puppy.id,
          litterId,
          taskType: task.taskType,
          taskName: task.taskName,
          dueDate,
          notes: task.notes,
        });
      }
    } else {
      // Create a single task for the whole litter
      await createPuppyHealthTask({
        litterId,
        taskType: task.taskType,
        taskName: task.taskName,
        dueDate,
        notes: task.notes,
      });
    }
  }
}

/**
 * Export database to JSON for backup
 */
export async function exportDatabase(): Promise<string> {
  const dogs = await getDogs();
  const litters = await getLitters();
  const expenses = await getExpenses({});
  const breederSettings = await getBreederSettings();

  // Get all related data
  const allVaccinations: Record<string, unknown[]> = {};
  const allMedicalRecords: Record<string, unknown[]> = {};
  const allWeightEntries: Record<string, unknown[]> = {};
  const allGeneticTests: Record<string, unknown[]> = {};

  for (const dog of dogs) {
    allVaccinations[dog.id] = await getVaccinations(dog.id);
    allMedicalRecords[dog.id] = await getMedicalRecords(dog.id);
    allWeightEntries[dog.id] = await getWeightEntries(dog.id);
    allGeneticTests[dog.id] = await getGeneticTests(dog.id);
  }

  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data: {
      dogs,
      litters,
      expenses,
      breederSettings,
      vaccinations: allVaccinations,
      medicalRecords: allMedicalRecords,
      weightEntries: allWeightEntries,
      geneticTests: allGeneticTests,
    },
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Seed database with comprehensive sample data for testing all app functionality
 */
export async function seedDatabase(): Promise<void> {
  const seedStatements: Array<{ sql: string; params: unknown[] }> = [];
  // Collect the fixed fixture before handing it to the debug-only Rust command.
  // Rust holds one SQLite connection for the empty check, inserts, verification,
  // and commit so the plugin connection pool cannot split the transaction.
  const execute = async (sql: string, params: unknown[] = []) => {
    seedStatements.push({ sql, params });
    return { lastInsertId: 0, rowsAffected: 0 };
  };

  try {
  // Development seeding must never become a disguised reset operation. Check
  // every application table and refuse to continue when any user-created row
  // exists. Predefined tags/categories and schema metadata are the only
  // expected rows in a fresh database.
  const applicationTables = await query<{ name: string }>(
    `SELECT name FROM sqlite_master
     WHERE type = 'table'
       AND name NOT LIKE 'sqlite_%'
       AND name <> '_schema_version'`
  );

  for (const { name } of applicationTables) {
    if (!/^[a-z][a-z0-9_]*$/i.test(name)) {
      throw new Error(`Refusing to inspect unexpected table name: ${name}`);
    }

    const whereClause = name === 'document_tags'
      ? ' WHERE is_custom = 1'
      : name === 'contact_categories'
        ? ' WHERE is_predefined = 0'
        : '';
    const rows = await query<{ count: number }>(
      `SELECT COUNT(*) AS count FROM "${name}"${whereClause}`
    );

    if ((rows[0]?.count ?? 0) > 0) {
      throw new Error(
        `Development sample data requires no user-created records; existing records were found in ${name}.`
      );
    }
  }
  
  console.log('[Seed] Seeding database with deterministic synthetic sample data...');
  const referenceDate = new Date('2026-07-14T12:00:00.000Z');
  const now = referenceDate.toISOString();
  const today = new Date(referenceDate);
  let seedId = 0;
  const generateId = () => `demo-${String(++seedId).padStart(5, '0')}`;
  
  // Helper to execute with error logging
  const safeExecute = async (sql: string, params: unknown[], label: string) => {
    try {
      await execute(sql, params);
    } catch (error) {
      console.error(`[Seed] ERROR in ${label}:`, error);
      console.error(`[Seed] SQL: ${sql.substring(0, 100)}...`);
      console.error(`[Seed] Params:`, params);
      throw new Error(`Seed failed at: ${label}. ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Helper to format date
  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const daysAgo = (days: number) => {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - days);
    return formatDate(d);
  };
  const daysFromNow = (days: number) => {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() + days);
    return formatDate(d);
  };

  // ============================================
  // 1. DOGS - Adults (Breeding Stock)
  // ============================================
  const sireId = generateId();
  const sire2Id = generateId();
  const damId = generateId();
  const dam2Id = generateId();
  const dam3Id = generateId();
  const retiredDamId = generateId();
  
  // Champion Stud 1
  await execute(
    `INSERT INTO dogs (id, name, sex, breed, registration_number, date_of_birth, color, microchip_number, status, notes, registration_status, registration_type, registry_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [sireId, 'CH Respectabullz Iron Thunder', 'M', 'American Bully', 'DEMO-REG-0001', '2021-03-15', 'Blue Tri', 'DEMO-CHIP-0001', 'active', 'Champion stud. Excellent structure and temperament. Multiple Best in Show wins.', 'registered', 'full', 'Demo Registry', now, now]
  );
  
  // Stud 2 - Younger male
  await execute(
    `INSERT INTO dogs (id, name, sex, breed, registration_number, date_of_birth, color, microchip_number, status, notes, registration_status, registration_type, registry_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [sire2Id, 'Respectabullz Titan', 'M', 'American Bully', 'DEMO-REG-0002', '2022-07-20', 'Champagne Tri', 'DEMO-CHIP-0002', 'active', 'Up and coming stud. Son of Iron Thunder.', 'registered', 'full', 'Demo Registry', now, now]
  );
  
  // Champion Dam 1
  await execute(
    `INSERT INTO dogs (id, name, sex, breed, registration_number, date_of_birth, color, microchip_number, status, notes, registration_status, registration_type, registry_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [damId, 'CH Respectabullz Diamond Queen', 'F', 'American Bully', 'DEMO-REG-0003', '2020-08-22', 'Lilac Tri', 'DEMO-CHIP-0003', 'active', 'Champion dam. Produces exceptional puppies with great bone and structure.', 'registered', 'full', 'Demo Registry', now, now]
  );
  
  // Dam 2 - Young female
  await execute(
    `INSERT INTO dogs (id, name, sex, breed, registration_number, date_of_birth, color, microchip_number, status, notes, registration_status, registration_type, registry_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [dam2Id, 'Respectabullz Ruby Rose', 'F', 'American Bully', 'DEMO-REG-0004', '2022-05-10', 'Champagne', 'DEMO-CHIP-0004', 'active', 'Young prospect, excellent bone and structure. First litter planned.', 'registered', 'full', 'Demo Registry', now, now]
  );
  
  // Dam 3 - Currently pregnant
  await execute(
    `INSERT INTO dogs (id, name, sex, breed, registration_number, date_of_birth, color, microchip_number, status, notes, registration_status, registration_type, registry_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [dam3Id, 'Respectabullz Sapphire Star', 'F', 'American Bully', 'DEMO-REG-0005', '2021-11-03', 'Blue Fawn', 'DEMO-CHIP-0005', 'active', 'Confirmed pregnant, due in 3 weeks.', 'registered', 'full', 'Demo Registry', now, now]
  );
  
  // Retired Dam
  await execute(
    `INSERT INTO dogs (id, name, sex, breed, registration_number, date_of_birth, color, microchip_number, status, notes, registration_status, registration_type, registry_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [retiredDamId, 'CH Respectabullz Golden Legacy', 'F', 'American Bully', 'DEMO-REG-0006', '2017-02-14', 'Fawn', 'DEMO-CHIP-0006', 'retired', 'Retired champion. Produced 4 champion offspring. Now enjoying retirement as beloved pet.', 'registered', 'full', 'Demo Registry', now, now]
  );

  // ============================================
  // 2. LITTERS
  // ============================================
  
  // Litter A - Weaning (4 weeks old)
  const litterAId = generateId();
  const litterAWhelpDate = daysAgo(28);
  await execute(
    `INSERT INTO litters (id, code, nickname, breeding_date, due_date, whelp_date, total_born, total_alive, notes, sire_id, dam_id, status, ultrasound_date, ultrasound_result, xray_date, xray_puppy_count, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [litterAId, 'A-2024', 'Thunder x Diamond', daysAgo(91), daysAgo(28), litterAWhelpDate, 6, 5, 'Beautiful litter with excellent structure. One puppy stillborn.', sireId, damId, 'weaning', daysAgo(70), 'Confirmed pregnant, 6-7 puppies visible', daysAgo(35), 6, now, now]
  );
  
  // Litter B - Ready to go (8 weeks old)
  const litterBId = generateId();
  const litterBWhelpDate = daysAgo(56);
  await execute(
    `INSERT INTO litters (id, code, nickname, breeding_date, due_date, whelp_date, total_born, total_alive, notes, sire_id, dam_id, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [litterBId, 'B-2024', 'Thunder x Ruby', daysAgo(119), daysAgo(56), litterBWhelpDate, 4, 4, 'All puppies healthy and ready for new homes.', sireId, dam2Id, 'ready_to_go', now, now]
  );
  
  // Litter C - Planned/Bred (pregnant dam)
  const litterCId = generateId();
  await execute(
    `INSERT INTO litters (id, code, nickname, breeding_date, due_date, notes, sire_id, dam_id, status, ultrasound_date, ultrasound_result, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [litterCId, 'C-2024', 'Titan x Sapphire', daysAgo(42), daysFromNow(21), 'Expecting 5-6 puppies based on ultrasound.', sire2Id, dam3Id, 'xray_confirmed', daysAgo(21), 'Confirmed pregnant, 5-6 puppies visible', now, now]
  );
  
  // Litter D - Completed (past litter for history)
  const litterDId = generateId();
  await execute(
    `INSERT INTO litters (id, code, nickname, breeding_date, due_date, whelp_date, total_born, total_alive, notes, sire_id, dam_id, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [litterDId, 'D-2023', 'Thunder x Legacy', daysAgo(365), daysAgo(302), daysAgo(302), 7, 7, 'Excellent litter, all puppies placed in great homes.', sireId, retiredDamId, 'completed', now, now]
  );

  // ============================================
  // 3. PUPPIES
  // ============================================
  const puppyIds: string[] = [];
  
  // Litter A puppies (weaning)
  const litterAPuppies = [
    { name: 'Respectabullz Apollo', sex: 'M', color: 'Blue Tri', status: 'active', category: 'show_prospect' },
    { name: 'Respectabullz Athena', sex: 'F', color: 'Lilac Tri', status: 'active', category: 'breeding_prospect' },
    { name: 'Respectabullz Zeus', sex: 'M', color: 'Blue Fawn', status: 'active', category: 'pet' },
    { name: 'Respectabullz Hera', sex: 'F', color: 'Champagne Tri', status: 'active', category: 'pet' },
    { name: 'Respectabullz Ares', sex: 'M', color: 'Lilac', status: 'active', category: 'breeding_prospect' },
  ];
  
  for (const puppy of litterAPuppies) {
    const puppyId = generateId();
    puppyIds.push(puppyId);
    await execute(
      `INSERT INTO dogs (id, name, sex, breed, date_of_birth, color, status, sire_id, dam_id, litter_id, evaluation_category, structure_notes, temperament_notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [puppyId, puppy.name, puppy.sex, 'American Bully', litterAWhelpDate, puppy.color, puppy.status, sireId, damId, litterAId, puppy.category, 
       puppy.category === 'show_prospect' ? 'Excellent topline, great bone, correct bite' : 'Good structure overall',
       puppy.category === 'show_prospect' ? 'Confident, outgoing, loves attention' : 'Friendly and playful',
       now, now]
    );
  }
  
  // Litter B puppies (ready to go) - some sold
  const litterBPuppies = [
    { name: 'Respectabullz Phoenix', sex: 'M', color: 'Champagne', status: 'sold', category: 'pet' },
    { name: 'Respectabullz Nova', sex: 'F', color: 'Blue', status: 'sold', category: 'pet' },
    { name: 'Respectabullz Orion', sex: 'M', color: 'Champagne Tri', status: 'active', category: 'breeding_prospect' },
    { name: 'Respectabullz Luna', sex: 'F', color: 'Lilac', status: 'active', category: 'show_prospect' },
  ];
  
  const litterBPuppyIds: string[] = [];
  for (const puppy of litterBPuppies) {
    const puppyId = generateId();
    litterBPuppyIds.push(puppyId);
    await execute(
      `INSERT INTO dogs (id, name, sex, breed, date_of_birth, color, status, sire_id, dam_id, litter_id, evaluation_category, registration_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [puppyId, puppy.name, puppy.sex, 'American Bully', litterBWhelpDate, puppy.color, puppy.status, sireId, dam2Id, litterBId, puppy.category, 
       puppy.status === 'sold' ? 'pending' : 'not_registered',
       now, now]
    );
  }

  // ============================================
  // 4. EXTERNAL STUDS
  // ============================================
  const extStudId = generateId();
  await execute(
    `INSERT INTO external_studs (id, name, breed, registration_number, color, owner_name, owner_phone, owner_email, stud_fee, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [extStudId, 'GCH Demo Ridge Atlas', 'American Bully', 'DEMO-REG-0901', 'Chocolate Tri', 'Morgan Example', '202-555-0101', 'stud-one@example.test', 3500, 'Synthetic portfolio record. Multiple Grand Champion; produces excellent structure and color.', now, now]
  );
  
  const extStud2Id = generateId();
  await execute(
    `INSERT INTO external_studs (id, name, breed, registration_number, color, owner_name, owner_phone, owner_email, stud_fee, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [extStud2Id, 'Example Kennels Meridian', 'American Bully', 'DEMO-REG-0902', 'Merle', 'Riley Sample', '202-555-0102', 'stud-two@example.test', 5000, 'Synthetic portfolio record. Rare merle coloring; health tested clear.', now, now]
  );

  // ============================================
  // 5. HEAT CYCLES & EVENTS
  // ============================================
  
  // Heat cycle for Diamond Queen (past, resulted in Litter A)
  const heatCycle1Id = generateId();
  await execute(
    `INSERT INTO heat_cycles (id, bitch_id, start_date, standing_heat_start, standing_heat_end, ovulation_date, optimal_breeding_start, optimal_breeding_end, end_date, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [heatCycle1Id, damId, daysAgo(98), daysAgo(91), daysAgo(86), daysAgo(89), daysAgo(91), daysAgo(87), daysAgo(77), 'Bred successfully, resulted in Litter A', now, now]
  );
  
  // Heat events for this cycle
  await execute(
    `INSERT INTO heat_events (id, heat_cycle_id, date, type, value, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), heatCycle1Id, daysAgo(98), 'bleeding_start', null, 'Light spotting observed', now]
  );
  await execute(
    `INSERT INTO heat_events (id, heat_cycle_id, date, type, value, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), heatCycle1Id, daysAgo(93), 'progesterone_test', '2.5', 'Rising, continue monitoring', now]
  );
  await execute(
    `INSERT INTO heat_events (id, heat_cycle_id, date, type, value, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), heatCycle1Id, daysAgo(91), 'progesterone_test', '5.2', 'Ovulation detected!', now]
  );
  await execute(
    `INSERT INTO heat_events (id, heat_cycle_id, date, type, value, sire_id, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), heatCycle1Id, daysAgo(91), 'breeding_natural', null, sireId, 'First breeding - successful tie', now]
  );
  await execute(
    `INSERT INTO heat_events (id, heat_cycle_id, date, type, value, sire_id, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), heatCycle1Id, daysAgo(89), 'breeding_natural', null, sireId, 'Second breeding - successful tie', now]
  );
  
  // Current heat cycle for Ruby Rose (active, planning breeding)
  const heatCycle2Id = generateId();
  await execute(
    `INSERT INTO heat_cycles (id, bitch_id, start_date, standing_heat_start, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [heatCycle2Id, dam2Id, daysAgo(5), daysAgo(2), 'Currently in heat, monitoring for optimal breeding window', now, now]
  );
  
  await execute(
    `INSERT INTO heat_events (id, heat_cycle_id, date, type, value, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), heatCycle2Id, daysAgo(5), 'bleeding_start', null, 'Heat started', now]
  );
  await execute(
    `INSERT INTO heat_events (id, heat_cycle_id, date, type, value, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), heatCycle2Id, daysAgo(3), 'vulva_swelling', null, 'Vulva swelling increasing - moderate', now]
  );
  await execute(
    `INSERT INTO heat_events (id, heat_cycle_id, date, type, value, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), heatCycle2Id, daysAgo(1), 'progesterone_test', '1.8', 'Still rising, test again in 2 days', now]
  );
  
  // Heat cycle 3 - Sapphire Star (past cycle, resulted in Litter C)
  const heatCycle3Id = generateId();
  await execute(
    `INSERT INTO heat_cycles (id, bitch_id, start_date, standing_heat_start, standing_heat_end, ovulation_date, optimal_breeding_start, optimal_breeding_end, end_date, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [heatCycle3Id, dam3Id, daysAgo(42), daysAgo(35), daysAgo(30), daysAgo(33), daysAgo(35), daysAgo(31), daysAgo(20), 'Bred successfully, resulted in Litter C', now, now]
  );
  
  await execute(
    `INSERT INTO heat_events (id, heat_cycle_id, date, type, value, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), heatCycle3Id, daysAgo(42), 'bleeding_start', null, 'Heat cycle started', now]
  );
  await execute(
    `INSERT INTO heat_events (id, heat_cycle_id, date, type, value, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), heatCycle3Id, daysAgo(38), 'progesterone_test', '2.1', 'Rising progesterone', now]
  );
  await execute(
    `INSERT INTO heat_events (id, heat_cycle_id, date, type, value, sire_id, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), heatCycle3Id, daysAgo(35), 'breeding_natural', null, sire2Id, 'First breeding with Titan', now]
  );
  await execute(
    `INSERT INTO heat_events (id, heat_cycle_id, date, type, value, sire_id, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), heatCycle3Id, daysAgo(33), 'breeding_natural', null, sire2Id, 'Second breeding - successful tie', now]
  );
  
  // Heat cycle 4 - Retired dam (historical)
  const heatCycle4Id = generateId();
  await execute(
    `INSERT INTO heat_cycles (id, bitch_id, start_date, standing_heat_start, standing_heat_end, end_date, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [heatCycle4Id, retiredDamId, daysAgo(365), daysAgo(358), daysAgo(353), daysAgo(343), 'Last heat cycle before retirement', now, now]
  );

  // ============================================
  // 6. GENETIC TESTS
  // ============================================
  const testTypes = ['DM', 'HUU', 'CMR1', 'EIC', 'vWD1', 'PRA-prcd'];
  
  // Sire - all clear (tested 6 months ago)
  for (const testType of testTypes) {
    await execute(
      `INSERT INTO genetic_tests (id, dog_id, test_date, test_type, result, lab_name, certificate_path, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), sireId, daysAgo(180), testType, 'clear', 'Embark', null, 'Full panel - all clear', now, now]
    );
  }
  
  // Sire2 - all clear (tested 4 months ago)
  for (const testType of testTypes) {
    await execute(
      `INSERT INTO genetic_tests (id, dog_id, test_date, test_type, result, lab_name, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), sire2Id, daysAgo(120), testType, 'clear', 'Wisdom Panel', 'Full panel - all clear', now, now]
    );
  }
  
  // Dam - one carrier (tested 7 months ago)
  for (const testType of testTypes) {
    await execute(
      `INSERT INTO genetic_tests (id, dog_id, test_date, test_type, result, lab_name, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), damId, daysAgo(210), testType, testType === 'HUU' ? 'carrier' : 'clear', 'Embark', 'Full panel testing', now, now]
    );
  }
  
  // Dam 2 - tested (2 months ago, pre-breeding)
  for (const testType of testTypes.slice(0, 4)) {
    await execute(
      `INSERT INTO genetic_tests (id, dog_id, test_date, test_type, result, lab_name, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), dam2Id, daysAgo(60), testType, 'clear', 'Wisdom Panel', 'Pre-breeding testing', now, now]
    );
  }
  
  // Dam3 - tested (3 months ago)
  for (const testType of testTypes) {
    await execute(
      `INSERT INTO genetic_tests (id, dog_id, test_date, test_type, result, lab_name, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), dam3Id, daysAgo(90), testType, 'clear', 'Embark', 'Full panel - all clear', now, now]
    );
  }
  
  // Retired dam - tested (1 year ago)
  for (const testType of testTypes.slice(0, 4)) {
    await execute(
      `INSERT INTO genetic_tests (id, dog_id, test_date, test_type, result, lab_name, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), retiredDamId, daysAgo(365), testType, 'clear', 'Embark', 'Historical test records', now, now]
    );
  }

  // ============================================
  // 7. VACCINATIONS
  // ============================================
  // Sire vaccinations
  await execute(
    `INSERT INTO vaccination_records (id, dog_id, date, vaccine_type, dose, lot_number, vet_clinic, next_due_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), sireId, '2024-01-15', 'Rabies', '1 year', 'RAB-2024-001', 'Valley Vet Clinic', '2025-01-15', now, now]
  );
  await execute(
    `INSERT INTO vaccination_records (id, dog_id, date, vaccine_type, dose, lot_number, vet_clinic, next_due_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), sireId, '2024-01-15', 'DHPP', 'Annual Booster', 'DHPP-2024-015', 'Valley Vet Clinic', '2025-01-15', now, now]
  );
  await execute(
    `INSERT INTO vaccination_records (id, dog_id, date, vaccine_type, dose, lot_number, vet_clinic, next_due_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), sireId, '2024-03-01', 'Bordetella', '6 month', 'BORD-2024-033', 'Valley Vet Clinic', '2024-09-01', now, now]
  );
  
  // Sire2 vaccinations
  await execute(
    `INSERT INTO vaccination_records (id, dog_id, date, vaccine_type, dose, vet_clinic, next_due_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), sire2Id, daysAgo(90), 'Rabies', '1 year', 'Valley Vet Clinic', daysFromNow(275), now, now]
  );
  await execute(
    `INSERT INTO vaccination_records (id, dog_id, date, vaccine_type, dose, vet_clinic, next_due_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), sire2Id, daysAgo(90), 'DHPP', 'Annual', 'Valley Vet Clinic', daysFromNow(275), now, now]
  );
  
  // Dam vaccinations
  await execute(
    `INSERT INTO vaccination_records (id, dog_id, date, vaccine_type, dose, vet_clinic, next_due_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), damId, '2024-02-20', 'Rabies', '3 year', 'Valley Vet Clinic', '2027-02-20', now, now]
  );
  await execute(
    `INSERT INTO vaccination_records (id, dog_id, date, vaccine_type, dose, vet_clinic, next_due_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), damId, '2024-02-20', 'DHPP', 'Annual', 'Valley Vet Clinic', '2025-02-20', now, now]
  );
  
  // Dam2 vaccinations
  await execute(
    `INSERT INTO vaccination_records (id, dog_id, date, vaccine_type, dose, vet_clinic, next_due_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), dam2Id, daysAgo(120), 'Rabies', '1 year', 'Valley Vet Clinic', daysFromNow(245), now, now]
  );
  await execute(
    `INSERT INTO vaccination_records (id, dog_id, date, vaccine_type, dose, vet_clinic, next_due_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), dam2Id, daysAgo(120), 'DHPP', 'Annual', 'Valley Vet Clinic', daysFromNow(245), now, now]
  );
  
  // Dam3 vaccinations
  await execute(
    `INSERT INTO vaccination_records (id, dog_id, date, vaccine_type, dose, vet_clinic, next_due_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), dam3Id, daysAgo(60), 'Rabies', '1 year', 'Valley Vet Clinic', daysFromNow(305), now, now]
  );
  await execute(
    `INSERT INTO vaccination_records (id, dog_id, date, vaccine_type, dose, vet_clinic, next_due_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), dam3Id, daysAgo(60), 'DHPP', 'Annual', 'Valley Vet Clinic', daysFromNow(305), now, now]
  );
  
  // Retired dam vaccinations
  await execute(
    `INSERT INTO vaccination_records (id, dog_id, date, vaccine_type, dose, vet_clinic, next_due_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), retiredDamId, daysAgo(180), 'Rabies', '3 year', 'Valley Vet Clinic', daysFromNow(915), now, now]
  );
  await execute(
    `INSERT INTO vaccination_records (id, dog_id, date, vaccine_type, dose, vet_clinic, next_due_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), retiredDamId, daysAgo(180), 'DHPP', 'Annual', 'Valley Vet Clinic', daysFromNow(185), now, now]
  );
  
  // Puppy vaccinations (8 week shots for Litter B)
  for (const puppyId of litterBPuppyIds) {
    await execute(
      `INSERT INTO vaccination_records (id, dog_id, date, vaccine_type, dose, vet_clinic, next_due_date, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), puppyId, daysAgo(7), 'Puppy DHPP', '8 week', 'Valley Vet Clinic', daysFromNow(21), '8 week puppy shot', now, now]
    );
  }
  
  // Puppy vaccinations (6 week shots for Litter A)
  for (let i = 0; i < 3; i++) {
    await execute(
      `INSERT INTO vaccination_records (id, dog_id, date, vaccine_type, dose, vet_clinic, next_due_date, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), puppyIds[i], daysAgo(14), 'Puppy DHPP', '6 week', 'Valley Vet Clinic', daysFromNow(14), '6 week puppy shot', now, now]
    );
  }

  // ============================================
  // 8. MEDICAL RECORDS
  // ============================================
  // Sire medical records
  await execute(
    `INSERT INTO medical_records (id, dog_id, date, type, description, vet_clinic, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), sireId, '2024-01-15', 'exam', 'Annual wellness exam', 'Valley Vet Clinic', 'All vitals normal, good weight, teeth cleaned', now, now]
  );
  await execute(
    `INSERT INTO medical_records (id, dog_id, date, type, description, vet_clinic, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), sireId, daysAgo(90), 'exam', 'Pre-breeding exam', 'Valley Vet Clinic', 'Cleared for breeding', now, now]
  );
  
  // Dam medical records
  await execute(
    `INSERT INTO medical_records (id, dog_id, date, type, description, vet_clinic, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), damId, daysAgo(70), 'test', 'Pregnancy ultrasound', 'Valley Vet Clinic', 'Confirmed pregnant, 6-7 puppies visible', now, now]
  );
  await execute(
    `INSERT INTO medical_records (id, dog_id, date, type, description, vet_clinic, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), damId, daysAgo(35), 'test', 'Pregnancy x-ray', 'Valley Vet Clinic', '6 puppies confirmed', now, now]
  );
  await execute(
    `INSERT INTO medical_records (id, dog_id, date, type, description, vet_clinic, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), damId, '2024-02-20', 'exam', 'Annual wellness exam', 'Valley Vet Clinic', 'All vitals normal', now, now]
  );
  
  // Dam2 medical records
  await execute(
    `INSERT INTO medical_records (id, dog_id, date, type, description, vet_clinic, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), dam2Id, daysAgo(60), 'exam', 'Pre-breeding exam', 'Valley Vet Clinic', 'Cleared for breeding', now, now]
  );
  
  // Dam3 medical records
  await execute(
    `INSERT INTO medical_records (id, dog_id, date, type, description, vet_clinic, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), dam3Id, daysAgo(21), 'test', 'Pregnancy ultrasound', 'Valley Vet Clinic', 'Confirmed pregnant, 5-6 puppies visible', now, now]
  );
  
  // Retired dam medical records
  await execute(
    `INSERT INTO medical_records (id, dog_id, date, type, description, vet_clinic, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), retiredDamId, daysAgo(180), 'surgery', 'Spay surgery', 'Valley Vet Clinic', 'Routine spay after retirement from breeding program', now, now]
  );
  await execute(
    `INSERT INTO medical_records (id, dog_id, date, type, description, vet_clinic, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), retiredDamId, daysAgo(60), 'exam', 'Post-surgery checkup', 'Valley Vet Clinic', 'Healing well, no complications', now, now]
  );
  
  // Puppy medical records
  await execute(
    `INSERT INTO medical_records (id, dog_id, date, type, description, vet_clinic, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), puppyIds[0], daysAgo(21), 'exam', 'Puppy wellness exam', 'Valley Vet Clinic', 'Healthy puppy, good weight gain', now, now]
  );

  // ============================================
  // 9. WEIGHT ENTRIES
  // ============================================
  // Puppy weight tracking for Apollo (Litter A)
  for (let week = 0; week < 4; week++) {
    const weightDate = new Date();
    weightDate.setDate(weightDate.getDate() - 28 + (week * 7));
    await execute(
      `INSERT INTO weight_entries (id, dog_id, date, weight_lbs, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [generateId(), puppyIds[0], formatDate(weightDate), 0.8 + (week * 0.7), `Week ${week + 1} weigh-in`, now]
    );
  }
  
  // Puppy weight tracking for Athena (Litter A)
  for (let week = 0; week < 4; week++) {
    const weightDate = new Date();
    weightDate.setDate(weightDate.getDate() - 28 + (week * 7));
    await execute(
      `INSERT INTO weight_entries (id, dog_id, date, weight_lbs, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [generateId(), puppyIds[1], formatDate(weightDate), 0.7 + (week * 0.6), `Week ${week + 1} weigh-in`, now]
    );
  }
  
  // Adult weight for sire (multiple entries)
  await execute(
    `INSERT INTO weight_entries (id, dog_id, date, weight_lbs, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [generateId(), sireId, daysAgo(60), 72.0, 'Monthly weigh-in', now]
  );
  await execute(
    `INSERT INTO weight_entries (id, dog_id, date, weight_lbs, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [generateId(), sireId, daysAgo(30), 72.5, 'Monthly weigh-in', now]
  );
  await execute(
    `INSERT INTO weight_entries (id, dog_id, date, weight_lbs, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [generateId(), sireId, formatDate(today), 73.0, 'Monthly weigh-in', now]
  );
  
  // Adult weight for dam
  await execute(
    `INSERT INTO weight_entries (id, dog_id, date, weight_lbs, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [generateId(), damId, daysAgo(30), 58.5, 'Monthly weigh-in', now]
  );
  await execute(
    `INSERT INTO weight_entries (id, dog_id, date, weight_lbs, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [generateId(), damId, formatDate(today), 59.0, 'Monthly weigh-in', now]
  );
  
  // Adult weight for dam2
  await execute(
    `INSERT INTO weight_entries (id, dog_id, date, weight_lbs, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [generateId(), dam2Id, daysAgo(30), 55.0, 'Monthly weigh-in', now]
  );
  
  // Adult weight for dam3 (pregnant)
  await execute(
    `INSERT INTO weight_entries (id, dog_id, date, weight_lbs, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [generateId(), dam3Id, daysAgo(30), 57.0, 'Pre-pregnancy weight', now]
  );
  await execute(
    `INSERT INTO weight_entries (id, dog_id, date, weight_lbs, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [generateId(), dam3Id, formatDate(today), 62.5, 'Pregnancy weight gain', now]
  );

  // ============================================
  // 10. PUPPY HEALTH TASKS
  // ============================================
  const healthTasks = [
    { type: 'Deworming', daysOffset: 14 },
    { type: 'Deworming', daysOffset: 28 },
    { type: 'First Vaccine', daysOffset: 42 },
    { type: 'Deworming', daysOffset: 42 },
    { type: 'Second Vaccine', daysOffset: 56 },
    { type: 'Microchip', daysOffset: 56 },
  ];
  
  for (const task of healthTasks) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() - 28 + task.daysOffset);
    const isCompleted = task.daysOffset <= 28; // Completed if due date has passed
    
    await execute(
      `INSERT INTO puppy_health_tasks (id, litter_id, task_type, due_date, completed_date, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), litterAId, task.type, formatDate(dueDate), isCompleted ? formatDate(dueDate) : null, `Litter A ${task.type}`, now, now]
    );
  }

  // ============================================
  // 11. CLIENTS
  // ============================================
  const client1Id = generateId();
  const client2Id = generateId();
  const client3Id = generateId();
  const client4Id = generateId();
  
  await execute(
    `INSERT INTO clients (id, name, phone, email, address_line1, city, state, postal_code, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [client1Id, 'Avery Example', '202-555-0110', 'avery@example.test', '100 Demo Lane', 'Austin', 'TX', '78701', 'Synthetic repeat-client record. Purchased Phoenix from Litter B.', now, now]
  );
  await execute(
    `INSERT INTO clients (id, name, phone, email, address_line1, city, state, postal_code, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [client2Id, 'Jordan Sample', '202-555-0111', 'jordan@example.test', '200 Example Avenue', 'Dallas', 'TX', '75201', 'Synthetic client interested in a breeding-quality female. On waitlist.', now, now]
  );
  await execute(
    `INSERT INTO clients (id, name, phone, email, address_line1, city, state, postal_code, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [client3Id, 'Casey Demo', '202-555-0112', 'casey@example.test', '300 Fixture Road', 'Houston', 'TX', '77001', 'Synthetic client who purchased Nova from Litter B.', now, now]
  );
  await execute(
    `INSERT INTO clients (id, name, phone, email, city, state, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [client4Id, 'Taylor Fixture', '202-555-0113', 'taylor@example.test', 'San Antonio', 'TX', 'Synthetic inquiry about upcoming Litter C', now, now]
  );

  // ============================================
  // 12. SALES
  // ============================================
  // Sale 1 - Phoenix (completed)
  const sale1Id = generateId();
  await execute(
    `INSERT INTO sales (id, client_id, sale_date, price, deposit_amount, deposit_date, payment_status, is_local_pickup, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [sale1Id, client1Id, daysAgo(14), 4500, 500, daysAgo(45), 'paid_in_full', 1, 'Smooth transaction. Client picked up locally.', now, now]
  );
  await execute(
    `INSERT INTO sale_puppies (id, sale_id, dog_id, price, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [generateId(), sale1Id, litterBPuppyIds[0], 4500, now]
  );
  
  // Sale 2 - Nova (completed with transport)
  const sale2Id = generateId();
  await execute(
    `INSERT INTO sales (id, client_id, sale_date, price, deposit_amount, deposit_date, payment_status, shipped_date, received_date, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [sale2Id, client3Id, daysAgo(10), 4500, 500, daysAgo(50), 'paid_in_full', daysAgo(8), daysAgo(7), 'Shipped via flight nanny. Client very happy.', now, now]
  );
  await execute(
    `INSERT INTO sale_puppies (id, sale_id, dog_id, price, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [generateId(), sale2Id, litterBPuppyIds[1], 4500, now]
  );

  // ============================================
  // 13. CLIENT INTERESTS
  // ============================================
  await execute(
    `INSERT INTO client_interests (id, client_id, dog_id, interest_date, contact_method, status, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), client4Id, litterBPuppyIds[3], daysAgo(3), 'email', 'contacted', 'Interested in Luna for show. Sent photos and pedigree.', now, now]
  );
  await execute(
    `INSERT INTO client_interests (id, client_id, dog_id, interest_date, contact_method, status, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), client2Id, puppyIds[1], daysAgo(7), 'phone', 'scheduled_visit', 'Wants to see Athena in person. Visit scheduled for this weekend.', now, now]
  );

  // ============================================
  // 14. WAITLIST
  // ============================================
  await execute(
    `INSERT INTO waitlist_entries (id, client_id, litter_id, position, sex_preference, color_preference, deposit_amount, deposit_date, status, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), client2Id, litterCId, 1, 'F', 'Lilac or Blue', 750, daysAgo(30), 'waiting', 'First pick female from Litter C', now, now]
  );
  await execute(
    `INSERT INTO waitlist_entries (id, client_id, litter_id, position, sex_preference, deposit_amount, deposit_date, status, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), client4Id, litterCId, 2, 'M', 500, daysAgo(20), 'waiting', 'Second pick male from Litter C', now, now]
  );
  // General waitlist (no specific litter)
  const generalWaitlistClientId = generateId();
  await execute(
    `INSERT INTO clients (id, name, phone, email, city, state, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generalWaitlistClientId, 'Quinn Example', '202-555-0114', 'quinn@example.test', 'Los Angeles', 'CA', 'Synthetic client willing to travel for pickup', now, now]
  );
  await execute(
    `INSERT INTO waitlist_entries (id, client_id, position, sex_preference, color_preference, deposit_amount, deposit_date, status, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), generalWaitlistClientId, 1, 'F', 'Champagne Tri', 500, daysAgo(60), 'waiting', 'General waitlist - wants champagne tri female from any litter', now, now]
  );

  // ============================================
  // 15. COMMUNICATION LOGS
  // ============================================
  await execute(
    `INSERT INTO communication_logs (id, client_id, date, type, direction, subject, content, follow_up_date, follow_up_completed, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), client1Id, daysAgo(45), 'phone', 'inbound', 'Inquiry about available puppies', 'John called asking about available male puppies. Discussed Phoenix.', daysAgo(44), 1, 'Led to deposit', now, now]
  );
  await execute(
    `INSERT INTO communication_logs (id, client_id, date, type, direction, subject, content, follow_up_date, follow_up_completed, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), client2Id, daysAgo(7), 'email', 'outbound', 'Visit confirmation', 'Confirmed visit for this Saturday at 2pm to meet Athena.', daysFromNow(2), 0, now, now]
  );
  await execute(
    `INSERT INTO communication_logs (id, client_id, date, type, direction, subject, content, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), client3Id, daysAgo(7), 'text', 'inbound', 'Puppy arrival confirmation', 'Nova arrived safely! She is perfect, thank you so much!', now, now]
  );
  await execute(
    `INSERT INTO communication_logs (id, client_id, date, type, direction, subject, content, follow_up_date, follow_up_completed, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), client4Id, daysAgo(3), 'email', 'inbound', 'Interest in Luna', 'Emily inquired about Luna for show. Sent photos and pricing.', daysFromNow(4), 0, now, now]
  );

  // ============================================
  // 16. CUSTOM EXPENSE CATEGORIES
  // ============================================
  await execute(
    `INSERT INTO expense_categories (id, name, color, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [generateId(), 'Training', '#10b981', now, now]
  );
  await execute(
    `INSERT INTO expense_categories (id, name, color, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [generateId(), 'Grooming', '#f59e0b', now, now]
  );
  await execute(
    `INSERT INTO expense_categories (id, name, color, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [generateId(), 'Insurance', '#3b82f6', now, now]
  );

  // ============================================
  // 17. EXPENSES (All Categories)
  // ============================================
  // Vet expenses
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_litter_id, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(70), 150, 'vet', 'Valley Vet Clinic', 'Pregnancy ultrasound', 'Credit Card', 1, litterAId, 'Confirmed 6-7 puppies', now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_litter_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(35), 200, 'vet', 'Valley Vet Clinic', 'Pregnancy x-ray', 'Credit Card', 1, litterAId, now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_litter_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(21), 350, 'vet', 'Valley Vet Clinic', 'Puppy wellness exams - Litter A', 'Credit Card', 1, litterAId, now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(45), 125, 'vet', 'Valley Vet Clinic', 'Annual wellness exam - Titan', 'Credit Card', 1, sire2Id, now, now]
  );
  
  // Food expenses
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(14), 250, 'food', 'Chewy', 'Premium puppy food - monthly order', 'Credit Card', 1, now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(0), 180, 'food', 'Petco', 'Adult dog food - bulk order', 'Credit Card', 1, now, now]
  );
  
  // Supplies expenses
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(30), 450, 'supplies', 'Amazon', 'Whelping supplies and puppy pens', 'Credit Card', 1, now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(7), 85, 'supplies', 'PetSmart', 'Toys, leashes, and collars', 'Credit Card', 1, now, now]
  );
  
  // Registration expenses
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(180), 400, 'registration', 'ABKC', 'Litter registration and individual registrations', 'Check', 1, sireId, now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(120), 150, 'registration', 'ABKC', 'Individual registration - Ruby Rose', 'Check', 1, dam2Id, now, now]
  );
  
  // Marketing expenses
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(60), 1200, 'marketing', 'Social Media Ads', 'Facebook and Instagram advertising - Q4', 'Credit Card', 1, now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(90), 350, 'marketing', 'Website Hosting', 'Annual website hosting and domain', 'Credit Card', 1, now, now]
  );
  
  // Utilities expenses
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(0), 120, 'utilities', 'Electric Company', 'Monthly kennel electricity', 'Check', 1, now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(0), 85, 'utilities', 'Water Department', 'Monthly water bill', 'Check', 1, now, now]
  );
  
  // Misc expenses
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(20), 45, 'misc', 'Office Depot', 'Printer paper and office supplies', 'Credit Card', 1, now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(10), 75, 'misc', 'Home Depot', 'Kennel maintenance supplies', 'Credit Card', 1, now, now]
  );
  
  // Custom category expenses
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(30), 200, 'Training', 'Professional Dog Trainer', 'Obedience training for Titan', 'Credit Card', 1, sire2Id, now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(15), 60, 'Grooming', 'Grooming Salon', 'Full groom for Diamond Queen', 'Cash', 1, damId, now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(90), 450, 'Insurance', 'Pet Insurance Co', 'Annual kennel liability insurance', 'Check', 1, now, now]
  );

  // ============================================
  // 17B. ADDITIONAL EXPENSES FOR ALL DOGS
  // ============================================
  
  // Sire (Iron Thunder) - Additional expenses
  await safeExecute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(60), 85, 'vet', 'Valley Vet Clinic', 'Routine checkup - Iron Thunder', 'Credit Card', 1, sireId, now, now],
    'Sire expense 1'
  );
  await safeExecute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(45), 120, 'food', 'Chewy', 'Premium adult dog food - Iron Thunder', 'Credit Card', 1, sireId, now, now],
    'Sire expense 2'
  );
  await safeExecute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(20), 50, 'supplies', 'PetSmart', 'Toys and enrichment - Iron Thunder', 'Credit Card', 1, sireId, now, now],
    'Sire expense 3'
  );
  
  // Dam (Diamond Queen) - Additional expenses
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(50), 95, 'vet', 'Valley Vet Clinic', 'Pre-breeding exam - Diamond Queen', 'Credit Card', 1, damId, now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(40), 110, 'food', 'Chewy', 'Premium adult dog food - Diamond Queen', 'Credit Card', 1, damId, now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(25), 35, 'supplies', 'Amazon', 'Supplements and vitamins - Diamond Queen', 'Credit Card', 1, damId, now, now]
  );
  
  // Dam2 (Ruby Rose) - Additional expenses
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(55), 75, 'vet', 'Valley Vet Clinic', 'Health check - Ruby Rose', 'Credit Card', 1, dam2Id, now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(35), 100, 'food', 'Petco', 'Premium adult dog food - Ruby Rose', 'Credit Card', 1, dam2Id, now, now]
  );
  
  // Dam3 (Sapphire Star) - Expenses
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(65), 110, 'vet', 'Valley Vet Clinic', 'Pregnancy monitoring - Sapphire Star', 'Credit Card', 1, dam3Id, now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(50), 125, 'food', 'Chewy', 'Pregnancy nutrition - Sapphire Star', 'Credit Card', 1, dam3Id, now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(30), 40, 'supplies', 'Amazon', 'Pregnancy supplements - Sapphire Star', 'Credit Card', 1, dam3Id, now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(10), 70, 'Grooming', 'Grooming Salon', 'Pre-whelping groom - Sapphire Star', 'Cash', 1, dam3Id, now, now]
  );
  
  // Retired Dam (Golden Legacy) - Expenses
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(180), 200, 'vet', 'Valley Vet Clinic', 'Spay surgery - Golden Legacy', 'Credit Card', 1, retiredDamId, now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(90), 95, 'vet', 'Valley Vet Clinic', 'Post-surgery checkup - Golden Legacy', 'Credit Card', 1, retiredDamId, now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(30), 90, 'food', 'Chewy', 'Senior dog food - Golden Legacy', 'Credit Card', 1, retiredDamId, now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(15), 45, 'Grooming', 'Grooming Salon', 'Full groom - Golden Legacy', 'Cash', 1, retiredDamId, now, now]
  );
  
  // Puppy expenses - Apollo (Litter A)
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(21), 65, 'vet', 'Valley Vet Clinic', 'Puppy wellness exam - Apollo', 'Credit Card', 1, puppyIds[0], now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(14), 25, 'supplies', 'PetSmart', 'Puppy collar and leash - Apollo', 'Credit Card', 1, puppyIds[0], now, now]
  );
  
  // Puppy expenses - Athena (Litter A)
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(21), 65, 'vet', 'Valley Vet Clinic', 'Puppy wellness exam - Athena', 'Credit Card', 1, puppyIds[1], now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(7), 30, 'registration', 'ABKC', 'Individual registration - Athena', 'Check', 1, puppyIds[1], now, now]
  );
  
  // Puppy expenses - Zeus (Litter A)
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(21), 65, 'vet', 'Valley Vet Clinic', 'Puppy wellness exam - Zeus', 'Credit Card', 1, puppyIds[2], now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(10), 20, 'supplies', 'Amazon', 'Puppy toys - Zeus', 'Credit Card', 1, puppyIds[2], now, now]
  );
  
  // Puppy expenses - Hera (Litter A)
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(21), 65, 'vet', 'Valley Vet Clinic', 'Puppy wellness exam - Hera', 'Credit Card', 1, puppyIds[3], now, now]
  );
  
  // Puppy expenses - Ares (Litter A)
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(21), 65, 'vet', 'Valley Vet Clinic', 'Puppy wellness exam - Ares', 'Credit Card', 1, puppyIds[4], now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(5), 25, 'registration', 'ABKC', 'Individual registration - Ares', 'Check', 1, puppyIds[4], now, now]
  );
  
  // Puppy expenses - Phoenix (Litter B - sold)
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(50), 60, 'vet', 'Valley Vet Clinic', 'Pre-sale health exam - Phoenix', 'Credit Card', 1, litterBPuppyIds[0], now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(45), 30, 'registration', 'ABKC', 'Individual registration - Phoenix', 'Check', 1, litterBPuppyIds[0], now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(40), 35, 'supplies', 'PetSmart', 'Puppy starter kit - Phoenix', 'Credit Card', 1, litterBPuppyIds[0], now, now]
  );
  
  // Puppy expenses - Nova (Litter B - sold, already has transport)
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(50), 60, 'vet', 'Valley Vet Clinic', 'Pre-sale health exam - Nova', 'Credit Card', 1, litterBPuppyIds[1], now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(45), 30, 'registration', 'ABKC', 'Individual registration - Nova', 'Check', 1, litterBPuppyIds[1], now, now]
  );
  
  // Puppy expenses - Orion (Litter B)
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(7), 65, 'vet', 'Valley Vet Clinic', 'Puppy wellness exam - Orion', 'Credit Card', 1, litterBPuppyIds[2], now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(3), 40, 'Training', 'Professional Dog Trainer', 'Early socialization - Orion', 'Credit Card', 1, litterBPuppyIds[2], now, now]
  );
  
  // Puppy expenses - Luna (Litter B)
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(7), 65, 'vet', 'Valley Vet Clinic', 'Puppy wellness exam - Luna', 'Credit Card', 1, litterBPuppyIds[3], now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(2), 30, 'registration', 'ABKC', 'Individual registration - Luna', 'Check', 1, litterBPuppyIds[3], now, now]
  );
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), daysAgo(1), 25, 'Grooming', 'Grooming Salon', 'First groom - Luna', 'Cash', 1, litterBPuppyIds[3], now, now]
  );

  // ============================================
  // 18. TRANSPORTS
  // ============================================
  // Transport 1 - Flight nanny (Nova)
  const transportId = generateId();
  const transportExpenseId = generateId();
  
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [transportExpenseId, daysAgo(8), 450, 'transport', 'Puppy Express', 'Flight nanny for Nova to Houston', 'Credit Card', 1, litterBPuppyIds[1], now, now]
  );
  
  await execute(
    `INSERT INTO transports (id, dog_id, date, mode, shipper_business_name, contact_name, phone, email, origin_city, origin_state, destination_city, destination_state, tracking_number, cost, expense_id, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [transportId, litterBPuppyIds[1], daysAgo(8), 'flight', 'Example Pet Transit', 'Parker Sample', '202-555-0120', 'flight@example.test', 'Austin', 'TX', 'Houston', 'TX', 'DEMO-TRANSIT-1234', 450, transportExpenseId, 'Synthetic flight-nanny delivery record. Puppy arrived safely.', now, now]
  );
  
  // Transport 2 - Ground transport (past transport for retired dam)
  const transport2Id = generateId();
  const transport2ExpenseId = generateId();
  
  await execute(
    `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, related_dog_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [transport2ExpenseId, daysAgo(300), 350, 'transport', 'Ground Transport LLC', 'Ground transport for Golden Legacy', 'Credit Card', 1, retiredDamId, now, now]
  );
  
  await execute(
    `INSERT INTO transports (id, dog_id, date, mode, shipper_business_name, contact_name, phone, email, origin_city, origin_state, destination_city, destination_state, tracking_number, cost, expense_id, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [transport2Id, retiredDamId, daysAgo(300), 'ground', 'Demo Ground Transport', 'Reese Example', '202-555-0121', 'ground@example.test', 'Austin', 'TX', 'Dallas', 'TX', 'DEMO-GROUND-5678', 350, transport2ExpenseId, 'Synthetic completed ground-transport record', now, now]
  );
  
  // Transport 3 - Local pickup (no expense, just record)
  await execute(
    `INSERT INTO transports (id, dog_id, date, mode, origin_city, origin_state, destination_city, destination_state, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), litterBPuppyIds[0], daysAgo(14), 'pickup', 'Austin', 'TX', 'Austin', 'TX', 'Local pickup by client', now, now]
  );

  // ============================================
  // 19. PEDIGREE ENTRIES (for multiple dogs - 3 generations)
  // ============================================
  // Sire pedigree
  const sirePedigreeData = [
    { gen: 1, pos: 'S', name: 'GCH Ironside Warriors King', reg: 'DEMO-PED-0001', color: 'Blue' },
    { gen: 1, pos: 'D', name: 'CH Lady Blue Diamond', reg: 'DEMO-PED-0002', color: 'Blue Tri' },
    { gen: 2, pos: 'SS', name: 'CH Steel Thunder', reg: 'DEMO-PED-0003', color: 'Blue' },
    { gen: 2, pos: 'SD', name: 'Sapphire Queen', reg: 'DEMO-PED-0004', color: 'Lilac' },
    { gen: 2, pos: 'DS', name: 'Diamond Back Ace', reg: 'DEMO-PED-0005', color: 'Blue Fawn' },
    { gen: 2, pos: 'DD', name: 'Pretty Blue Lady', reg: 'DEMO-PED-0006', color: 'Blue Tri' },
  ];
  
  for (const entry of sirePedigreeData) {
    await execute(
      `INSERT INTO pedigree_entries (id, dog_id, generation, position, ancestor_name, ancestor_registration, ancestor_color, ancestor_breed, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), sireId, entry.gen, entry.pos, entry.name, entry.reg, entry.color, 'American Bully', now]
    );
  }
  
  // Dam pedigree
  const damPedigreeData = [
    { gen: 1, pos: 'S', name: 'CH Royal Blue Champion', reg: 'DEMO-PED-0101', color: 'Blue' },
    { gen: 1, pos: 'D', name: 'GCH Diamond Princess', reg: 'DEMO-PED-0102', color: 'Lilac Tri' },
    { gen: 2, pos: 'SS', name: 'CH Blue Thunder', reg: 'DEMO-PED-0103', color: 'Blue' },
    { gen: 2, pos: 'SD', name: 'Royal Sapphire', reg: 'DEMO-PED-0104', color: 'Lilac' },
    { gen: 2, pos: 'DS', name: 'Diamond King', reg: 'DEMO-PED-0105', color: 'Blue Fawn' },
    { gen: 2, pos: 'DD', name: 'Princess Lilac', reg: 'DEMO-PED-0106', color: 'Lilac Tri' },
  ];
  
  for (const entry of damPedigreeData) {
    await execute(
      `INSERT INTO pedigree_entries (id, dog_id, generation, position, ancestor_name, ancestor_registration, ancestor_color, ancestor_breed, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), damId, entry.gen, entry.pos, entry.name, entry.reg, entry.color, 'American Bully', now]
    );
  }
  
  // Sire2 pedigree (partial - 2 generations)
  const sire2PedigreeData = [
    { gen: 1, pos: 'S', name: 'CH Respectabullz Iron Thunder', reg: 'DEMO-REG-0001', color: 'Blue Tri' },
    { gen: 1, pos: 'D', name: 'CH Respectabullz Ruby Rose', reg: 'DEMO-REG-0004', color: 'Champagne' },
  ];
  
  for (const entry of sire2PedigreeData) {
    await execute(
      `INSERT INTO pedigree_entries (id, dog_id, generation, position, ancestor_name, ancestor_registration, ancestor_color, ancestor_breed, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), sire2Id, entry.gen, entry.pos, entry.name, entry.reg, entry.color, 'American Bully', now]
    );
  }

  // ============================================
  // 19. HEALTH SCHEDULE TEMPLATE
  // ============================================
  const templateItems = JSON.stringify([
    { type: 'Deworming', daysAfterBirth: 14, notes: 'First deworming' },
    { type: 'Deworming', daysAfterBirth: 28, notes: 'Second deworming' },
    { type: 'First Vaccine (DHPP)', daysAfterBirth: 42, notes: '6 week vaccine' },
    { type: 'Deworming', daysAfterBirth: 42, notes: 'Third deworming' },
    { type: 'Second Vaccine (DHPP)', daysAfterBirth: 56, notes: '8 week vaccine' },
    { type: 'Microchip', daysAfterBirth: 56, notes: 'Microchip implant' },
    { type: 'Vet Exam', daysAfterBirth: 56, notes: 'Pre-sale health exam' },
  ]);
  
  await execute(
    `INSERT INTO health_schedule_templates (id, name, is_default, items, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [generateId(), 'Standard Puppy Schedule', 1, templateItems, now, now]
  );

  // ============================================
  // 20. BREEDER SETTINGS
  // ============================================
  await execute(
    `INSERT INTO settings (id, key, value, updated_at) VALUES (?, ?, ?, ?)`,
    [generateId(), 'breeder_kennel_name', 'Respectabullz Kennels', now]
  );
  await execute(
    `INSERT INTO settings (id, key, value, updated_at) VALUES (?, ?, ?, ?)`,
    [generateId(), 'breeder_owner_name', 'Demo Breeder', now]
  );
  await execute(
    `INSERT INTO settings (id, key, value, updated_at) VALUES (?, ?, ?, ?)`,
    [generateId(), 'breeder_phone', '555-BULLY', now]
  );
  await execute(
    `INSERT INTO settings (id, key, value, updated_at) VALUES (?, ?, ?, ?)`,
    [generateId(), 'breeder_email', 'demo.breeder@example.test', now]
  );
  await execute(
    `INSERT INTO settings (id, key, value, updated_at) VALUES (?, ?, ?, ?)`,
    [generateId(), 'breeder_city', 'Austin', now]
  );
  await execute(
    `INSERT INTO settings (id, key, value, updated_at) VALUES (?, ?, ?, ?)`,
    [generateId(), 'breeder_state', 'TX', now]
  );
  await execute(
    `INSERT INTO settings (id, key, value, updated_at) VALUES (?, ?, ?, ?)`,
    [generateId(), 'breeder_default_breed', 'American Bully', now]
  );

  await invoke('apply_demo_seed', { statements: seedStatements });

  console.log('[Seed] ✅ Database seeded successfully with comprehensive sample data!');
  console.log('[Seed] Created:');
  console.log('[Seed]   - 6 adult dogs (2 studs, 4 dams including 1 retired)');
  console.log('[Seed]   - 9 puppies across 2 litters');
  console.log('[Seed]   - 4 litters (weaning, ready to go, planned, completed)');
  console.log('[Seed]   - 2 external studs');
  console.log('[Seed]   - 4 heat cycles with detailed events');
  console.log('[Seed]   - Genetic tests for all breeding dogs (full panels)');
  console.log('[Seed]   - Vaccination records for all dogs (adults and puppies)');
  console.log('[Seed]   - Medical records (exams, tests, surgeries)');
  console.log('[Seed]   - Weight entries for multiple dogs (puppies and adults)');
  console.log('[Seed]   - 5 clients with sales, interests, and waitlist entries');
  console.log('[Seed]   - Communication logs and follow-ups');
  console.log('[Seed]   - 50+ expenses across all categories (including custom categories)');
  console.log('[Seed]   - Financial records for all dogs (adults and puppies)');
  console.log('[Seed]   - 3 custom expense categories (Training, Grooming, Insurance)');
  console.log('[Seed]   - 3 transport records (flight, ground, pickup)');
  console.log('[Seed]   - Pedigree entries for multiple dogs (3 generations)');
  console.log('[Seed]   - Health schedule templates');
  console.log('[Seed]   - Breeder settings configured');
  } catch (error) {
    const detail = error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Unknown database error';
    throw new Error(`Synthetic demo seed was rolled back: ${detail}`);
  }
}

