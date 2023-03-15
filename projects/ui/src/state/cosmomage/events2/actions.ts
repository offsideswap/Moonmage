import { createAction } from '@reduxjs/toolkit';
import { Event } from '~/lib/Moonmage/EventProcessor';
import { EventCacheName } from '.';

export type IngestPayload = {
  // Cache selectors
  cache:   EventCacheName;
  account: string;
  chainId: number;
  // Results
  startBlockNumber: number | undefined;
  endBlockNumber: number;
  timestamp: number;
  events: Event[];
}

export const ingestEvents = createAction<IngestPayload>(
  'cosmomage/events2/ingest'
);

export const resetEvents = createAction(
  'cosmomage/events2/reset'
);
