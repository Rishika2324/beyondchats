Assignment quick-run
====================

1) Requirements: PHP, Composer, SQLite (or configure MySQL/Postgres)

2) Create an sqlite database to simplify setup:

```bash
php -r "file_exists('database/database.sqlite') || touch('database/database.sqlite');"
```

3) Copy `.env` and set DB connection to sqlite:

```bash
copy .env.example .env   # Windows
php artisan key:generate
# then set in .env:
# DB_CONNECTION=sqlite
# DB_DATABASE= database/database.sqlite
```

4) Install deps and run migrations:

```bash
composer install
php artisan migrate
```

5) Scrape the 5 oldest blog articles and store in DB:

```bash
php artisan scrape:articles
```

6) Start the dev server and call the API:

```bash
php artisan serve
# GET all articles
curl http://127.0.0.1:8000/api/articles
```

Notes
- The artisan command attempts to detect the last page of https://beyondchats.com/blogs/ and scrape up to 5 articles from that page.
- The scraper is conservative and uses DOM parsing fallbacks; results may vary depending on the remote site's structure.
