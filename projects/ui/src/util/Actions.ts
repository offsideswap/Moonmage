import React from 'react';
import BigNumber from 'bignumber.js';
import Token from '~/classes/Token';
import { FarmFromMode, FarmToMode } from '~/lib/Moonmage/Farm';
import { displayFullBN, displayTokenAmount } from '~/util/Tokens';
import copy from '~/constants/copy';
import { MOON, PODS, SPROUTS } from '../constants/tokens';
import { displayBN, trimAddress } from './index';

export enum ActionType {
  /// GENERIC
  BASE,
  END_TOKEN,
  SWAP,
  RECEIVE_TOKEN,
  TRANSFER_BALANCE,

  /// SILO
  DEPOSIT,
  WITHDRAW,
  IN_TRANSIT,
  UPDATE_SILO_REWARDS,
  CLAIM_WITHDRAWAL,
  TRANSFER,

  /// FIELD
  BUY_MOONS,
  BURN_MOONS,
  RECEIVE_PODS,
  HARVEST,
  RECEIVE_MOONS,
  TRANSFER_PODS,
  
  /// MARKET
  CREATE_ORDER,
  BUY_PODS,
  SELL_PODS,
  
  /// SHIP
  RINSE,
  BUY_FERTILIZER,
  RECEIVE_FERT_REWARDS,
}

/// ////////////////////////////// GENERIC /////////////////////////////////

export type BaseAction = {
  type: ActionType.BASE;
  message?: string | React.ReactElement;
}

export type EndTokenAction = {
  type: ActionType.END_TOKEN;
  token: Token;
}

export type SwapAction = {
  type: ActionType.SWAP;
  tokenIn: Token;
  amountIn: BigNumber;
  tokenOut: Token;
  amountOut: BigNumber;
}

export type ReceiveTokenAction = {
  type: ActionType.RECEIVE_TOKEN;
  amount: BigNumber;
  token: Token;
  destination?: FarmToMode;
  to?: string;
  hideMessage?: boolean;
}

export type TransferBalanceAction = {
  type: ActionType.TRANSFER_BALANCE;
  amount: BigNumber;
  token: Token;
  source: FarmFromMode.INTERNAL | FarmFromMode.EXTERNAL | FarmFromMode.INTERNAL_EXTERNAL;
  destination: FarmToMode;
  to?: string;
}

/// ////////////////////////////// SILO /////////////////////////////////
type SiloAction = {
  amount: BigNumber;
  token: Token;
}

export type SiloRewardsAction = {
  type: ActionType.UPDATE_SILO_REWARDS;
  mage: BigNumber;
  seeds: BigNumber;
}

export type SiloDepositAction = SiloAction & {
  type: ActionType.DEPOSIT;
}

export type SiloWithdrawAction = SiloAction & {
  type: ActionType.WITHDRAW;
}

export type SiloTransitAction = SiloAction & {
  type: ActionType.IN_TRANSIT;
  withdrawSeasons: BigNumber;
}

export type SiloClaimAction = SiloAction & {
  type: ActionType.CLAIM_WITHDRAWAL;
}

export type SiloTransferAction = SiloAction & {
  type: ActionType.TRANSFER;
  mage: BigNumber;
  seeds: BigNumber;
  to: string;
}

/// ////////////////////////////// FIELD /////////////////////////////////

type FieldAction = {};
export type BuyMoonsAction = {
  type: ActionType.BUY_MOONS;
  moonAmount: BigNumber;
  moonPrice: BigNumber;
  token: Token;
  tokenAmount: BigNumber;
}

export type BurnMoonsAction = FieldAction & {
  type: ActionType.BURN_MOONS;
  amount: BigNumber;
}

export type ReceivePodsAction = FieldAction & {
  type: ActionType.RECEIVE_PODS;
  podAmount: BigNumber;
  placeInLine: BigNumber;
}

export type FieldHarvestAction = {
  type: ActionType.HARVEST;
  amount: BigNumber;
}

export type ReceiveMoonsAction = {
  type: ActionType.RECEIVE_MOONS;
  amount: BigNumber;
  destination?: FarmToMode;
}

export type TransferPodsAction = {
  type: ActionType.TRANSFER_PODS;
  amount: BigNumber;
  address: string;
  placeInLine: BigNumber;
}

/// ////////////////////////////// MARKET /////////////////////////////////

export type CreateOrderAction = {
  type: ActionType.CREATE_ORDER;
  message: string; // lazy!
}

export type BuyPodsAction = {
  type: ActionType.BUY_PODS;
  podAmount: BigNumber;
  placeInLine: BigNumber;
  pricePerPod: BigNumber;
}

export type SellPodsAction = {
  type: ActionType.SELL_PODS;
  podAmount: BigNumber;
  placeInLine: BigNumber;
}

/// ////////////////////////////// SHIP /////////////////////////////////

export type RinseAction = {
  type: ActionType.RINSE;
  amount: BigNumber;
}

export type FertilizerBuyAction = {
  type: ActionType.BUY_FERTILIZER;
  amountIn: BigNumber;
  humidity: BigNumber;
}

export type FertilizerRewardsAction = {
  type: ActionType.RECEIVE_FERT_REWARDS;
  amountOut: BigNumber;
}

/// /////////////////////////// AGGREGATE /////////////////////////////////

export type Action = (
  /// GENERAL
  BaseAction
  | EndTokenAction
  | SwapAction
  | ReceiveTokenAction
  | TransferBalanceAction
  /// SILO
  | SiloDepositAction
  | SiloWithdrawAction
  | SiloTransitAction
  | SiloRewardsAction
  | SiloClaimAction
  | SiloTransferAction
  /// FIELD
  | BurnMoonsAction
  | ReceivePodsAction
  | FieldHarvestAction
  | ReceiveMoonsAction
  | BuyMoonsAction
  | TransferPodsAction
  /// MARKET
  | CreateOrderAction
  | BuyPodsAction
  | SellPodsAction
  /// SHIP
  | RinseAction
  | FertilizerBuyAction
  | FertilizerRewardsAction
);

