/**
 * PHP Backend Strategies
 *
 * Generates PHP Laravel backend projects.
 */

import type { GenerationStrategy } from '../../types.js';

/**
 * Laravel backend strategy
 */
export const LaravelStrategy: GenerationStrategy = {
  id: 'laravel',
  name: 'Laravel Backend',
  priority: 10,

  matches: stack =>
    stack.language === 'php' && stack.archetype === 'backend' && stack.framework === 'laravel',

  apply: async ({ files, projectName, stack }) => {
    const appName = projectName.replace(/-/g, '_').toLowerCase();

    // 1. composer.json
    const require: Record<string, string> = {
      php: '^8.2',
      'laravel/framework': '^11.0',
      'laravel/tinker': '^2.9',
    };

    const requireDev: Record<string, string> = {
      'fakerphp/faker': '^1.23',
      'laravel/pint': '^1.13',
      'laravel/sail': '^1.26',
      mockery: '^1.6',
      nunomaduro: '^2.0',
      pestphp: '^2.0',
      phpunit: '^10.5',
    };

    if (stack.database === 'postgres') {
      // PostgreSQL support is built into PHP via PDO
    } else if (stack.database === 'mysql') {
      // MySQL support is built into PHP via PDO
    } else if (stack.database === 'sqlite') {
      // SQLite support is built into PHP via PDO
    }

    files['composer.json'] = JSON.stringify(
      {
        name: `app/${appName}`,
        type: 'project',
        description: projectName,
        require,
        'require-dev': requireDev,
        autoload: {
          'psr-4': {
            'App\\': 'app/',
            'Database\\Factories\\': 'database/factories/',
            'Database\\Seeders\\': 'database/seeders/',
          },
        },
        'autoload-dev': {
          'psr-4': {
            'Tests\\': 'tests/',
          },
        },
        scripts: {
          'post-autoload-dump': ['@php artisan package:discover --ansi'],
          'post-root-package-install': [
            "@php -r \"file_exists('.env') || copy('.env.example', '.env');\"",
          ],
          'post-create-project-cmd': ['@php artisan key:generate --ansi'],
        },
        config: {
          'optimize-autoloader': true,
          'preferred-install': 'dist',
          'sort-packages': true,
        },
        minimum_stability: 'stable',
        prefer_stable: true,
      },
      null,
      4
    );

    // 2. .env.example
    let dbConnection = 'sqlite';
    let dbEnvVars = '';

    if (stack.database === 'postgres') {
      dbConnection = 'pgsql';
      dbEnvVars = `DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=${appName}
DB_USERNAME=postgres
DB_PASSWORD=postgres`;
    } else if (stack.database === 'mysql') {
      dbConnection = 'mysql';
      dbEnvVars = `DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=${appName}
DB_USERNAME=root
DB_PASSWORD=root`;
    } else {
      dbEnvVars = `DB_DATABASE=database/database.sqlite`;
    }

    files['.env.example'] = `APP_NAME="${projectName}"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

LOG_CHANNEL=stack
LOG_LEVEL=debug

DB_CONNECTION=${dbConnection}
${dbEnvVars}

CACHE_STORE=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync
`;

    // 3. artisan
    files['artisan'] = `#!/usr/bin/env php
<?php

define('LARAVEL_START', microtime(true));

require __DIR__.'/vendor/autoload.php';

$status = (require_once __DIR__.'/bootstrap/app.php')
    ->handleCommand(new Symfony\\Component\\Console\\Input\\ArgvInput);

exit($status);
`;

    // 4. bootstrap/app.php
    files['bootstrap/app.php'] = `<?php

use Illuminate\\Foundation\\Application;
use Illuminate\\Foundation\\Configuration\\Exceptions;
use Illuminate\\Foundation\\Configuration\\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        health: '/health',
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
`;

    // 5. routes/api.php
    files['routes/api.php'] = `<?php

use Illuminate\\Support\\Facades\\Route;
use App\\Http\\Controllers\\Api\\HealthController;

Route::get('/status', [HealthController::class, 'index']);

Route::prefix('v1')->group(function () {
    // Add your API v1 routes here
});
`;

    // 6. app/Http/Controllers/Controller.php (base)
    files['app/Http/Controllers/Controller.php'] = `<?php

namespace App\\Http\\Controllers;

abstract class Controller
{
    //
}
`;

    // 7. Health Controller
    files['app/Http/Controllers/Api/HealthController.php'] = `<?php

namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use Illuminate\\Http\\JsonResponse;

class HealthController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
            'application' => '${projectName}',
        ]);
    }
}
`;

    // 8. app/Models/User.php (default model)
    files['app/Models/User.php'] = `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Foundation\\Auth\\User as Authenticatable;
use Illuminate\\Notifications\\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
`;

    // 9. app/Providers/AppServiceProvider.php
    files['app/Providers/AppServiceProvider.php'] = `<?php

namespace App\\Providers;

use Illuminate\\Support\\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        //
    }
}
`;

    // 10. Database migration
    files['database/migrations/0001_01_01_000000_create_users_table.php'] = `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
`;

    // 11. Database seeder
    files['database/seeders/DatabaseSeeder.php'] = `<?php

namespace Database\\Seeders;

use Illuminate\\Database\\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Add your seeders here
    }
}
`;

    // 12. config/app.php
    files['config/app.php'] = `<?php

return [
    'name' => env('APP_NAME', '${projectName}'),
    'env' => env('APP_ENV', 'production'),
    'debug' => (bool) env('APP_DEBUG', false),
    'url' => env('APP_URL', 'http://localhost'),
    'timezone' => 'UTC',
    'locale' => 'en',
    'fallback_locale' => 'en',
    'faker_locale' => 'en_US',
    'key' => env('APP_KEY'),
    'cipher' => 'AES-256-CBC',
    'maintenance' => [
        'driver' => 'file',
    ],
];
`;

    // 13. config/database.php
    files['config/database.php'] = `<?php

return [
    'default' => env('DB_CONNECTION', '${dbConnection}'),

    'connections' => [
        'sqlite' => [
            'driver' => 'sqlite',
            'url' => env('DB_URL'),
            'database' => env('DB_DATABASE', database_path('database.sqlite')),
            'prefix' => '',
            'foreign_key_constraints' => env('DB_FOREIGN_KEYS', true),
        ],

        'mysql' => [
            'driver' => 'mysql',
            'url' => env('DB_URL'),
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '3306'),
            'database' => env('DB_DATABASE', 'laravel'),
            'username' => env('DB_USERNAME', 'root'),
            'password' => env('DB_PASSWORD', ''),
            'unix_socket' => env('DB_SOCKET', ''),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => true,
            'engine' => null,
        ],

        'pgsql' => [
            'driver' => 'pgsql',
            'url' => env('DB_URL'),
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '5432'),
            'database' => env('DB_DATABASE', 'laravel'),
            'username' => env('DB_USERNAME', 'postgres'),
            'password' => env('DB_PASSWORD', ''),
            'charset' => 'utf8',
            'prefix' => '',
            'prefix_indexes' => true,
            'search_path' => 'public',
            'sslmode' => 'prefer',
        ],
    ],

    'migrations' => [
        'table' => 'migrations',
        'update_date_on_publish' => true,
    ],
];
`;

    // 14. PHPUnit config
    files['phpunit.xml'] = `<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true">
    <testsuites>
        <testsuite name="Unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="Feature">
            <directory>tests/Feature</directory>
        </testsuite>
    </testsuites>
    <source>
        <include>
            <directory>app</directory>
        </include>
    </source>
    <php>
        <env name="APP_ENV" value="testing"/>
        <env name="DB_CONNECTION" value="sqlite"/>
        <env name="DB_DATABASE" value=":memory:"/>
    </php>
</phpunit>
`;

    // 15. Test base classes
    files['tests/TestCase.php'] = `<?php

namespace Tests;

use Illuminate\\Foundation\\Testing\\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    //
}
`;

    files['tests/Feature/HealthTest.php'] = `<?php

namespace Tests\\Feature;

use Tests\\TestCase;

class HealthTest extends TestCase
{
    public function test_health_endpoint_returns_ok(): void
    {
        $response = $this->getJson('/health');

        $response->assertStatus(200);
    }

    public function test_api_status_endpoint_returns_ok(): void
    {
        $response = $this->getJson('/api/status');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'ok',
                'application' => '${projectName}',
            ]);
    }
}
`;

    // 16. .gitignore
    files['.gitignore'] = `# Laravel
/vendor/
/node_modules/
/.env
/.env.backup
/.env.production
/public/hot
/public/storage
/storage/*.key

# Build / Cache
/bootstrap/cache/*
!bootstrap/cache/.gitkeep

# Logs
/storage/logs/*
!storage/logs/.gitkeep

# IDE
/.idea
/.vscode
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
/coverage
.phpunit.result.cache
`;

    // 17. Makefile
    files['Makefile'] = `PHP := php
ARTISAN := $(PHP) artisan
COMPOSER := composer

.PHONY: setup serve test migrate seed lint fresh

setup:
\t$(COMPOSER) install
\tcp .env.example .env
\t$(ARTISAN) key:generate
\t$(ARTISAN) migrate

serve:
\t$(ARTISAN) serve

test:
\t$(PHP) vendor/bin/phpunit

migrate:
\t$(ARTISAN) migrate

seed:
\t$(ARTISAN) db:seed

lint:
\t$(PHP) vendor/bin/pint

fresh:
\t$(ARTISAN) migrate:fresh --seed

tinker:
\t$(ARTISAN) tinker
`;

    // 18. public/index.php (entry point)
    files['public/index.php'] = `<?php

use Illuminate\\Http\\Request;

define('LARAVEL_START', microtime(true));

if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

require __DIR__.'/../vendor/autoload.php';

(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Request::capture());
`;
  },
};
