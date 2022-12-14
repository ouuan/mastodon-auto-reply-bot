/* eslint-disable no-console */
import { login, Status } from 'masto';
import yaml from 'yaml';
import { readFile } from 'fs/promises';
import { fromZodError } from 'zod-validation-error';
import { exhaustiveCheck } from 'ts-exhaustive-check';
import async from 'async';
import sleep from 'sleep-promise';

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
  if (typeof value !== 'number') {
    return false;
  }
  if (filter.min !== undefined && value < filter.min) {
    return false;
  }
  if (filter.max !== undefined && value > filter.max) {
    return false;
  }
  return true;
}

function matchBooleanFilter(value: any, filter: BooleanFilter) {
  return typeof value === 'boolean' && value === filter.is;
}

function matchNullFilter(value: any) {
  return value === null;
}

function matchRule(status: Status, rule: Rule) {
  for (const filter of rule.filters) {
    const value = access(status, filter.path);
    switch (filter.type) {
      case 'string':
        if (!matchStringFilter(value, filter)) return false;
        break;
      case 'number':
        if (!matchNumberFilter(value, filter)) return false;
        break;
      case 'boolean':
        if (!matchBooleanFilter(value, filter)) return false;
        break;
      case 'null':
        if (!matchNullFilter(value)) return false;
        break;
      default:
        exhaustiveCheck(filter);
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

  console.log('Connected');

  const queue = async.queue(async (reply: Parameters<typeof masto.statuses.create>[0]) => {
    try {
      const replyStatus = await masto.statuses.create(reply);
      console.log(`replied ${replyStatus.id} to ${reply.inReplyToId}: ${reply.status}`);
    } catch (e) {
      console.error(`failed to reply to ${reply.inReplyToId}: ${e}`);
    }
    await sleep(10000); // avoid replying too fast
  });

  stream.on('update', async (status) => {
    console.log(`status received: ${status.id}`);
    for (const rule of rules) {
      if (matchRule(status, rule)) {
        const reply = `${rule.at ? `@${status.account.acct} ` : ''}${rule.reply}`;
        queue.push({
          status: reply,
          inReplyToId: status.id,
          visibility: rule.visibility,
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
