import { createStreamingAPIClient, createRestAPIClient } from 'masto';
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
  ArrayFilter,
} from './schema';
import { access } from './utils';

function log(s: any) {
  /* eslint-disable-next-line no-console */
  console.log(`${new Date().toISOString()}  ${s}`);
}

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

function matchArrayFilter(value: any, filter: ArrayFilter) {
  if (!Array.isArray(value)) {
    return false;
  }
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  return value.some((item) => matchFilters(item, filter.contains));
}

function matchFilters(root: any, filters: Rule['filters']) {
  for (const filter of filters) {
    const value = access(root, filter.path);
    const { invert } = filter;
    switch (filter.type) {
      case 'string':
        if (matchStringFilter(value, filter) === invert) return false;
        break;
      case 'number':
        if (matchNumberFilter(value, filter) === invert) return false;
        break;
      case 'boolean':
        if (matchBooleanFilter(value, filter) === invert) return false;
        break;
      case 'null':
        if (matchNullFilter(value) === invert) return false;
        break;
      case 'array':
        if (matchArrayFilter(value, filter) === invert) return false;
        break;
      default:
        exhaustiveCheck(filter);
    }
  }
  return true;
}

async function main() {
  const parseResult = Config.safeParse(yaml.parse(await readFile('config.yml', 'utf-8')));

  if (!parseResult.success) {
    log(fromZodError(parseResult.error));
    process.exit(1);
  }

  const {
    url,
    streamingApiUrl,
    accessToken,
    rules,
  } = parseResult.data;

  const { v1: rest } = createRestAPIClient({ url, accessToken });

  const stream = createStreamingAPIClient({
    streamingApiUrl,
    accessToken,
  }).public.local.subscribe();

  log('Connected');

  const queue = async.queue(async (reply: Parameters<typeof rest.statuses.create>[0]) => {
    try {
      const replyStatus = await rest.statuses.create(reply);
      log(`replied ${replyStatus.id} to ${reply.inReplyToId}: ${reply.status}`);
    } catch (e) {
      log(`failed to reply to ${reply.inReplyToId}: ${e}`);
    }
    await sleep(60000); // avoid replying too fast
  });

  for await (const event of stream) {
    switch (event.event) {
      case 'update': {
        const status = event.payload;
        log(`status received: ${status.id}`);
        for (const rule of rules) {
          if (matchFilters(status, rule.filters)) {
            queue.push({
              status: `${rule.at ? `@${status.account.acct} ` : ''}${rule.reply}`,
              inReplyToId: status.id,
              visibility: rule.visibility,
            });
            break;
          }
        }
        break;
      }
      default:
        log(`timeline event ${event.event}: ${JSON.stringify(event.payload)}`);
        break;
    }
  }

  throw new Error('stream closed');
}

setInterval(() => {
  log('heartbeat');
}, 3600_000);

main().catch((e) => {
  log(e);
  process.exit(2);
});
