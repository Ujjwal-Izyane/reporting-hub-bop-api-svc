/**************************************************************************
 *  (C) Copyright Mojaloop Foundation 2020                                *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Yevhen Kyriukha <yevhen.kyriukha@modusbox.com>                   *
 **************************************************************************/

import { arg, extendType, inputObjectType, intArg, nonNull, stringArg } from 'nexus';
import { createTransferFilter } from './helpers';

const PartyFilter = inputObjectType({
  name: 'PartyFilter',
  definition(t) {
    t.field('dfsp', { type: 'String' });
    t.field('idType', { type: 'PartyIDType' });
    t.field('idValue', { type: 'String' });
  },
});

const TransferFilter = inputObjectType({
  name: 'TransferFilter',
  definition(t) {
    t.nonNull.field('startDate', { type: 'DateTimeFlexible' });
    t.nonNull.field('endDate', { type: 'DateTimeFlexible' });
    t.field('errorCode', { type: 'Int' });
    t.field('payer', { type: 'PartyFilter' });
    t.field('payee', { type: 'PartyFilter' });
    t.field('amount', { type: 'Int' });
    t.field('sourceCurrency', { type: 'Currency' });
    t.field('targetCurrency', { type: 'Currency' });
    t.field('transferState', { type: 'TransferState' });
    t.field('settlementWindowId', { type: 'Int' });
    t.field('settlementId', { type: 'Int' });
  },
});

const Query = extendType({
  type: 'Query',
  definition(t) {
    t.field('transfer', {
      type: 'Transfer',
      args: {
        transferId: nonNull(stringArg()),
      },
      resolve: async (parent, args, ctx) => {
        const tr = await ctx.eventStore.transaction.findMany({
          where: {
            transactionId: args.transferId,
          },
        });
        if (!tr) {
          return null;
        }
        return {
          transferId: tr.transactionId,
          amount: tr.sourceAmount, //.toNumber()
          sourceCurrency: tr.sourceCurrency,
          targetCurrency: tr.targetCurrency,
          createdAt: tr.createdAt, //.toISOString(),
          // ilpCondition: tr.ilpCondition,
        };
      },
    });

    t.nonNull.list.nonNull.field('transfers', {
      type: 'Transfer',
      args: {
        filter: arg({ type: nonNull('TransferFilter') }),
        limit: intArg(),
        offset: intArg(),
      },
      resolve: async (parent, args, ctx) => {
        const transferFilter = createTransferFilter(ctx.participants, args.filter);

        const transfers = await ctx.eventStore.transaction.findMany({
          take: args.limit ?? 100,
          skip: args.offset || undefined,
          orderBy: [{ createdAt: 'desc' }],
          where: transferFilter,
        });

        return transfers.map((tr) => ({
          transferId: tr.transferId,
          amount: tr.sourceAmount,
          sourceCurrency: tr.sourceCurrency,
          targetCurrency: tr.targetCurrency,
          createdAt: tr.createdAt.toISOString(),
          // ilpCondition: tr.ilpCondition,
        }));
      },
    });
  },
});

export default [Query, TransferFilter, PartyFilter];
