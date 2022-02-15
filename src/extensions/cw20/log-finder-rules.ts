import { createReturningLogFinder, LogFinderRule, ReturningLogFinderMapper } from '@terra-money/log-finder';
import { decimalToNumber, DEFAULT_CW20_DECIMAL } from './decimal-utils';

export interface CW20TransferLog {
  action: 'send' | 'transfer';
  from: string;
  to: string;
  amount: number;
}

export const cw20SendRule = (tokenAddress: string): LogFinderRule => ({
  type: 'from_contract',
  attributes: [['contract_address', tokenAddress], ['action', 'send'], ['from'], ['to'], ['amount']],
});

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

export const cw20TransferRule = (tokenAddress: string): LogFinderRule => ({
  type: 'from_contract',
  attributes: [['contract_address', tokenAddress], ['action', 'transfer'], ['from'], ['to'], ['amount']],
});

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
