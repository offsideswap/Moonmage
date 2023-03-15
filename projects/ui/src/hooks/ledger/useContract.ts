import { Contract, ContractInterface, ethers } from 'ethers';
import { useCallback, useMemo } from 'react';
import { useProvider, useContract as useWagmiContract } from 'wagmi';

import MOONMAGE_ABI from '@moonmage/protocol/abi/Moonmage.json';
import MOONMAGE_PRICE_ABI from '~/constants/abi/Moonmage/MoonmagePrice.json';
import MOONMAGE_FERTILIZER_ABI from '~/constants/abi/Moonmage/MoonmageFertilizer.json';
import ERC20_ABI from '~/constants/abi/ERC20.json';
import MOONFT_GENESIS_ABI from '~/constants/abi/BeaNFT/BeaNFTGenesis.json';
import MOONFT_WINTER_ABI from '~/constants/abi/BeaNFT/BeaNFTWinter.json';
import AGGREGATOR_V3_ABI from '~/constants/abi/Chainlink/AggregatorV3.json';
import useChainConstant from '../chain/useChainConstant';
import { SupportedChainId } from '~/constants/chains';
import {
  MOONFT_GENESIS_ADDRESSES, MOONFT_WINTER_ADDRESSES,
  MOONMAGE_ADDRESSES,
  MOONMAGE_FERTILIZER_ADDRESSES,
  MOONMAGE_PRICE_ADDRESSES,
} from '~/constants/addresses';
import { ChainConstant } from '~/constants';
import { getChainConstant } from '~/util/Chain';
import { useSigner } from '~/hooks/ledger/useSigner';
import {
  BeaNFTGenesis,
  BeaNFTWinter,
  MoonmageFertilizer,
  Moonmage,
  MoonmagePrice,
  ERC20,
  AggregatorV3
} from '~/generated/index';

export type AddressOrAddressMap = string | ChainConstant<string>;
export type AbiOrAbiMap = ContractInterface | ChainConstant<ContractInterface>;

// -------------------------------------------------

export function useContractReadOnly<T extends Contract = Contract>(
  addressOrAddressMap: AddressOrAddressMap,
  abiOrAbiMap: AbiOrAbiMap,
): [T | null, SupportedChainId] {
  const provider  = useProvider();
  const address   = typeof addressOrAddressMap === 'string' ? addressOrAddressMap : getChainConstant(addressOrAddressMap, provider.network.chainId);
  const abi       = Array.isArray(abiOrAbiMap) ? abiOrAbiMap : getChainConstant(abiOrAbiMap as ChainConstant<ContractInterface>, provider.network.chainId);
  return useMemo(
    () => 
      // console.debug(`[useContractReadOnly] creating new instance of ${address}`);
       [
        address
          ? new ethers.Contract(
            address,
            abi,
            provider
          ) as T
          : null,
        provider.network.chainId,
      ],    
    [address, abi, provider]
  );
  // if (!address) throw new Error('Attempted to instantiate contract without address.')
  // if (!abi)     throw new Error('Attempted to instantiate contract without ABI.')
  // console.debug(`[useContractReadOnly] contract = ${address}, chainId = ${provider.network.chainId}`, {
  //   abi,
  //   abiLength: abi.length,
  //   lbn: provider._lastBlockNumber,
  //   chainId: provider.network.chainId,
  // })
  // return useWagmiContract<T>({
  //   addressOrName: address,
  //   contractInterface: abi,
  //   signerOrProvider: provider,
  // });
}

