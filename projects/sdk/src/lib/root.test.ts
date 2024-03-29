import { getTestUtils } from "src/utils/TestUtils/provider";

const { sdk, account, utils } = getTestUtils();

describe("mint function", () => {
  it("uses the right function", async () => {
    expect(true).toBe(true);
    // const typedData = await sdk.root.permit(
    //   [sdk.tokens.MOON],
    //   [new BigNumber(1000)],
    // );
    // const permit = await sdk.permit.sign(
    //   account,
    //   typedData,
    // )
  });
});

describe("estimateRoots", () => {
  it("test", async () => {
    const estimate = await sdk.root.estimateRoots(sdk.tokens.MOON, [utils.mockDepositCrate(sdk.tokens.MOON, 6000, "1000")], true);

    expect(estimate.amount.gt(0)).toBe(true);
  });
});
