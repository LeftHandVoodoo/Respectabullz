// Unit tests for legacy utility functions
import { describe, it, expect } from 'vitest';
import { COMMON_GENETIC_TESTS } from '../legacy';

describe('COMMON_GENETIC_TESTS', () => {
  it('should contain all expected test types', () => {
    const testTypes = COMMON_GENETIC_TESTS.map(t => t.type);

    expect(testTypes).toContain('DM');
    expect(testTypes).toContain('HUU');
    expect(testTypes).toContain('CMR1');
    expect(testTypes).toContain('EIC');
    expect(testTypes).toContain('vWD1');
    expect(testTypes).toContain('PRA-prcd');
    expect(testTypes).toContain('other');
  });

  it('should have 13 genetic tests defined', () => {
    expect(COMMON_GENETIC_TESTS).toHaveLength(13);
  });

  it('should have consistent structure for all tests', () => {
    for (const test of COMMON_GENETIC_TESTS) {
      expect(test).toHaveProperty('type');
      expect(test).toHaveProperty('name');
      expect(test).toHaveProperty('fullName');
      expect(test).toHaveProperty('description');
      expect(typeof test.type).toBe('string');
      expect(typeof test.name).toBe('string');
      expect(typeof test.fullName).toBe('string');
      expect(typeof test.description).toBe('string');
    }
  });

  it('should have DM with correct details', () => {
    const dm = COMMON_GENETIC_TESTS.find(t => t.type === 'DM');
    expect(dm).toBeDefined();
    expect(dm?.name).toBe('DM');
    expect(dm?.fullName).toBe('Degenerative Myelopathy');
    expect(dm?.description).toContain('neurological');
  });

  it('should have HUU with correct details', () => {
    const huu = COMMON_GENETIC_TESTS.find(t => t.type === 'HUU');
    expect(huu).toBeDefined();
    expect(huu?.name).toBe('HUU');
    expect(huu?.fullName).toBe('Hyperuricosuria');
    expect(huu?.description).toContain('stone');
  });

  it('should have MDR1 with correct details', () => {
    const mdr1 = COMMON_GENETIC_TESTS.find(t => t.type === 'MDR1');
    expect(mdr1).toBeDefined();
    expect(mdr1?.fullName).toBe('Multi-Drug Resistance 1');
    expect(mdr1?.description).toContain('Drug sensitivity');
  });

  it('should have other type for custom tests', () => {
    const other = COMMON_GENETIC_TESTS.find(t => t.type === 'other');
    expect(other).toBeDefined();
    expect(other?.fullName).toBe('Other');
    expect(other?.description).toContain('Custom');
  });
});

describe('Genetic Test Types', () => {
  it('should have unique types', () => {
    const types = COMMON_GENETIC_TESTS.map(t => t.type);
    const uniqueTypes = [...new Set(types)];
    expect(types.length).toBe(uniqueTypes.length);
  });

  it('should have unique names', () => {
    const names = COMMON_GENETIC_TESTS.map(t => t.name);
    const uniqueNames = [...new Set(names)];
    expect(names.length).toBe(uniqueNames.length);
  });
});
