/**
 * Commission calculation utilities
 * Handles commission calculations based on revenue and commission models
 */

import { CommissionModel } from '@/lib/types';

/**
 * Calculate commission based on revenue and commission percentage
 * 
 * @param revenue - The revenue amount (sales_revenue or total_revenue)
 * @param commissionPercentage - Commission percentage (0-100)
 * @returns Calculated commission amount
 * 
 * @throws Error if commission percentage is outside valid range (0-100)
 * 
 * @example
 * calculateCommission(10000, 15) // 1500
 * calculateCommission(5000, 10) // 500
 */
export function calculateCommission(
  revenue: number,
  commissionPercentage: number
): number {
  // Validate commission percentage range
  if (commissionPercentage < 0 || commissionPercentage > 100) {
    throw new Error('Komisyon yüzdesi 0 ile 100 arasında olmalıdır');
  }

  // Validate revenue is non-negative
  if (revenue < 0) {
    throw new Error('Gelir negatif olamaz');
  }

  // Calculate commission
  const commission = revenue * (commissionPercentage / 100);

  // Round to 2 decimal places to avoid floating point precision issues
  return Math.round(commission * 100) / 100;
}

/**
 * Calculate commission using a commission model
 * 
 * @param revenue - Revenue object with sales_revenue and total_revenue
 * @param commissionModel - Commission model with percentage and calculation basis
 * @returns Calculated commission amount
 * 
 * @example
 * const revenue = { sales_revenue: 10000, total_revenue: 15000 };
 * const model = { commission_percentage: 15, calculation_basis: 'sales_revenue' };
 * calculateCommissionWithModel(revenue, model) // 1500
 */
export function calculateCommissionWithModel(
  revenue: { sales_revenue: number; total_revenue: number },
  commissionModel: Pick<CommissionModel, 'commission_percentage' | 'calculation_basis'>
): number {
  // Determine which revenue to use based on calculation basis
  const revenueAmount =
    commissionModel.calculation_basis === 'sales_revenue'
      ? revenue.sales_revenue
      : revenue.total_revenue;

  return calculateCommission(revenueAmount, commissionModel.commission_percentage);
}

/**
 * Validate commission percentage
 * 
 * @param percentage - Commission percentage to validate
 * @returns true if valid, false otherwise
 * 
 * @example
 * isValidCommissionPercentage(50) // true
 * isValidCommissionPercentage(150) // false
 * isValidCommissionPercentage(-10) // false
 */
export function isValidCommissionPercentage(percentage: number): boolean {
  return percentage >= 0 && percentage <= 100;
}

/**
 * Validate calculation basis
 * 
 * @param basis - Calculation basis to validate
 * @returns true if valid, false otherwise
 * 
 * @example
 * isValidCalculationBasis('sales_revenue') // true
 * isValidCalculationBasis('total_revenue') // true
 * isValidCalculationBasis('invalid') // false
 */
export function isValidCalculationBasis(
  basis: string
): basis is 'sales_revenue' | 'total_revenue' {
  return basis === 'sales_revenue' || basis === 'total_revenue';
}
