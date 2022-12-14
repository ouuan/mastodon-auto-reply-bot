# mastodon-auto-reply-bot

A Mastodon Bot to automatically reply to statuses that match the given filters.

## Run

### Docker Compose

Use [`docker-compose.yml`](docker-compose.yml).

### Local

```bash
git clone https://github.com/ouuan/mastodon-auto-reply-bot
cd mastodon-auto-reply-bot
pnpm i
pnpm build
node .
```

## Config

Example `config.yml`:

```yaml
url: https://mastodon.social/
accessToken: TOKEN
rules:
  - stringFilters:
      - path: content
        match: bot
    reply: Hello! I'm an auto-reply bot.
  - stringFilters:
      - path: content
        match: '[Hh]ello'
      - path: visibility
        match: '^public$'
    numberFilters:
      - path: account.followers_count
        min: 0
        max: 5
    booleanFilters:
      - path: account.bot
        is: false
    reply: Nice to meet you!
    visibility: direct
```
