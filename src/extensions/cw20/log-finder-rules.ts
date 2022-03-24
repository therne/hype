import { createReturningLogFinder, LogFinderRule, ReturningLogFinderMapper } from '@terra-money/log-finder';
import { decimalToNumber, DEFAULT_CW20_DECIMAL } from './decimal-utils';

/**
 * A CW20 transfer log including both send and transfer transactions.
 * Note: for simplicity, this extension does not capture the CW20 send hook payload— if you want to catch'em, you may need to implement it by yourself.
 */
export interface CW20TransferLog {
  action: 'send' | 'transfer';
  from: string;
  to: string;
  amount: number;
}

export const cw20EventCaptureRule = (tokenAddress: string, actions: string[]): LogFinderRule => ({
  type: 'from_contract',
  attributes: [
    ['contract_address', tokenAddress],
    ['action', (action: string) => actions.includes(action)],
    ['from'],
    ['to'],
    ['amount'],
  ],
});

/**
 * Creates a rule capturing send (i.e. transfer with contract interaction) logs of a CW20 token.
 * @param tokenAddress An address of CW20-compliant token
 */
export const cw20SendRule = (tokenAddress: string): LogFinderRule => cw20EventCaptureRule(tokenAddress, ['send']);

/**
 * Finds send (i.e. transfer with contract interaction) logs of a CW20 token.
 * @param tokenAddress An address of CW20-compliant token
 * @param decimals A decimal place the token uses
 */
export const createCw20SendLogFinder = (
  tokenAddress: string,
  decimals = DEFAULT_CW20_DECIMAL,
): ReturningLogFinderMapper<CW20TransferLog> =>
  createReturningLogFinder(cw20SendRule(tokenAddress), (_, match) => ({
    action: 'send',
    from: match[2].value,
    to: match[3].value,
    amount: decimalToNumber(match[4].value, decimals),
  }));

/**
 * Creates a rule capturing transfer logs of a CW20 token.
 * @param tokenAddress An address of CW20-compliant token
 */
export const cw20TransferRule = (tokenAddress: string): LogFinderRule =>
  cw20EventCaptureRule(tokenAddress, ['transfer']);

/**
 * Finds transfer logs of a CW20 token.
 * @param tokenAddress An address of CW20-compliant token
 * @param decimals A decimal place the token uses
 */
export const createCw20TransferLogFinder = (
  tokenAddress: string,
  decimals = DEFAULT_CW20_DECIMAL,
): ReturningLogFinderMapper<CW20TransferLog> =>
  createReturningLogFinder(cw20TransferRule(tokenAddress), (_, match) => ({
    action: 'transfer',
    from: match[2].value,
    to: match[3].value,
    amount: decimalToNumber(match[4].value, decimals),
  }));