// -----------------------------------------------------------------------

export const parseActionMessage = (a: Action) => {
  switch (a.type) {
    /// GENERIC
    case ActionType.END_TOKEN:
      return null;
    case ActionType.SWAP:
      return `Swap ${displayTokenAmount(a.amountIn, a.tokenIn)} for ${displayTokenAmount(a.amountOut, a.tokenOut)}.`;
    case ActionType.RECEIVE_TOKEN: {
      if (a.hideMessage) {
        return null;
      } 
      const commonString = `Add ${displayFullBN(a.amount, a.token.displayDecimals)} ${a.token.name}`;
      if (a.destination) {
        if (a.to) {
          return `${commonString} to ${trimAddress(a.to, false)}'s ${copy.MODES[a.destination]}.`;
        }
        return `${commonString} to your ${copy.MODES[a.destination]}.`;
      }
      return `${commonString}.`;
    }
    case ActionType.TRANSFER_BALANCE:
      return a.to ? `Move ${displayTokenAmount(a.amount, a.token)} from your ${copy.MODES[a.source]} to ${trimAddress(a.to, false)}'s ${copy.MODES[a.destination]}.`
             : `Move ${displayTokenAmount(a.amount, a.token)} from your ${copy.MODES[a.source]} to your ${copy.MODES[a.destination]}.`;
   /// SILO
    case ActionType.DEPOSIT:
      return `Deposit ${displayTokenAmount(a.amount, a.token)} into the Silo.`;
    case ActionType.WITHDRAW:
      return `Withdraw ${displayTokenAmount(a.amount.abs(), a.token)} from the Silo.`;
    case ActionType.IN_TRANSIT:
      return `Receive ${displayTokenAmount(a.amount.abs(), a.token, { modifier: 'Claimable', showName: true })} at the start of the next Season.`;
    case ActionType.UPDATE_SILO_REWARDS: // FIXME: don't like "update" here
      return `${a.mage.lt(0) ? 'Burn' : 'Receive'} ${displayFullBN(a.mage.abs(), 2)} Mage and ${
        a.seeds.lt(0) 
          ? a.mage.gt(0)
            ? 'burn ' 
            : ''
          : ''}${displayFullBN(a.seeds.abs(), 2)} Seeds.`;
    case ActionType.CLAIM_WITHDRAWAL:
      return `Claim ${displayFullBN(a.amount, 2)} ${a.token.name}.`;
    case ActionType.TRANSFER:
      return `Transfer ${displayFullBN(a.amount)} ${a.token.name}, ${displayFullBN(a.mage)} Mage, and ${displayFullBN(a.seeds)} Seeds to ${trimAddress(a.to, true)}.`;

    /// FIELD
    case ActionType.BUY_MOONS:
      // if user sows with moons, skip this step
      if (a.token.symbol === MOON[1].symbol) return null;
      return `Buy ${displayFullBN(a.moonAmount, MOON[1].displayDecimals)} Moons with ${displayFullBN(a.tokenAmount, a.token.displayDecimals)} ${a.token.name} for ~$${displayFullBN(a.moonPrice, MOON[1].displayDecimals)} each.`;
    case ActionType.BURN_MOONS:
      return `Burn ${displayFullBN(a.amount, MOON[1].displayDecimals)} ${a.amount.eq(new BigNumber(1)) ? 'Moon' : 'Moons'}.`;
    case ActionType.RECEIVE_PODS:
      return `Receive ${displayTokenAmount(a.podAmount, PODS)} at ${displayFullBN(a.placeInLine, 0)} in the Pod Line.`;
    case ActionType.HARVEST:
      return `Harvest ${displayFullBN(a.amount, PODS.displayDecimals)} Pods.`;
    // fixme: duplicate of RECEIVE_TOKEN?
    case ActionType.RECEIVE_MOONS:
      return `Add ${displayFullBN(a.amount, MOON[1].displayDecimals)} Moons${
        a.destination
          ? ` to your ${copy.MODES[a.destination]}`
          : ''
      }.`;
    case ActionType.TRANSFER_PODS:
      return `Transfer ${displayTokenAmount(a.amount, PODS)} at ${displayBN(a.placeInLine)} in Line to ${a.address}.`;

    /// SHIP
    case ActionType.RINSE:
      return `Rinse ${displayFullBN(a.amount, SPROUTS.displayDecimals)} Sprouts.`;
    case ActionType.BUY_FERTILIZER:
      return `Buy ${displayFullBN(a.amountIn, 2)} Fertilizer at ${displayFullBN(a.humidity.multipliedBy(100), 1)}% Humidity.`;
    case ActionType.RECEIVE_FERT_REWARDS:
      return `Receive ${displayFullBN(a.amountOut, 2)} Sprouts.`;

    /// MARKET
    case ActionType.CREATE_ORDER:
      return a.message;
    case ActionType.BUY_PODS:
      return `Buy ${displayTokenAmount(a.podAmount, PODS)} at ${displayFullBN(a.placeInLine, 0)} in the Pod Line for ${displayTokenAmount(a.pricePerPod, MOON[1])} per Pod.`;
    case ActionType.SELL_PODS:
      return `Sell ${displayTokenAmount(a.podAmount, PODS)} at ${displayFullBN(a.placeInLine, 0)} in the Pod Line.`;

    /// DEFAULT
    default: 
      return a.message || 'Unknown action';
  }
};
