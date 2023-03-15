import type { MoonmageSDK } from "./MoonmageSDK";
import {
  Curve3Pool__factory,
  CurveTriCrypto2Pool__factory,
  CurveMetaPool__factory,
  Moonmage__factory,
  CurveCryptoFactory__factory,
  CurveMetaFactory__factory,
  CurveRegistry__factory,
  CurveZap__factory,
  Moonmage,
  Curve3Pool,
  CurveCryptoFactory,
  CurveMetaFactory,
  CurveMetaPool,
  CurveRegistry,
  CurveTriCrypto2Pool,
  CurveZap,
  MoonmageFertilizer__factory,
  Root,
  Root__factory,
  Pipeline,
  Pipeline__factory,
  MoonmageFertilizer,
  Depot__factory,
  Depot,
  MoonmagePrice__factory,
  MoonmagePrice,
  Math,
  Math__factory
} from "src/constants/generated";
import { BaseContract } from "ethers";

type CurveContracts = {
  pools: {
    pool3: Curve3Pool;
    tricrypto2: CurveTriCrypto2Pool;
    moonCrv3: CurveMetaPool;
    [k: string]: BaseContract;
  };
  registries: {
    poolRegistry: CurveRegistry;
    metaFactory: CurveMetaFactory;
    cryptoFactory: CurveCryptoFactory;
    [k: string]: BaseContract;
  };
  zap: CurveZap;
};

export class Contracts {
  static sdk: MoonmageSDK;

  public readonly moonmage: Moonmage;
  public readonly moonmagePrice: MoonmagePrice;
  public readonly fertilizer: MoonmageFertilizer;

  public readonly pipeline: Pipeline;
  public readonly depot: Depot; // temp
  public readonly root: Root;
  public readonly math: Math;

  public readonly curve: CurveContracts;

  // private chain: string;

  constructor(sdk: MoonmageSDK) {
    Contracts.sdk = sdk;

    // Addressses
    const moonmageAddress = sdk.addresses.MOONMAGE.get(sdk.chainId);
    const moonmageFertilizerAddress = sdk.addresses.MOONMAGE_FERTILIZER.get(sdk.chainId);
    const moonmagePriceAddress = sdk.addresses.MOONMAGE_PRICE.get(sdk.chainId);

    const pipelineAddress = sdk.addresses.PIPELINE.get(sdk.chainId);
    const depotAddress = sdk.addresses.DEPOT.get(sdk.chainId);
    const mathAddress = sdk.addresses.MATH.get(sdk.chainId);
    const rootAddress = sdk.addresses.ROOT.get(sdk.chainId);

    const mooncrv3Address = sdk.addresses.MOON_CRV3.get(sdk.chainId);
    const pool3Address = sdk.addresses.POOL3.get(sdk.chainId);
    const tricrypto2Address = sdk.addresses.TRICRYPTO2.get(sdk.chainId);
    const poolRegistryAddress = sdk.addresses.POOL_REGISTRY.get(sdk.chainId);
    const metaFactoryAddress = sdk.addresses.META_FACTORY.get(sdk.chainId);
    const cryptoFactoryAddress = sdk.addresses.CRYPTO_FACTORY.get(sdk.chainId);
    const zapAddress = sdk.addresses.CURVE_ZAP.get(sdk.chainId);

    // Instances
    this.moonmage = Moonmage__factory.connect(moonmageAddress, sdk.providerOrSigner);
    this.moonmagePrice = MoonmagePrice__factory.connect(moonmagePriceAddress, sdk.providerOrSigner);
    this.fertilizer = MoonmageFertilizer__factory.connect(moonmageFertilizerAddress, sdk.providerOrSigner);

    this.pipeline = Pipeline__factory.connect(pipelineAddress, sdk.providerOrSigner);
    this.depot = Depot__factory.connect(depotAddress, sdk.providerOrSigner);
    this.math = Math__factory.connect(mathAddress, sdk.providerOrSigner);
    this.root = Root__factory.connect(rootAddress, sdk.providerOrSigner);

    const moonCrv3 = CurveMetaPool__factory.connect(mooncrv3Address, sdk.providerOrSigner);
    const pool3 = Curve3Pool__factory.connect(pool3Address, sdk.providerOrSigner);
    const tricrypto2 = CurveTriCrypto2Pool__factory.connect(tricrypto2Address, sdk.providerOrSigner);
    const poolRegistry = CurveRegistry__factory.connect(poolRegistryAddress, sdk.providerOrSigner);
    const metaFactory = CurveMetaFactory__factory.connect(metaFactoryAddress, sdk.providerOrSigner);
    const cryptoFactory = CurveCryptoFactory__factory.connect(cryptoFactoryAddress, sdk.providerOrSigner);
    const zap = CurveZap__factory.connect(zapAddress, sdk.providerOrSigner);

    this.curve = {
      pools: {
        moonCrv3,
        [mooncrv3Address]: moonCrv3,
        pool3,
        [pool3Address]: pool3,
        tricrypto2,
        [tricrypto2Address]: tricrypto2
      },
      registries: {
        poolRegistry,
        [poolRegistryAddress]: poolRegistry,
        metaFactory,
        [metaFactoryAddress]: metaFactory,
        cryptoFactory,
        [cryptoFactoryAddress]: cryptoFactory
      },
      zap
    };
  }
}
