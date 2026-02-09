/**
 * PHP Library Strategy
 *
 * Generates PHP library packages for Packagist.
 */

import type { GenerationStrategy } from '../../types.js';

/**
 * PHP library strategy
 */
export const PhpLibraryStrategy: GenerationStrategy = {
  id: 'library-php',
  name: 'PHP Library',
  priority: 10,

  matches: stack => stack.archetype === 'library' && stack.language === 'php',

  apply: async ({ files, projectName }) => {
    const vendorName = 'example';
    const pkgName = projectName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    const ns = pkgName
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join('');

    // composer.json
    files['composer.json'] = JSON.stringify(
      {
        name: `${vendorName}/${pkgName}`,
        description: `${projectName} library`,
        type: 'library',
        license: 'MIT',
        autoload: {
          'psr-4': {
            [`${ns}\\`]: 'src/',
          },
        },
        'autoload-dev': {
          'psr-4': {
            [`${ns}\\Tests\\`]: 'tests/',
          },
        },
        require: {
          php: '>=8.2',
        },
        'require-dev': {
          'phpunit/phpunit': '^10.5',
          'laravel/pint': '^1.13',
        },
        scripts: {
          test: 'phpunit',
          lint: 'pint',
        },
        'minimum-stability': 'stable',
      },
      null,
      4
    );

    // Source
    files[`src/${ns}.php`] = `<?php

declare(strict_types=1);

namespace ${ns};

class ${ns}
{
    /**
     * Generate a greeting message.
     */
    public static function greet(string $name, string $greeting = 'Hello'): string
    {
        return "{$greeting}, {$name}!";
    }

    /**
     * Add two numbers.
     */
    public static function add(int $a, int $b): int
    {
        return $a + $b;
    }
}
`;

    // PHPUnit config
    files['phpunit.xml'] = `<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true">
    <testsuites>
        <testsuite name="Unit">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
    <source>
        <include>
            <directory>src</directory>
        </include>
    </source>
</phpunit>
`;

    // Test
    files[`tests/${ns}Test.php`] = `<?php

declare(strict_types=1);

namespace ${ns}\\Tests;

use PHPUnit\\Framework\\TestCase;
use ${ns}\\${ns};

class ${ns}Test extends TestCase
{
    public function test_greet_default(): void
    {
        $this->assertSame('Hello, World!', ${ns}::greet('World'));
    }

    public function test_greet_custom(): void
    {
        $this->assertSame('Hi, World!', ${ns}::greet('World', 'Hi'));
    }

    public function test_add(): void
    {
        $this->assertSame(3, ${ns}::add(1, 2));
    }
}
`;

    // .gitignore
    files['.gitignore'] = `vendor/
composer.lock
.phpunit.result.cache
`;

    // Makefile
    files['Makefile'] = `COMPOSER := composer
PHP := php

.PHONY: install test lint clean

install:
\t$(COMPOSER) install

test:
\t$(PHP) vendor/bin/phpunit

lint:
\t$(PHP) vendor/bin/pint

clean:
\trm -rf vendor
`;
  },
};
