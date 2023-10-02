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

Example `config.yml`: (See also [Status - Mastodon documentation](https://docs.joinmastodon.org/entities/Status/) and [Status | masto](https://neet.github.io/masto.js/interfaces/Status.html))

```yaml
url: https://mastodon.social/
accessToken: TOKEN
rules:
  - filters:
      - path: content  # path in the Status API entity
        type: string
        match: bot
      - path: tags
        type: array
        contains:  # array contains subfilters
          - path: name
            type: string
            match: auto-reply
    reply: Hello! I'm an auto-reply bot.
    at: false  # no @username in the reply
  - filters:
      - path: content
        type: string
        match: '[Hh]ello'  # regular expression
      - path: visibility
        invert: true  # reply only when the condition is not met
        type: string
        match: private
      - path: account.followersCount
        type: number
        min: 1
        max: 5
      - path: account.bot
        type: boolean
        is: false
      - path: inReplyToId
        type: 'null'
    reply: Nice to meet you!
    visibility: direct  # the visibility of the reply
```
