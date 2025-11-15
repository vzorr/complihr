import { Injectable } from '@nestjs/common';

export interface NIThresholds {
  primaryThreshold: number; // PT - £242/week, £1,048/month
  upperEarningsLimit: number; // UEL - £967/week, £4,189/month
  secondaryThreshold: number; // ST - £175/week, £758/month
}

export interface NICalculation {
  grossPay: number;
  category: string;
  employeeNI: number;
  employerNI: number;
  totalNI: number;
}

@Injectable()
export class NiCalculatorService {
  // NI Thresholds 2024/25 (monthly)
  private readonly MONTHLY_THRESHOLDS: NIThresholds = {
    primaryThreshold: 1048, // £12,570/year
    upperEarningsLimit: 4189, // £50,270/year
    secondaryThreshold: 758, // £9,100/year
  };

  // NI Category Rates
  private readonly NI_RATES = {
    A: { // Standard rate
      employeeBelowUEL: 0.12, // 12% between PT and UEL
      employeeAboveUEL: 0.02, // 2% above UEL
      employerAboveST: 0.138, // 13.8% above ST
    },
    B: { // Married women and widows (reduced rate)
      employeeBelowUEL: 0.0585,
      employeeAboveUEL: 0.02,
      employerAboveST: 0.138,
    },
    C: { // Over state pension age (employee pays nothing)
      employeeBelowUEL: 0,
      employeeAboveUEL: 0,
      employerAboveST: 0.138,
    },
    H: { // Apprentice under 25
      employeeBelowUEL: 0.12,
      employeeAboveUEL: 0.02,
      employerAboveST: 0, // No employer NI for apprentices under 25 up to UEL
    },
    M: { // Under 21
      employeeBelowUEL: 0.12,
      employeeAboveUEL: 0.02,
      employerAboveST: 0, // No employer NI for under 21 up to UEL
    },
  };

  /**
   * Calculate National Insurance contributions
   * @param grossPay Monthly gross pay
   * @param category NI category (A, B, C, H, M, etc.)
   * @param payPeriod Pay period (1-12 for monthly)
   * @param ytdGross Year-to-date gross (for directors)
   */
  calculateNI(
    grossPay: number,
    category: string = 'A',
    payPeriod: number = 1,
    ytdGross: number = 0,
  ): NICalculation {
    const rates = this.NI_RATES[category] || this.NI_RATES.A;

    // Employee NI
    let employeeNI = 0;

    // Amount between PT and UEL
    const amountBetweenPTandUEL = Math.max(
      0,
      Math.min(grossPay, this.MONTHLY_THRESHOLDS.upperEarningsLimit) -
        this.MONTHLY_THRESHOLDS.primaryThreshold,
    );

    // Amount above UEL
    const amountAboveUEL = Math.max(
      0,
      grossPay - this.MONTHLY_THRESHOLDS.upperEarningsLimit,
    );

    // Calculate employee NI
    employeeNI += amountBetweenPTandUEL * rates.employeeBelowUEL;
    employeeNI += amountAboveUEL * rates.employeeAboveUEL;

    // Employer NI
    let employerNI = 0;

    // Amount above secondary threshold
    const amountAboveST = Math.max(
      0,
      grossPay - this.MONTHLY_THRESHOLDS.secondaryThreshold,
    );

    // Calculate employer NI
    // For categories H and M, no employer NI up to UEL
    if (category === 'H' || category === 'M') {
      const employerNIAmount = Math.max(
        0,
        grossPay - this.MONTHLY_THRESHOLDS.upperEarningsLimit,
      );
      employerNI = employerNIAmount * rates.employerAboveST;
    } else {
      employerNI = amountAboveST * rates.employerAboveST;
    }

    // Round to 2 decimal places
    employeeNI = Math.round(employeeNI * 100) / 100;
    employerNI = Math.round(employerNI * 100) / 100;

    return {
      grossPay,
      category,
      employeeNI,
      employerNI,
      totalNI: employeeNI + employerNI,
    };
  }

  /**
   * Calculate weekly NI (for weekly paid employees)
   */
  calculateWeeklyNI(
    weeklyGross: number,
    category: string = 'A',
  ): NICalculation {
    // Weekly thresholds
    const weeklyPT = 242;
    const weeklyUEL = 967;
    const weeklyST = 175;

    const rates = this.NI_RATES[category] || this.NI_RATES.A;

    // Employee NI
    let employeeNI = 0;
    const amountBetweenPTandUEL = Math.max(
      0,
      Math.min(weeklyGross, weeklyUEL) - weeklyPT,
    );
    const amountAboveUEL = Math.max(0, weeklyGross - weeklyUEL);

    employeeNI += amountBetweenPTandUEL * rates.employeeBelowUEL;
    employeeNI += amountAboveUEL * rates.employeeAboveUEL;

    // Employer NI
    let employerNI = 0;
    const amountAboveST = Math.max(0, weeklyGross - weeklyST);

    if (category === 'H' || category === 'M') {
      const employerNIAmount = Math.max(0, weeklyGross - weeklyUEL);
      employerNI = employerNIAmount * rates.employerAboveST;
    } else {
      employerNI = amountAboveST * rates.employerAboveST;
    }

    employeeNI = Math.round(employeeNI * 100) / 100;
    employerNI = Math.round(employerNI * 100) / 100;

    return {
      grossPay: weeklyGross,
      category,
      employeeNI,
      employerNI,
      totalNI: employeeNI + employerNI,
    };
  }

  /**
   * Get NI thresholds for a given frequency
   */
  getThresholds(frequency: 'weekly' | 'monthly' | 'annual'): NIThresholds {
    switch (frequency) {
      case 'weekly':
        return {
          primaryThreshold: 242,
          upperEarningsLimit: 967,
          secondaryThreshold: 175,
        };
      case 'monthly':
        return this.MONTHLY_THRESHOLDS;
      case 'annual':
        return {
          primaryThreshold: 12570,
          upperEarningsLimit: 50270,
          secondaryThreshold: 9100,
        };
      default:
        return this.MONTHLY_THRESHOLDS;
    }
  }
}
