import { z } from 'zod';

const BaseFilter = z.object({
  path: z.string(),
});

export const StringFilter = BaseFilter.extend({
  match: z.string(),
});

export const NumberFilter = BaseFilter.extend({
  min: z.number(),
  max: z.number(),
});

export const BooleanFilter = BaseFilter.extend({
  is: z.boolean(),
});

export const Rule = z.object({
  stringFilters: z.array(StringFilter).optional(),
  numberFilters: z.array(NumberFilter).optional(),
  booleanFilters: z.array(BooleanFilter).optional(),
  reply: z.string(),
});

export const Config = z.object({
  url: z.string().url(),
  accessToken: z.string(),
  rules: z.array(Rule),
});

export type StringFilter = z.infer<typeof StringFilter>;
export type NumberFilter = z.infer<typeof NumberFilter>;
export type BooleanFilter = z.infer<typeof BooleanFilter>;
export type Rule = z.infer<typeof Rule>;
export type Config = z.infer<typeof Config>;
