/**
 * Stub file for Convex generated data model.
 * This file will be replaced when running `npx convex dev`.
 *
 * Run `npx convex dev` to generate the actual data model types.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type DataModel = {
  orderBatches: {
    document: any;
    fieldPaths: any;
    indexes: any;
    searchIndexes: any;
    vectorIndexes: any;
  };
  orders: {
    document: any;
    fieldPaths: any;
    indexes: any;
    searchIndexes: any;
    vectorIndexes: any;
  };
  addressSelections: {
    document: any;
    fieldPaths: any;
    indexes: any;
    searchIndexes: any;
    vectorIndexes: any;
  };
};

export type Doc<T extends keyof DataModel> = DataModel[T]["document"] & {
  _id: string;
  _creationTime: number;
};

