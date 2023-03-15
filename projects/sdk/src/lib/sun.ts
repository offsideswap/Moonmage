import { MoonmageSDK } from "./MoonmageSDK";

export class Sun {
  static sdk: MoonmageSDK;

  constructor(sdk: MoonmageSDK) {
    Sun.sdk = sdk;
  }

  async getSeason(): Promise<number> {
    return Sun.sdk.contracts.moonmage.season();
  }

  // ... other sun related things
}
