@echo off
echo Setting up backend (Laravel):
cd backend-laravel
if not exist vendor\autoload.php (
  echo Run: composer install
)
if not exist database\database.sqlite (
  php -r "file_exists('database/database.sqlite') || copy NUL database\database.sqlite"
)
echo Run migrations:
php artisan migrate --force
echo Starting Laravel dev server on 8000
start cmd /k "php artisan serve --host=127.0.0.1 --port=8000"
cd ..
echo Installing node-updater
cd node-updater
if not exist node_modules (
  npm install
)
echo NOTE: configure .env in node-updater with OPENAI_API_KEY and LARAVEL_API_BASE
cd ..
echo Installing frontend
cd frontend
if not exist node_modules (
  npm install
)
start cmd /k "npm run dev"
echo All components started (check separate terminals)
