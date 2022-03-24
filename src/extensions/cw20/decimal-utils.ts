/**
 * In Terra, most of tokens such as CW20 tokens and native tokens have 6 points of decimals.
 */
export const DEFAULT_CW20_DECIMAL = 6;

/**
 * Converts a CosmWasm decimal (numeric-string) into a {@link Number}.
 * @param dec A numeric string (e.g. `'4560000'`)
 * @param decimals decimal place. defaults to {@link DEFAULT_CW20_DECIMAL}.
 * @returns A Javascript Number (e.g. `45.6`)
 */
export const decimalToNumber = (dec: string, decimals = DEFAULT_CW20_DECIMAL): number =>
  Number(dec.slice(0, dec.length - decimals) + '.' + dec.slice(dec.length - decimals));

/**
 * Converts a {@link Number} into a CosmWasm decimal (numeric-string) format.
 * @param num A javascript Number (e.g. `45.6`)
 * @param decimals decimal place. defaults to {@link DEFAULT_CW20_DECIMAL}.
 * @returns A numeric string (e.g. `4560000`)
 */
export const numberToDecimal = (num: number, decimals = DEFAULT_CW20_DECIMAL): string => {
  const [int, frac] = num.toString().split('.');
  return int + frac.slice(0, decimals).padEnd(decimals, '0');
};
