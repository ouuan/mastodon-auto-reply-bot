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

Example `config.yml`: (See also [Status - Mastodon documentation](https://docs.joinmastodon.org/entities/Status/))

```yaml
url: https://mastodon.social/
accessToken: TOKEN
rules:
  - filters:
      - path: content
        type: string
        match: bot
    reply: Hello! I'm an auto-reply bot.
  - filters:
      - path: content
        type: string
        match: '[Hh]ello'
      - path: visibility
        type: string
        match: '^public$'
      - path: account.followers_count
        type: number
        min: 1
        max: 5
      - path: account.bot
        type: boolean
        is: false
      - path: in_reply_to_id
        type: 'null'
    reply: Nice to meet you!
    visibility: direct
```
