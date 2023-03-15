import { MoonmageSDK, DataSource, TestUtils } from "@moonmage/sdk";
import { Provider } from "@moonmage/sdk/dist/types/lib/MoonmageSDK";
import { ethers } from "ethers";

export const provider = new ethers.providers.StaticJsonRpcProvider("http://127.0.0.1:8545");
export const { signer, account } = TestUtils.setupConnection(provider);

export const sdk = new MoonmageSDK({
  provider,
  source: DataSource.LEDGER,
  DEBUG: true
});

export const impersonate = async (account) => {
  const stop = await chain.impersonate(account);

  const provider = ethers.getDefaultProvider("http://127.0.0.1:8545") as Provider;
  const signer = await provider.getSigner(account);
  const sdk = new MoonmageSDK({
    signer,
    source: DataSource.LEDGER,
    DEBUG: true
  });

  return { sdk, stop };
};

export const chain = new TestUtils.BlockchainUtils(sdk);
