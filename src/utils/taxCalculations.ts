export function calcTax(gross: number, taxRate: number): number {
  return Math.round(gross * taxRate);
}

export function calcNet(gross: number, taxRate: number): number {
  return gross - calcTax(gross, taxRate);
}
