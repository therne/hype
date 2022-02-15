export const DEFAULT_CW20_DECIMAL = 6;

export const decimalToNumber = (dec: string, decimals = DEFAULT_CW20_DECIMAL): number =>
  Number(dec.slice(0, dec.length - decimals) + '.' + dec.slice(dec.length - decimals));

export const numberToDecimal = (num: number, decimals = DEFAULT_CW20_DECIMAL): string => {
  const [int, frac] = num.toString().split('.');
  return int + frac.slice(0, decimals).padEnd(decimals, '0');
};
