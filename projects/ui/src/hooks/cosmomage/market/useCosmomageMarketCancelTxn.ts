import { useCallback, useState } from 'react';
import { FarmToMode } from '~/lib/Moonmage/Farm';
import TransactionToast from '~/components/Common/TxnToast';
import { useFetchCosmonautField } from '~/state/cosmomage/field/updater';
import { useMoonmageContract } from '../../ledger/useContract';
import useFormMiddleware from '../../ledger/useFormMiddleware';
import { MOON, PODS } from '~/constants/tokens';
import useChainConstant from '../../chain/useChainConstant';
import { useFetchCosmonautBalances } from '~/state/cosmomage/balances/updater';
import { PodOrder } from '~/state/cosmomage/market';
import { useSigner } from '~/hooks/ledger/useSigner';
import useAccount from '~/hooks/ledger/useAccount';
import { useFetchCosmomageStationItems } from '~/hooks/cosmomage/market/useCosmomageStation2';

export default function useCosmomageStationCancelTxn() {
  /// Helpers
  const Moon = useChainConstant(MOON);

  /// Local state
  const [loading, setLoading] = useState(false);

  /// Ledger
  const account = useAccount();
  const { data: signer } = useSigner();
  const moonmage = useMoonmageContract(signer);

  /// Cosmonaut
  const [refetchCosmonautField] = useFetchCosmonautField();
  const [refetchCosmonautBalances] = useFetchCosmonautBalances();
  // const [refetchCosmomageStation] = useFetchCosmomageStation();
  const { fetch: refetchCosmomageStationItems } = useFetchCosmomageStationItems();

  /// Form
  const middleware = useFormMiddleware();

  const cancelListing = useCallback(
    (listingId: string) => {
      (async () => {
        const txToast = new TransactionToast({
          loading: 'Cancelling Pod Listing...',
          success: 'Cancellation successful.',
        });

        try {
          setLoading(true);
          middleware.before();

          const txn = await moonmage.cancelPodListing(listingId);
          txToast.confirming(txn);

          const receipt = await txn.wait();
          await Promise.all([
            refetchCosmonautField(),
            refetchCosmomageStationItems()
          ]);
          txToast.success(receipt);
        } catch (err) {
          txToast.error(err);
          console.error(err);
        } finally {
          setLoading(false);
        }
      })();
    },
    [moonmage, middleware, refetchCosmonautField, refetchCosmomageStationItems]
  );

  const cancelOrder = useCallback(
    (order: PodOrder, destination: FarmToMode, before?: () => void) => {
      (async () => {
        const txToast = new TransactionToast({
          loading: 'Cancelling Pod Order',
          success: 'Cancellation successful.',
        });
        try {
          if (!account) throw new Error('Connect a wallet first.');

          setLoading(true);
          middleware.before();
          before?.();

          const params = [
            Moon.stringify(order.pricePerPod),
            Moon.stringify(order.maxPlaceInLine),
            PODS.stringify(order.minFillAmount || 0),
          ] as const;

          console.debug('Canceling order: ', [account, ...params]);

          // Check: Verify these params actually hash to an on-chain order
          // This prevents invalid orders from getting cancelled and emitting
          // a bogus PodOrderCancelled event.
          const verify = await moonmage.podOrder(account, ...params);
          if (!verify || verify.eq(0)) throw new Error('Order not found');
          
          const txn = await moonmage.cancelPodOrder(...params, destination);
          txToast.confirming(txn);

          const receipt = await txn.wait();
          await Promise.all([
            refetchCosmomageStationItems(), // clear old pod order
            refetchCosmonautBalances(), // refresh Moons
          ]);
          txToast.success(receipt);
          // navigate('/market/account');
        } catch (err) {
          console.error(err);
          txToast.error(err);
        } finally {
          setLoading(false);
        }
      })();
    },
    [account, middleware, Moon, moonmage, refetchCosmomageStationItems, refetchCosmonautBalances]
  );

  return {
    loading,
    cancelListing,
    cancelOrder,
  };
}
