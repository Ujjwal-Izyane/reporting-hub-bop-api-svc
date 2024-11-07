"use strict";
/**************************************************************************
 *  (C) Copyright Mojaloop Foundation 2020                                *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Yevhen Kyriukha <yevhen.kyriukha@modusbox.com>                   *
 **************************************************************************/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactionTypeDataloader = void 0;
const dataloader_1 = __importDefault(require("dataloader"));
const ID = Symbol();
const findTransactionTypes = async (ctx, transactionScenarioIds) => {
    const entries = await ctx.centralLedger.transactionScenario.findMany({
        where: {
            transactionScenarioId: {
                in: transactionScenarioIds,
            },
        },
    });
    return Object.fromEntries(entries.map((e) => [e.transactionScenarioId, e]));
};
const getTransactionTypeDataloader = (ctx) => {
    const { loaders } = ctx;
    // initialize DataLoader for getting payers by transfer IDs
    let dl = loaders.get(ID);
    if (!dl) {
        dl = new dataloader_1.default(async (transactionScenarioIds) => {
            const result = await findTransactionTypes(ctx, transactionScenarioIds);
            // IMPORTANT: sort data in the same order as transferIds
            return transactionScenarioIds.map((id) => result[id]);
        });
        // Put instance of dataloader in WeakMap for future reuse
        loaders.set(ID, dl);
    }
    return dl;
};
exports.getTransactionTypeDataloader = getTransactionTypeDataloader;
//# sourceMappingURL=TransactionType.js.map