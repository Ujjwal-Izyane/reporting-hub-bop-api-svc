/**************************************************************************
 *  (C) Copyright Mojaloop Foundation 2020                                *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Yevhen Kyriukha <yevhen.kyriukha@modusbox.com>                   *
 **************************************************************************/

import { Context } from '@app/context';
import DataLoader from 'dataloader';

const ID = Symbol();

// Function to fetch all party events for a transactionId
const findPartyEvent = async (ctx: Context, transactionId: string) => {
  const events = await ctx.eventStore.reportingData.findMany({
    where: {
      metadata: {
        equals: {
          reporting: {
            eventType: 'PartyLookup',
            transactionId: transactionId,
          },
        },
      },
    },
  });

  return events.map((e) => e.event);  // return an array of events
};

// Create DataLoader for fetching party events by transactionId
export const getPartyEventsDataloader = (ctx: Context): DataLoader<string, any[]> => {
  const { loaders } = ctx;

  // Initialize the DataLoader if it doesn't exist
  let dl = loaders.get(ID);
  if (!dl) {
    dl = new DataLoader(async (transactionIds: readonly string[]) => {

      // Fetch events for all transactionIds in batch
      const events = await Promise.all(
        transactionIds.map((transactionId) => findPartyEvent(ctx, transactionId))
      );

      return events;
    });

    // Cache the DataLoader instance for reuse
    loaders.set(ID, dl);
  }

  return dl;
};