export function useGetContract<T extends Contract = Contract>(
  abiOrAbiMap: AbiOrAbiMap,
  useSignerIfPossible: boolean = true
): (addressOrAddressMap: AddressOrAddressMap) => [T | null, SupportedChainId] {
  const provider         = useProvider();
  const { data: signer } = useSigner();
  const chainId          = provider.network.chainId;
  const abi              = Array.isArray(abiOrAbiMap) ? abiOrAbiMap : getChainConstant(abiOrAbiMap as ChainConstant<ContractInterface>, chainId);
  const signerOrProvider = useSignerIfPossible && signer ? signer : provider;
  // useWhatChanged([abi,signerOrProvider,chainId], 'abi,signerOrProvider,chainId');
  
  // 
  return useCallback(
    (addressOrAddressMap: AddressOrAddressMap) => {
      const address   = typeof addressOrAddressMap === 'string' ? addressOrAddressMap : getChainConstant(addressOrAddressMap, chainId);
      // console.debug(`[useGetContract] creating new instance of ${address}, ${abi.length}, ${signerOrProvider}, ${chainId}`);
      return [
        address 
          ? new ethers.Contract(
            address,
            abi,
            signerOrProvider
          ) as T
          : null,
        chainId,
      ];
    },
    [abi, signerOrProvider, chainId]
  );
}

export function useContract<T extends Contract = Contract>(
  addressOrAddressMap: AddressOrAddressMap,
  abiOrAbiMap: AbiOrAbiMap,
  useSignerIfPossible: boolean = true
): [T | null, SupportedChainId] {
  const getContract = useGetContract(abiOrAbiMap, useSignerIfPossible);
  return getContract(addressOrAddressMap) as [T | null, SupportedChainId]; // FIXME: hard casting
}

// --------------------------------------------------

const MOONMAGE_PRICE_ABIS = {
  [SupportedChainId.MAINNET]: MOONMAGE_PRICE_ABI,
};

export function useMoonmagePriceContract() {
  return useContractReadOnly<MoonmagePrice>(
    MOONMAGE_PRICE_ADDRESSES,
    MOONMAGE_PRICE_ABIS,
  );
}

export function useMoonmageFertilizerContract() {
  return useContract<MoonmageFertilizer>(
    MOONMAGE_FERTILIZER_ADDRESSES,
    MOONMAGE_FERTILIZER_ABI,
    true
  );
}

export function useGetERC20Contract() {
  return useGetContract<ERC20>(
    ERC20_ABI,
    true
  );
}

export function useERC20Contract(addressOrAddressMap: AddressOrAddressMap) {
  const get = useGetERC20Contract();
  return get(addressOrAddressMap);
}

// --------------------------------------------------

export function useFertilizerContract(signer?: ethers.Signer | null) {
  const fertAddress = useChainConstant(MOONMAGE_FERTILIZER_ADDRESSES);
  const provider = useProvider();
  return useWagmiContract({
    address: fertAddress,
    abi: MOONMAGE_FERTILIZER_ABI,
    signerOrProvider: signer || provider,
  }) as MoonmageFertilizer;
}

export function useMoonmageContract(signer?: ethers.Signer | null) {
  const address   = useChainConstant(MOONMAGE_ADDRESSES);
  const provider  = useProvider();
  return useWagmiContract({
    address,
    abi: MOONMAGE_ABI,
    signerOrProvider: signer || provider,
  }) as Moonmage;
}

export function useGenesisNFTContract(signer?: ethers.Signer | null) {
  const address = useChainConstant(MOONFT_GENESIS_ADDRESSES);
  const provider = useProvider();
  return useWagmiContract({
    address,
    abi: MOONFT_GENESIS_ABI,
    signerOrProvider: signer || provider,
  }) as BeaNFTGenesis;
}

export function useWinterNFTContract(signer?: ethers.Signer | null) {
  const address = useChainConstant(MOONFT_WINTER_ADDRESSES);
  const provider = useProvider();
  return useWagmiContract({
    address,
    abi: MOONFT_WINTER_ABI,
    signerOrProvider: signer || provider,
  }) as BeaNFTWinter;
}

/** used to access chainlink price data feeds */
export function useAggregatorV3Contract(chainConstant: ChainConstant<string>, signer?: ethers.Signer | null) {
  const address = useChainConstant(chainConstant);
  const provider = useProvider();
  return useWagmiContract({
    address,
    abi: AGGREGATOR_V3_ABI,
    signerOrProvider: signer || provider
  }) as AggregatorV3;
}
