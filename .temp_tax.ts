import type { EmploymentType } from '../types';

export function calcTax(gross: number, taxRate: number): number {
  return Math.round(gross * taxRate);
}

export function calcNet(gross: number, taxRate: number): number {
  return gross - calcTax(gross, taxRate);
}

export function calculateSalaryTaxes(gross: number, type: EmploymentType) {
  let taxRate = 0;

  switch (type) {
    case 'official':
    case 'gph':
      taxRate = 0.13;
      break;
    case 'self_employed':
      taxRate = 0.06;
      break;
    default:
      taxRate = 0;
  }

  const tax = Math.round(gross * taxRate);
  const net = gross - tax;

  return { tax, net, taxRate };
}
