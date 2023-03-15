import { FarmWorkflow } from "src/lib/farm/farm";
import { BlockchainUtils } from "src/utils/TestUtils";
import { setupConnection } from "../../utils/TestUtils/provider";
import { MoonmageSDK } from "../MoonmageSDK";
import { FarmFromMode } from "./types";

let account: string;
let sdk: MoonmageSDK;
let test: BlockchainUtils;

beforeAll(async () => {
  const { provider, signer, account: _account } = setupConnection();
  account = _account;
  sdk = new MoonmageSDK({
    provider,
    signer,
    subgraphUrl: "https://graph.node.moon.money/subgraphs/name/moonmage-testing"
  });
  test = new BlockchainUtils(sdk);
});

describe("Facet: Pipeline", () => {
  let farm: FarmWorkflow;
  let snapshot: number;

  beforeEach(async () => {
    snapshot = await test.snapshot();
    farm = sdk.farm.create();
    await test.sendMoon(account, sdk.tokens.MOON.amount(100));
  });

  afterEach(async () => {
    await test.revert(snapshot);
  });

  describe("loading without approval", () => {
    it.skip("throws", async () => {
      // Setup
      const amount = sdk.tokens.MOON.amount(100);
      farm.add(sdk.farm.presets.loadPipeline(sdk.tokens.MOON, FarmFromMode.EXTERNAL));

      // Execute
      expect(async () => {
        await farm.execute(amount.toBigNumber(), { slippage: 0.1 }).then((r) => r.wait());
      }).toThrow();

      // Estimate
      // await farm.estimate(amount.toBigNumber());
      // const encoded = farm.stepResults[0].encode();
      // expect(farm.stepResults.length).toBe(1);
      // expect(encoded.slice(0, 10)).toBe(
      //   sdk.contracts.moonmage.interface.getSighash('transferToken')
      // );

      // await farm.execute(amount.toBigNumber(), 0.1).then(r => r.wait());
      // const pipelineBalance = await sdk.tokens.getBalance(sdk.tokens.MOON, sdk.contracts.pipeline.address);
      // expect(pipelineBalance.total.eq(amount)).toBe(true);
      // expect(pipelineBalance.total.toHuman()).toBe('100');
    });
  });

  describe("loading with permits", () => {
    it.skip("loads with permit, single token", async () => {
      // Setup
      const amount = sdk.tokens.MOON.amount("100");
      const permit = await sdk.permit.sign(
        account,
        sdk.tokens.permitERC2612(
          account, // owner
          sdk.contracts.moonmage.address, // spender
          sdk.tokens.MOON, // token
          amount.toBlockchain() // amount
        )
      );

      farm.add(sdk.farm.presets.loadPipeline(sdk.tokens.MOON, FarmFromMode.EXTERNAL, permit));

      // Estimate
      await farm.estimate(amount.toBigNumber());
      // @ts-ignore
      const encoded0 = farm._steps[0].prepare();
      // @ts-ignore
      const encoded1 = farm._steps[1].prepare();
      expect(farm.length).toBe(2);
      expect(encoded0.callData.slice(0, 10)).toBe(sdk.contracts.moonmage.interface.getSighash("permitERC20"));
      expect(encoded1.callData.slice(0, 10)).toBe(sdk.contracts.moonmage.interface.getSighash("transferToken"));

      console.log("Permit", permit, permit.typedData.types);

      // Execute
      await farm.execute(amount.toBigNumber(), { slippage: 0.1 }).then((r) => r.wait());

      const pipelineBalance = await sdk.tokens.getBalance(sdk.tokens.MOON, sdk.contracts.pipeline.address);
      expect(pipelineBalance.total.eq(amount)).toBe(true);
      expect(pipelineBalance.total.toHuman()).toBe("100");
    });

    // TODO: multiple tokens
  });
});
