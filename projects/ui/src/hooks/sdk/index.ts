import { useContext, useMemo } from 'react';
import { MoonmageSDKContext } from '~/components/App/SdkProvider';

export default function useSdk() {
  const sdk = useContext(MoonmageSDKContext);
  if (!sdk) {
    throw new Error('Expected sdk to be used within MoonmageSDK context');
  }
  return useMemo(() => sdk, [sdk]);
}
