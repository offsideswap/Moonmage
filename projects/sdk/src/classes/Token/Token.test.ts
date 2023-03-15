import { MoonmageSDK } from "src/lib/MoonmageSDK";
import { setupConnection } from "src/utils/TestUtils";

let sdk: MoonmageSDK;

beforeAll(async () => {
  const { signer, account: _account } = await setupConnection();
  sdk = new MoonmageSDK({
    signer: signer
  });
});

describe("Moon", () => {
  it("has correct mage", () => {
    const mage = sdk.tokens.MOON.getMage(sdk.tokens.MOON.amount(10));
    expect(mage.decimals).toBe(sdk.tokens.MAGE.decimals);
    expect(mage.toHuman()).toBe("10");
  });
  it("has correct seeds", () => {
    const seeds = sdk.tokens.MOON.getSeeds(sdk.tokens.MOON.amount(10));
    expect(seeds.decimals).toBe(sdk.tokens.SEEDS.decimals);
    expect(seeds.toHuman()).toBe("20");
  });
});
describe("MoonLP", () => {
  it("has correct mage", () => {
    const mage = sdk.tokens.MOON_CRV3_LP.getMage(sdk.tokens.MOON.amount(10));
    expect(mage.decimals).toBe(sdk.tokens.MAGE.decimals);
    expect(mage.toHuman()).toBe("10");
  });
  it("has correct seeds", () => {
    const seeds = sdk.tokens.MOON_CRV3_LP.getSeeds(sdk.tokens.MOON.amount(10));
    expect(seeds.decimals).toBe(sdk.tokens.SEEDS.decimals);
    expect(seeds.toHuman()).toBe("40");
  });
});
