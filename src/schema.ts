/* eslint-disable no-redeclare */

import { z } from 'zod';

const BaseFilter = z.object({
  path: z.string(),
  invert: z.boolean().default(false),
});

export const StringFilter = BaseFilter.extend({
  type: z.literal('string'),
  match: z.string(),
});

export const NumberFilter = BaseFilter.extend({
  type: z.literal('number'),
  min: z.number().optional(),
  max: z.number().optional(),
});

export const BooleanFilter = BaseFilter.extend({
  type: z.literal('boolean'),
  is: z.boolean(),
});

export const NullFilter = BaseFilter.extend({
  type: z.literal('null'),
});

export const ArrayFilter = BaseFilter.extend({
  type: z.literal('array'),
  contains: z.array(z.discriminatedUnion('type', [
    StringFilter,
    NumberFilter,
    BooleanFilter,
    NullFilter,
  ])),
});

export const Rule = z.object({
  filters: z.array(z.discriminatedUnion('type', [
    StringFilter,
    NumberFilter,
    BooleanFilter,
    NullFilter,
    ArrayFilter,
  ])),
  reply: z.string(),
  visibility: z.enum(['public', 'unlisted', 'private', 'direct']).default('public'),
  at: z.boolean().default(true),
});

export const Config = z.object({
  url: z.string().url(),
  accessToken: z.string(),
  rules: z.array(Rule),
});

export type StringFilter = z.infer<typeof StringFilter>;
export type NumberFilter = z.infer<typeof NumberFilter>;
export type BooleanFilter = z.infer<typeof BooleanFilter>;
export type NullFilter = z.infer<typeof NullFilter>;
export type ArrayFilter = z.infer<typeof ArrayFilter>;
export type Rule = z.infer<typeof Rule>;
export type Config = z.infer<typeof Config>;
