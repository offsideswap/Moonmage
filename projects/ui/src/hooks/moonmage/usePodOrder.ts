import { useMemo } from 'react';
import { usePodOrderQuery } from '~/generated/graphql';
import { Source } from '~/util';
import { castPodOrder } from '~/state/cosmomage/market';
import useCosmonautOrdersLedger from '../cosmomage/useCosmonautOrdersLedger';

const usePodOrder = (id: string | undefined) => {
  const cosmomageOrders   = useCosmonautOrdersLedger();
  const query          = usePodOrderQuery({ variables: { id: id || '' }, skip: !id });
  const [data, source] = useMemo(() => {
    if (id && query.data?.podOrder) {
      return [castPodOrder(query.data.podOrder), Source.SUBGRAPH];
    }
    if (id && cosmomageOrders[id]) {
      return [cosmomageOrders[id], Source.LOCAL];
    }
    return [undefined, undefined];
  }, [cosmomageOrders, id, query.data?.podOrder]);
  
  return {
    ...query,
    /// If the query finished loading and has no data,
    /// check redux for a local order that was loaded
    /// via direct event processing.
    data,
    source,
  };
};

export default usePodOrder;
