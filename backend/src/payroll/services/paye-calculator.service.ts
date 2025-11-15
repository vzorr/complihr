import { Injectable } from '@nestjs/common';

export interface TaxBand {
  lowerLimit: number;
  upperLimit: number;
  rate: number;
  name: string;
}

export interface PAYECalculation {
  grossPay: number;
  taxCode: string;
  personalAllowance: number;
  taxableIncome: number;
  basicRateTax: number;
  higherRateTax: number;
  additionalRateTax: number;
  totalTax: number;
}

@Injectable()
export class PayeCalculatorService {
  // UK Tax Bands 2024/25
  private readonly TAX_BANDS: TaxBand[] = [
    { lowerLimit: 0, upperLimit: 37700, rate: 0.20, name: 'Basic Rate' },
    { lowerLimit: 37700, upperLimit: 125140, rate: 0.40, name: 'Higher Rate' },
    { lowerLimit: 125140, upperLimit: Infinity, rate: 0.45, name: 'Additional Rate' },
  ];

  /**
   * Extract personal allowance from tax code
   * Example: 1257L = £12,570 per year
   */
  extractPersonalAllowance(taxCode: string): number {
    // Extract numeric portion from tax code
    const numericPart = taxCode.match(/\d+/);

    if (!numericPart) {
      return 0;
    }

    // Multiply by 10 to get annual allowance
    const annualAllowance = parseInt(numericPart[0]) * 10;

    return annualAllowance;
  }

  /**
   * Calculate PAYE tax for a given period (monthly)
   * @param grossPay Gross pay for the period
   * @param taxCode Tax code (e.g., '1257L')
   * @param payPeriod Current pay period (1-12 for monthly)
   * @param ytdGross Year-to-date gross pay (before this period)
   * @param ytdTax Year-to-date tax paid (before this period)
   * @param isWeek1Month1 Week 1/Month 1 basis (non-cumulative)
   */
  calculatePAYE(
    grossPay: number,
    taxCode: string,
    payPeriod: number = 1,
    ytdGross: number = 0,
    ytdTax: number = 0,
    isWeek1Month1: boolean = false,
  ): PAYECalculation {
    const annualAllowance = this.extractPersonalAllowance(taxCode);

    if (isWeek1Month1) {
      // Non-cumulative: Calculate tax for this period only
      return this.calculateNonCumulativePAYE(grossPay, annualAllowance);
    } else {
      // Cumulative: Calculate based on YTD figures
      return this.calculateCumulativePAYE(
        grossPay,
        annualAllowance,
        payPeriod,
        ytdGross,
        ytdTax,
      );
    }
  }

  /**
   * Week 1/Month 1 (non-cumulative) PAYE calculation
   */
  private calculateNonCumulativePAYE(
    grossPay: number,
    annualAllowance: number,
  ): PAYECalculation {
    // Monthly personal allowance
    const monthlyAllowance = annualAllowance / 12;

    // Taxable income for this period
    const taxableIncome = Math.max(0, grossPay - monthlyAllowance);

    // Calculate tax on taxable income
    const { basicRateTax, higherRateTax, additionalRateTax } =
      this.calculateTaxByBands(taxableIncome, 12); // Monthly bands

    const totalTax = basicRateTax + higherRateTax + additionalRateTax;

    return {
      grossPay,
      taxCode: 'Week1/Month1',
      personalAllowance: monthlyAllowance,
      taxableIncome,
      basicRateTax,
      higherRateTax,
      additionalRateTax,
      totalTax,
    };
  }

  /**
   * Cumulative PAYE calculation
   */
  private calculateCumulativePAYE(
    grossPay: number,
    annualAllowance: number,
    payPeriod: number,
    ytdGross: number,
    ytdTax: number,
  ): PAYECalculation {
    // Total gross to date (including this period)
    const totalGrossToDate = ytdGross + grossPay;

    // Personal allowance to date
    const allowanceToDate = (annualAllowance / 12) * payPeriod;

    // Taxable income to date
    const taxableIncomeToDate = Math.max(0, totalGrossToDate - allowanceToDate);

    // Calculate total tax due to date
    const { basicRateTax, higherRateTax, additionalRateTax } =
      this.calculateTaxByBands(taxableIncomeToDate, 12 / payPeriod); // Proportional bands

    const totalTaxToDate = basicRateTax + higherRateTax + additionalRateTax;

    // Tax due this period = total tax to date - tax already paid
    const totalTax = Math.max(0, totalTaxToDate - ytdTax);

    return {
      grossPay,
      taxCode: 'Cumulative',
      personalAllowance: allowanceToDate - (ytdGross - grossPay > 0 ? (annualAllowance / 12) * (payPeriod - 1) : 0),
      taxableIncome: taxableIncomeToDate - (totalGrossToDate - grossPay - allowanceToDate + (annualAllowance / 12) * payPeriod),
      basicRateTax: basicRateTax * (totalTax / totalTaxToDate),
      higherRateTax: higherRateTax * (totalTax / totalTaxToDate),
      additionalRateTax: additionalRateTax * (totalTax / totalTaxToDate),
      totalTax,
    };
  }

  /**
   * Calculate tax by bands
   */
  private calculateTaxByBands(
    taxableIncome: number,
    periodsPerYear: number,
  ): {
    basicRateTax: number;
    higherRateTax: number;
    additionalRateTax: number;
  } {
    let basicRateTax = 0;
    let higherRateTax = 0;
    let additionalRateTax = 0;

    // Adjust bands for pay frequency
    const adjustedBands = this.TAX_BANDS.map(band => ({
      ...band,
      lowerLimit: band.lowerLimit / periodsPerYear,
      upperLimit: band.upperLimit === Infinity ? Infinity : band.upperLimit / periodsPerYear,
    }));

    let remainingIncome = taxableIncome;

    for (const band of adjustedBands) {
      if (remainingIncome <= 0) break;

      const taxableInBand = Math.min(
        remainingIncome,
        band.upperLimit - band.lowerLimit,
      );

      const taxForBand = taxableInBand * band.rate;

      if (band.name === 'Basic Rate') {
        basicRateTax += taxForBand;
      } else if (band.name === 'Higher Rate') {
        higherRateTax += taxForBand;
      } else if (band.name === 'Additional Rate') {
        additionalRateTax += taxForBand;
      }

      remainingIncome -= taxableInBand;
    }

    return {
      basicRateTax: Math.round(basicRateTax * 100) / 100,
      higherRateTax: Math.round(higherRateTax * 100) / 100,
      additionalRateTax: Math.round(additionalRateTax * 100) / 100,
    };
  }

  /**
   * Simple monthly PAYE calculation (for testing)
   */
  calculateMonthlyPAYE(
    monthlyGross: number,
    taxCode: string,
  ): number {
    const annualAllowance = this.extractPersonalAllowance(taxCode);
    const monthlyAllowance = annualAllowance / 12;
    const taxableIncome = Math.max(0, monthlyGross - monthlyAllowance);

    const annualTaxableIncome = taxableIncome * 12;

    // Calculate annual tax
    let annualTax = 0;
    let remainingIncome = annualTaxableIncome;

    for (const band of this.TAX_BANDS) {
      if (remainingIncome <= 0) break;

      const taxableInBand = Math.min(
        remainingIncome,
        band.upperLimit - band.lowerLimit,
      );

      annualTax += taxableInBand * band.rate;
      remainingIncome -= taxableInBand;
    }

    // Return monthly tax
    return Math.round((annualTax / 12) * 100) / 100;
  }
}
