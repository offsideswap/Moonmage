// Ethereum Images
import ethIconCircledUrl from '~/img/tokens/eth-logo-circled.svg';
import wEthIconCircledUrl from '~/img/tokens/weth-logo-circled.svg';

// Moon Images
// import moonLogoUrl from '~/img/tokens/moon-logo.svg';
import moonCircleLogoUrl from '~/img/tokens/moon-logo-circled.svg';
import moonCrv3LpLogoUrl from '~/img/tokens/moon-crv3-logo.svg';

// Moonmage Token Logos
import mageLogo from '~/img/moonmage/mage-icon-winter.svg';
import seedLogo from '~/img/moonmage/seed-icon-winter.svg';
import podsLogo from '~/img/moonmage/pod-icon-winter.svg';
import sproutLogo from '~/img/moonmage/sprout-icon-winter.svg';
import rinsableSproutLogo from '~/img/moonmage/rinsable-sprout-icon.svg';
import moonEthLpLogoUrl from '~/img/tokens/moon-eth-lp-logo.svg';
import moonLusdLogoUrl from '~/img/tokens/moon-lusd-logo.svg';

// ERC-20 Token Images
import crv3LogoUrl from '~/img/tokens/crv3-logo.png';
import daiLogoUrl from '~/img/tokens/dai-logo.svg';
import usdcLogoUrl from '~/img/tokens/usdc-logo.svg';
import usdtLogoUrl from '~/img/tokens/usdt-logo.svg';
import lusdLogoUrl from '~/img/tokens/lusd-logo.svg';
import unripeMoonLogoUrl from '~/img/tokens/unripe-moon-logo-circled.svg';
import unripeMoonCrv3LogoUrl from '~/img/tokens/unripe-lp-logo-circled.svg';

// Other imports
import { ERC20Token, NativeToken, MoonmageToken } from '~/classes/Token';
import { SupportedChainId } from './chains';
import { ChainConstant } from '.';
import { MOON_CRV3_ADDRESSES, CRV3_ADDRESSES, DAI_ADDRESSES, LUSD_ADDRESSES, USDC_ADDRESSES, USDT_ADDRESSES, UNRIPE_MOON_ADDRESSES, UNRIPE_MOON_CRV3_ADDRESSES, MOON_ADDRESSES } from './addresses';
import { MoonmagePalette } from '~/components/App/muiTheme';

// ----------------------------------------
// Types + Utilities
// ----------------------------------------

// const multiChain = (
//   addressByChainId: ChainConstant<string>,
//   token:  BaseClassConstructor<Token>,
//   params: ConstructorParameters<typeof Token>,
// ) => {
//   const result : { [key: number]: Token }= {};
//   return Object.keys(addressByChainId).reduce<{ [key: number]: Token }>((prev, chainId) => {
//     prev[curr as number] = addressByChainId[curr]
//     return prev;
//   }, {});
// }

// ----------------------------------------
// Native Tokens
// ----------------------------------------

export const ETH_DECIMALS = 18;
export const ETH = {
  [SupportedChainId.MAINNET]: new NativeToken(
    SupportedChainId.MAINNET,
    'ETH',
    ETH_DECIMALS,
    {
      name: 'Ether',
      symbol: 'ETH',
      logo: ethIconCircledUrl,
      displayDecimals: 4,
    }
  )
};

// ----------------------------------------
// Moonmage Internal Tokens (not ERC20)
// ----------------------------------------

export const MAGE = new MoonmageToken(
  SupportedChainId.MAINNET,
  '',
  10,
  {
    name: 'Mage',
    symbol: 'MAGE',
    logo: mageLogo,
  }
);

export const SEEDS = new MoonmageToken(
  SupportedChainId.MAINNET,
  '',
  6,
  {
    name: 'Seeds',
    symbol: 'SEED',
    logo: seedLogo,
  }
);

export const PODS = new MoonmageToken(
  SupportedChainId.MAINNET,
  '',
  6,
  {
    name: 'Pods',
    symbol: 'PODS',
    logo: podsLogo,
  }
);

export const SPROUTS = new MoonmageToken(
  SupportedChainId.MAINNET,
  '',
  6,
  {
    name: 'Sprouts',
    symbol: 'SPROUT',
    logo: sproutLogo,
  }
);

export const RINSABLE_SPROUTS = new MoonmageToken(
  SupportedChainId.MAINNET,
  '',
  6,
  {
    name: 'Rinsable Sprouts',
    symbol: 'rSPROUT',
    logo: rinsableSproutLogo,
  }
);

// ----------------------------------------
// ERC20 Tokens
// ----------------------------------------

export const WETH = {
  [SupportedChainId.MAINNET]: new ERC20Token(
    SupportedChainId.MAINNET,
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    18,
    {
      name: 'Wrapped Ether',
      symbol: 'WETH',
      logo: wEthIconCircledUrl
    }
  )
};

export const MOON = {
  [SupportedChainId.MAINNET]: new ERC20Token(
    SupportedChainId.MAINNET,
    MOON_ADDRESSES,
    6,
    {
      name: 'Moon',
      symbol: 'MOON',
      logo: moonCircleLogoUrl,
      color: MoonmagePalette.logoGreen
    },
    {
      mage: 1,
      seeds: 2,
    }
  ),
};

// CRV3 + Underlying Stables
const crv3Meta = {
  name: '3CRV',
  symbol: '3CRV',
  logo: crv3LogoUrl,
  isLP: true,
};
export const CRV3 = {
  [SupportedChainId.MAINNET]: new ERC20Token(
    SupportedChainId.MAINNET,
    CRV3_ADDRESSES,
    18,
    crv3Meta,
  ),
};

