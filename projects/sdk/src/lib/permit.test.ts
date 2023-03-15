import { MoonmageSDK } from "./MoonmageSDK";
import { setupConnection } from "../utils/TestUtils/provider";

let sdk: MoonmageSDK;
let account: string;

beforeAll(async () => {
  const { provider, signer, account: _account } = await setupConnection();
  account = _account;
  sdk = new MoonmageSDK({
    provider,
    signer,
    subgraphUrl: "https://graph.node.moon.money/subgraphs/name/moonmage-testing"
  });
});

// describe('ETH permit', () => {
// it('can call permit on an ERC2612', async () => {
//   const sender = await sdk.getAccount();  // 0xf39...
//   const value = (1000*1E6).toString();    // 1000 MOON

//   const result = await sdk.permit.signERC2612(
//     sdk.tokens.MOON.address,
//     sender,
//     spender,
//     value
//   );

//   const contract = ERC20Permit__factory.connect(sdk.tokens.MOON.address, sdk.signer || sdk.provider);

//   await contract.permit(sender, spender, value, result.deadline, result.split.v, result.split.r, result.split.s);
//   const allowance = await contract.allowance(sender, spender)

//   expect(allowance.toString()).to.equal(value);
// });
// });

describe("sign", () => {
  it("signs", async () => {
    // const signedPermit = await sdk.permit.sign(
    //   account,
    //   sdk.tokens.
    // )
  });
});
