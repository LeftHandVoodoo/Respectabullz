// Unit tests for breeding utility functions
import { describe, it, expect } from 'vitest';
import { getBreedingRecommendation } from '../breeding';

describe('getBreedingRecommendation', () => {
  it('identifies early proestrus (< 1.0 ng/mL)', () => {
    const result = getBreedingRecommendation(0.5);
    expect(result.phase).toBe('Proestrus (early)');
    expect(result.isOptimal).toBe(false);
    expect(result.daysUntilOptimal).toBe(5);
  });

  it('identifies late proestrus (1.0 - 2.0 ng/mL)', () => {
    const result = getBreedingRecommendation(1.5);
    expect(result.phase).toBe('Proestrus (late)');
    expect(result.isOptimal).toBe(false);
    expect(result.daysUntilOptimal).toBe(3);
  });

  it('identifies LH surge (2.0 - 3.0 ng/mL)', () => {
    const result = getBreedingRecommendation(2.5);
    expect(result.phase).toBe('LH surge');
    expect(result.isOptimal).toBe(false);
    expect(result.daysUntilOptimal).toBe(2);
    expect(result.recommendation).toContain('LH surge');
  });

  it('identifies ovulation (3.0 - 5.0 ng/mL)', () => {
    const result = getBreedingRecommendation(4.0);
    expect(result.phase).toBe('Ovulation');
    expect(result.isOptimal).toBe(false);
    expect(result.daysUntilOptimal).toBe(1);
  });

  it('identifies optimal breeding window (5.0 - 15.0 ng/mL)', () => {
    const result = getBreedingRecommendation(8.0);
    expect(result.phase).toBe('Optimal breeding window');
    expect(result.isOptimal).toBe(true);
    expect(result.recommendation).toContain('OPTIMAL');
  });

  it('identifies optimal at lower bound (5.0 ng/mL)', () => {
    const result = getBreedingRecommendation(5.0);
    expect(result.phase).toBe('Optimal breeding window');
    expect(result.isOptimal).toBe(true);
  });

  it('identifies optimal at upper bound (14.9 ng/mL)', () => {
    const result = getBreedingRecommendation(14.9);
    expect(result.phase).toBe('Optimal breeding window');
    expect(result.isOptimal).toBe(true);
  });

  it('identifies late breeding window (15.0 - 25.0 ng/mL)', () => {
    const result = getBreedingRecommendation(20.0);
    expect(result.phase).toBe('Late breeding window');
    expect(result.isOptimal).toBe(false);
    expect(result.recommendation).toContain('closing');
  });

  it('identifies post-fertile (> 25.0 ng/mL)', () => {
    const result = getBreedingRecommendation(30.0);
    expect(result.phase).toBe('Post-fertile');
    expect(result.isOptimal).toBe(false);
    expect(result.recommendation).toContain('closed');
  });

  it('handles edge case at exactly 2.0 ng/mL (LH surge start)', () => {
    const result = getBreedingRecommendation(2.0);
    expect(result.phase).toBe('LH surge');
  });

  it('handles edge case at exactly 3.0 ng/mL (ovulation start)', () => {
    const result = getBreedingRecommendation(3.0);
    expect(result.phase).toBe('Ovulation');
  });

  it('handles edge case at exactly 15.0 ng/mL (late window start)', () => {
    const result = getBreedingRecommendation(15.0);
    expect(result.phase).toBe('Late breeding window');
  });

  it('handles very low levels (0 ng/mL)', () => {
    const result = getBreedingRecommendation(0);
    expect(result.phase).toBe('Proestrus (early)');
    expect(result.isOptimal).toBe(false);
  });

  it('handles very high levels (100 ng/mL)', () => {
    const result = getBreedingRecommendation(100);
    expect(result.phase).toBe('Post-fertile');
    expect(result.isOptimal).toBe(false);
  });

  it('returns recommendation for each phase', () => {
    // Test that all phases have non-empty recommendations
    const levels = [0.5, 1.5, 2.5, 4.0, 8.0, 20.0, 30.0];
    for (const level of levels) {
      const result = getBreedingRecommendation(level);
      expect(result.recommendation).toBeTruthy();
      expect(result.recommendation.length).toBeGreaterThan(0);
    }
  });
});

