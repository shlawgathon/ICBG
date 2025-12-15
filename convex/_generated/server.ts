/**
 * Stub file for Convex generated server module.
 * This file will be replaced when running `npx convex dev`.
 *
 * Run `npx convex dev` to generate the actual server bindings.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { v } from "convex/values";

type MutationBuilder = {
  args: any;
  handler: (ctx: any, args: any) => any;
};

type QueryBuilder = {
  args: any;
  handler: (ctx: any, args: any) => any;
};

export function mutation<T extends MutationBuilder>(builder: T): T {
  return builder;
}

export function query<T extends QueryBuilder>(builder: T): T {
  return builder;
}

export { v };

