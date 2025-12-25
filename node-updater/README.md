Node Updater
============

Purpose: fetch the latest article from the Laravel API, search Google for related articles, scrape two top external articles, call an LLM to rewrite the original article to match style/format, and publish the updated article back via the API.

Quick start

1. Copy `.env.example` to `.env` and set `LARAVEL_API_BASE` and `OPENAI_API_KEY`.

2. Install and run:

```bash
cd node-updater
npm install
node index.js --once
```

Notes
- The script uses simple Google HTML scraping and may be rate-limited.
- Provide a valid `OPENAI_API_KEY` for LLM calls.
