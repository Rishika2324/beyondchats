BeyondChats Assignment — Submission
=================================

Contents
- `backend-laravel/` — Laravel API, `Article` model, `scrape:articles` artisan command.
- `node-updater/` — NodeJS script to fetch latest article, search web, scrape two articles, call LLM, and update the article.
- `frontend/` — Vite + React app to list articles and show updated content.
- `run_all.bat` — convenience script to set up and start components on Windows.

Architecture
- Laravel stores articles and provides CRUD APIs.
- Node script polls Laravel, enriches content using web references and an LLM, then updates via Laravel APIs.
- React frontend reads from Laravel APIs and displays both original and updated article bodies.

Setup summary
1. Backend: follow `backend-laravel/ASSIGNMENT_README.md` to create DB and run migrations.
2. Node updater: copy `.env.example` and set `OPENAI_API_KEY` and `LARAVEL_API_BASE`, then `npm install` and run `node index.js --once`.
3. Frontend: `cd frontend && npm install && npm run dev`.

Notes
- The Node updater uses Google HTML scraping to find candidate reference articles; this may break or be rate-limited in real environments. For production, use a search API (SerpAPI, Bing Search API).
- Provide a valid OpenAI key in `node-updater/.env` to enable LLM rewriting.

Live link
- (Optional) Deploy frontend and backend; add link here.
