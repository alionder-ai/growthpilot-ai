// @ts-nocheck
/**
 * Unit tests for commission calculation utilities
 */

import {
  calculateCommission,
  calculateCommissionWithModel,
  isValidCommissionPercentage,
  isValidCalculationBasis,
} from '@/lib/utils/commission';

describe('Commission Utilities', () => {
  describe('calculateCommission', () => {
    it('should calculate commission correctly for valid inputs', () => {
      expect(calculateCommission(10000, 15)).toBe(1500);
      expect(calculateCommission(5000, 10)).toBe(500);
      expect(calculateCommission(1234.56, 20)).toBe(246.91);
    });

    it('should handle edge cases', () => {
      expect(calculateCommission(10000, 0)).toBe(0);
      expect(calculateCommission(10000, 100)).toBe(10000);
      expect(calculateCommission(0, 50)).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      expect(calculateCommission(100, 33.33)).toBe(33.33);
      expect(calculateCommission(1000, 15.555)).toBe(155.55);
    });

    it('should throw error for invalid commission percentage', () => {
      expect(() => calculateCommission(10000, -5)).toThrow(
        'Komisyon yüzdesi 0 ile 100 arasında olmalıdır'
      );
      expect(() => calculateCommission(10000, 150)).toThrow(
        'Komisyon yüzdesi 0 ile 100 arasında olmalıdır'
      );
    });

    it('should throw error for negative revenue', () => {
      expect(() => calculateCommission(-1000, 15)).toThrow(
        'Gelir negatif olamaz'
      );
    });
  });

  describe('calculateCommissionWithModel', () => {
    it('should calculate commission based on sales_revenue', () => {
      const revenue = { sales_revenue: 10000, total_revenue: 15000 };
      const model = {
        commission_percentage: 15,
        calculation_basis: 'sales_revenue' as const,
      };
      expect(calculateCommissionWithModel(revenue, model)).toBe(1500);
    });

    it('should calculate commission based on total_revenue', () => {
      const revenue = { sales_revenue: 10000, total_revenue: 15000 };
      const model = {
        commission_percentage: 15,
        calculation_basis: 'total_revenue' as const,
      };
      expect(calculateCommissionWithModel(revenue, model)).toBe(2250);
    });

    it('should handle zero revenue', () => {
      const revenue = { sales_revenue: 0, total_revenue: 0 };
      const model = {
        commission_percentage: 15,
        calculation_basis: 'sales_revenue' as const,
      };
      expect(calculateCommissionWithModel(revenue, model)).toBe(0);
    });
  });

  describe('isValidCommissionPercentage', () => {
    it('should return true for valid percentages', () => {
      expect(isValidCommissionPercentage(0)).toBe(true);
      expect(isValidCommissionPercentage(50)).toBe(true);
      expect(isValidCommissionPercentage(100)).toBe(true);
      expect(isValidCommissionPercentage(15.5)).toBe(true);
    });

    it('should return false for invalid percentages', () => {
      expect(isValidCommissionPercentage(-1)).toBe(false);
      expect(isValidCommissionPercentage(101)).toBe(false);
      expect(isValidCommissionPercentage(150)).toBe(false);
    });
  });

  describe('isValidCalculationBasis', () => {
    it('should return true for valid calculation basis', () => {
      expect(isValidCalculationBasis('sales_revenue')).toBe(true);
      expect(isValidCalculationBasis('total_revenue')).toBe(true);
    });

    it('should return false for invalid calculation basis', () => {
      expect(isValidCalculationBasis('invalid')).toBe(false);
      expect(isValidCalculationBasis('revenue')).toBe(false);
      expect(isValidCalculationBasis('')).toBe(false);
    });
  });
});
