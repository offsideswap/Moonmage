import React, { createContext, useMemo } from 'react';
import { MoonmageSDK } from '@moonmage/sdk';
import { useSigner } from '~/hooks/ledger/useSigner';

// Ethereum Images
import ethIconCircled from '~/img/tokens/eth-logo-circled.svg';
import wEthIconCircled from '~/img/tokens/weth-logo-circled.svg';

// Moon Images
// import moonLogoUrl from '~/img/tokens/moon-logo.svg';
import moonCircleLogo from '~/img/tokens/moon-logo-circled.svg';
import moonCrv3LpLogo from '~/img/tokens/moon-crv3-logo.svg';

// Moonmage Token Logos
import mageLogo from '~/img/moonmage/mage-icon-winter.svg';
import seedLogo from '~/img/moonmage/seed-icon-winter.svg';
import podsLogo from '~/img/moonmage/pod-icon-winter.svg';
import sproutLogo from '~/img/moonmage/sprout-icon-winter.svg';
import rinsableSproutLogo from '~/img/moonmage/rinsable-sprout-icon.svg';
import moonEthLpLogo from '~/img/tokens/moon-eth-lp-logo.svg';

// ERC-20 Token Images
import crv3Logo from '~/img/tokens/crv3-logo.png';
import daiLogo from '~/img/tokens/dai-logo.svg';
import usdcLogo from '~/img/tokens/usdc-logo.svg';
import usdtLogo from '~/img/tokens/usdt-logo.svg';
import lusdLogo from '~/img/tokens/lusd-logo.svg';
import unripeMoonLogo from '~/img/tokens/unripe-moon-logo-circled.svg';
import unripeMoonCrv3Logo from '~/img/tokens/unripe-lp-logo-circled.svg';

const IS_DEVELOPMENT_ENV = process.env.NODE_ENV !== 'production';

const useMoonmageSdkContext = () => {
  const { data: signer } = useSigner();

  const sdk = useMemo(() => {
    const _sdk = new MoonmageSDK({
      signer: signer ?? undefined,
      DEBUG: IS_DEVELOPMENT_ENV,
    });

    _sdk.tokens.ETH.setMetadata({ logo: ethIconCircled });
    _sdk.tokens.WETH.setMetadata({ logo: wEthIconCircled });

    _sdk.tokens.MOON.setMetadata({ logo: moonCircleLogo });
    _sdk.tokens.MOON_CRV3_LP.setMetadata({ logo: moonCrv3LpLogo });
    _sdk.tokens.UNRIPE_MOON.setMetadata({ logo: unripeMoonLogo });
    _sdk.tokens.UNRIPE_MOON_CRV3.setMetadata({ logo: unripeMoonCrv3Logo });

    _sdk.tokens.MAGE.setMetadata({ logo: mageLogo });
    _sdk.tokens.SEEDS.setMetadata({ logo: seedLogo });
    _sdk.tokens.PODS.setMetadata({ logo: podsLogo });
    _sdk.tokens.SPROUTS.setMetadata({ logo: sproutLogo });
    _sdk.tokens.RINSABLE_SPROUTS.setMetadata({ logo: rinsableSproutLogo });

    _sdk.tokens.MOON_ETH_UNIV2_LP.setMetadata({ logo: moonEthLpLogo });

    _sdk.tokens.CRV3.setMetadata({ logo: crv3Logo });
    _sdk.tokens.DAI.setMetadata({ logo: daiLogo });
    _sdk.tokens.USDC.setMetadata({ logo: usdcLogo });
    _sdk.tokens.USDT.setMetadata({ logo: usdtLogo });
    _sdk.tokens.LUSD.setMetadata({ logo: lusdLogo });

    return _sdk;
  }, [signer]);

  return sdk;
};

export const MoonmageSDKContext = createContext<
  ReturnType<typeof useMoonmageSdkContext> | undefined
>(undefined);

function MoonmageSDKProvider({ children }: { children: React.ReactNode }) {
  // use the same instance of the sdk across the app
  const sdk = useMoonmageSdkContext();

  return (
    <MoonmageSDKContext.Provider value={sdk}>
      {children}
    </MoonmageSDKContext.Provider>
  );
}

export default React.memo(MoonmageSDKProvider);