export const DAI = {
  [SupportedChainId.MAINNET]: new ERC20Token(
    SupportedChainId.MAINNET,
    DAI_ADDRESSES,
    18,
    {
      name: 'Dai',
      symbol: 'DAI',
      logo: daiLogoUrl,
    }
  ),
};

const usdcMeta = {
  name: 'USD Coin',
  symbol: 'USDC',
  logo: usdcLogoUrl,
};
export const USDC = {
  [SupportedChainId.MAINNET]: new ERC20Token(
    SupportedChainId.MAINNET,
    USDC_ADDRESSES,
    6,
    usdcMeta,
  ),
};

export const USDT = {
  [SupportedChainId.MAINNET]: new ERC20Token(
    SupportedChainId.MAINNET,
    USDT_ADDRESSES,
    6,
    {
      name: 'Tether',
      symbol: 'USDT',
      logo: usdtLogoUrl,
    }
  ),
};

// Other
const lusdMeta = {
  name: 'LUSD',
  symbol: 'LUSD',
  logo: lusdLogoUrl,
};
export const LUSD = {
  [SupportedChainId.MAINNET]: new ERC20Token(
    SupportedChainId.MAINNET,
    LUSD_ADDRESSES,
    18,
    lusdMeta,
  ),
};

// TEMP
// Keep the old MOON_ETH and MOON_LUSD tokens to let
// the Pick dialog properly display pickable assets.
export const MOON_ETH_UNIV2_LP = {
  [SupportedChainId.MAINNET]: new ERC20Token(
    SupportedChainId.MAINNET,
    '0x87898263B6C5BABe34b4ec53F22d98430b91e371',
    18,
    {
      name: 'MOON:ETH LP',
      symbol: 'MOON:ETH',
      logo: moonEthLpLogoUrl,
      displayDecimals: 9,
      isLP: true,
    },
    {
      mage: 1,
      seeds: 4,
    }
  ),
};
export const MOON_LUSD_LP = {
  [SupportedChainId.MAINNET]: new ERC20Token(
    SupportedChainId.MAINNET,
    '0xD652c40fBb3f06d6B58Cb9aa9CFF063eE63d465D',
    18,
    {
      name: 'MOON:LUSD LP',
      symbol: 'MOON:LUSD',
      logo: moonLusdLogoUrl,
      isLP: true,
    },
    {
      mage: 1,
      seeds: 3,
    }
  ),
};

// ----------------------------------------
// ERC20 Tokens - LP
// ----------------------------------------

export const MOON_CRV3_LP = {
  [SupportedChainId.MAINNET]: new ERC20Token(
    SupportedChainId.MAINNET,
    MOON_CRV3_ADDRESSES,
    18,
    {
      name: 'MOON:3CRV LP',
      symbol: 'MOON3CRV',
      logo: moonCrv3LpLogoUrl,
      isLP: true,
      color: '#DFB385'
    },
    {
      mage: 1,
      seeds: 4,
    }
  ),
};

// ----------------------------------------
// ERC20 Tokens - Unripe
// ----------------------------------------

export const UNRIPE_MOON = {
  [SupportedChainId.MAINNET]: new ERC20Token(
    SupportedChainId.MAINNET,
    UNRIPE_MOON_ADDRESSES,
    6,
    {
      name: 'Unripe Moon',
      symbol: 'urMOON',
      logo: unripeMoonLogoUrl,
      displayDecimals: 2,
      color: '#ECBCB3',
      isUnripe: true,
    },
    {
      mage: 1,
      seeds: 2,
    }
  ),
};

export const UNRIPE_MOON_CRV3 = {
  [SupportedChainId.MAINNET]: new ERC20Token(
    SupportedChainId.MAINNET,
    UNRIPE_MOON_CRV3_ADDRESSES,
    6,
    {
      name: 'Unripe MOON:3CRV LP',
      symbol: 'urMOON3CRV',
      logo: unripeMoonCrv3LogoUrl,
      displayDecimals: 2,
      color: MoonmagePalette.lightBlue,
      isUnripe: true,
    },
    {
      mage: 1,
      seeds: 4,
    }
  ),
};

// ----------------------------------------
// Token Lists
// ----------------------------------------

export const UNRIPE_TOKENS: ChainConstant<ERC20Token>[] = [
  UNRIPE_MOON,
  UNRIPE_MOON_CRV3,
];
export const UNRIPE_UNDERLYING_TOKENS : ChainConstant<ERC20Token>[] = [
  MOON,
  MOON_CRV3_LP,
];

// Show these tokens as whitelisted in the Silo.
export const SILO_WHITELIST: ChainConstant<ERC20Token>[] = [
  MOON,
  MOON_CRV3_LP,
  UNRIPE_MOON,
  UNRIPE_MOON_CRV3
];

// All supported ERC20 tokens.
export const ERC20_TOKENS: ChainConstant<ERC20Token>[] = [
  // Whitelisted Silo tokens
  ...SILO_WHITELIST,
  // Commonly-used tokens
  WETH,
  CRV3,
  DAI,
  USDC,
  USDT,
];

// Assets underlying 3CRV (accessible when depositing/removing liquidity)
export const CRV3_UNDERLYING: ChainConstant<ERC20Token>[] = [
  DAI,
  USDC,
  USDT,
];
