/* eslint-disable no-console */
import { login, Status } from 'masto';
import yaml from 'yaml';
import { readFile } from 'fs/promises';
import { fromZodError } from 'zod-validation-error';

import {
  Config,
  Rule,
  StringFilter,
  NumberFilter,
  BooleanFilter,
} from './schema';
import { access } from './utils';

function matchStringFilter(value: any, filter: StringFilter) {
  return typeof value === 'string' && new RegExp(filter.match).test(value);
}

function matchNumberFilter(value: any, filter: NumberFilter) {
  return typeof value === 'number' && value >= filter.min && value <= filter.max;
}

function matchBooleanFilter(value: any, filter: BooleanFilter) {
  return typeof value === 'boolean' && value === filter.is;
}

function matchRule(status: Status, rule: Rule) {
  for (const filter of rule.stringFilters || []) {
    if (!matchStringFilter(access(status, filter.path), filter)) {
      return false;
    }
  }
  for (const filter of rule.numberFilters || []) {
    if (!matchNumberFilter(access(status, filter.path), filter)) {
      return false;
    }
  }
  for (const filter of rule.booleanFilters || []) {
    if (!matchBooleanFilter(access(status, filter.path), filter)) {
      return false;
    }
  }
  return true;
}

async function main() {
  const config: Config = yaml.parse(await readFile('config.yml', 'utf-8'));

  try {
    Config.parse(config);
  } catch (e) {
    console.error(fromZodError(e));
    process.exit(1);
  }

  const { url, accessToken, rules } = config;

  const masto = await login({ url, accessToken });

  const stream = await masto.stream.streamCommunityTimeline();

  stream.on('update', async (status) => {
    console.log(`status received: ${status.id}`);
    for (const rule of rules) {
      if (matchRule(status, rule)) {
        console.log(`replied to ${status.id}: ${rule.reply}`);
        masto.statuses.create({
          status: rule.reply,
          inReplyToId: status.id,
        });
        break;
      }
    }
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
