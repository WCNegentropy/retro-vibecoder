/**
 * Ruby Backend Strategies
 *
 * Generates Ruby on Rails backend projects.
 */

import type { GenerationStrategy } from '../../types.js';

/**
 * Ruby on Rails backend strategy
 */
export const RailsStrategy: GenerationStrategy = {
  id: 'rails',
  name: 'Ruby on Rails Backend',
  priority: 10,

  matches: stack =>
    stack.language === 'ruby' && stack.archetype === 'backend' && stack.framework === 'rails',

  apply: async ({ files, projectName, stack }) => {
    const appName = projectName.replace(/-/g, '_').toLowerCase();

    // 1. Gemfile
    const gems = [
      'gem "rails", "~> 7.1"',
      'gem "puma", ">= 5.0"',
      'gem "jbuilder"',
      'gem "bootsnap", require: false',
      'gem "rack-cors"',
    ];

    if (stack.database === 'postgres') {
      gems.push('gem "pg", "~> 1.5"');
    } else if (stack.database === 'mysql') {
      gems.push('gem "mysql2", "~> 0.5"');
    } else if (stack.database === 'sqlite') {
      gems.push('gem "sqlite3", "~> 1.4"');
    } else {
      // Default to SQLite for development
      gems.push('gem "sqlite3", "~> 1.4"');
    }

    if (stack.orm === 'activerecord') {
      // ActiveRecord is included with Rails by default
    }

    files['Gemfile'] = `source "https://rubygems.org"

ruby ">= 3.1.0"

${gems.join('\n')}

group :development, :test do
  gem "debug", platforms: %i[mri windows]
  gem "rspec-rails", "~> 6.0"
  gem "factory_bot_rails"
  gem "faker"
end

group :development do
  gem "rubocop", require: false
  gem "rubocop-rails", require: false
end
`;

    // 2. config/application.rb
    files['config/application.rb'] = `require_relative "boot"

require "rails/all"

Bundler.require(*Rails.groups)

module ${appName.charAt(0).toUpperCase() + appName.slice(1).replace(/_(\w)/g, (_, c) => c.toUpperCase())}
  class Application < Rails::Application
    config.load_defaults 7.1

    # API-only application
    config.api_only = true

    # Set default timezone
    config.time_zone = "UTC"
  end
end
`;

    // 3. config/boot.rb
    files['config/boot.rb'] = `ENV["BUNDLE_GEMFILE"] ||= File.expand_path("../Gemfile", __dir__)

require "bundler/setup"
require "bootsnap/setup"
`;

    // 4. config/environment.rb
    files['config/environment.rb'] = `require_relative "application"

Rails.application.initialize!
`;

    // 5. config/routes.rb
    files['config/routes.rb'] = `Rails.application.routes.draw do
  get "health", to: "health#show"

  namespace :api do
    namespace :v1 do
      # Add your API routes here
      # resources :items
    end
  end
end
`;

    // 6. config/database.yml
    let dbConfig: string;
    if (stack.database === 'postgres') {
      dbConfig = `default: &default
  adapter: postgresql
  encoding: unicode
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>

development:
  <<: *default
  database: ${appName}_development

test:
  <<: *default
  database: ${appName}_test

production:
  <<: *default
  database: ${appName}_production
  username: <%= ENV["DATABASE_USERNAME"] %>
  password: <%= ENV["DATABASE_PASSWORD"] %>
  host: <%= ENV["DATABASE_HOST"] %>
`;
    } else if (stack.database === 'mysql') {
      dbConfig = `default: &default
  adapter: mysql2
  encoding: utf8mb4
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>

development:
  <<: *default
  database: ${appName}_development

test:
  <<: *default
  database: ${appName}_test

production:
  <<: *default
  database: ${appName}_production
  username: <%= ENV["DATABASE_USERNAME"] %>
  password: <%= ENV["DATABASE_PASSWORD"] %>
  host: <%= ENV["DATABASE_HOST"] %>
`;
    } else {
      dbConfig = `default: &default
  adapter: sqlite3
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  timeout: 5000

development:
  <<: *default
  database: db/development.sqlite3

test:
  <<: *default
  database: db/test.sqlite3

production:
  <<: *default
  database: db/production.sqlite3
`;
    }

    files['config/database.yml'] = dbConfig;

    // 7. config/puma.rb
    files['config/puma.rb'] = `max_threads_count = ENV.fetch("RAILS_MAX_THREADS") { 5 }
min_threads_count = ENV.fetch("RAILS_MIN_THREADS") { max_threads_count }
threads min_threads_count, max_threads_count

worker_timeout 3600 if ENV.fetch("RAILS_ENV", "development") == "development"

port ENV.fetch("PORT") { 3000 }

environment ENV.fetch("RAILS_ENV") { "development" }

pidfile ENV.fetch("PIDFILE") { "tmp/pids/server.pid" }

plugin :tmp_restart
`;

    // 8. config.ru
    files['config.ru'] = `require_relative "config/environment"

run Rails.application
Rails.application.load_server
`;

    // 9. Rakefile
    files['Rakefile'] = `require_relative "config/application"

Rails.application.load_tasks
`;

    // 10. bin/rails
    files['bin/rails'] = `#!/usr/bin/env ruby
APP_PATH = File.expand_path("../config/application", __dir__)
require_relative "../config/boot"
require "rails/command"
Rails::Command.invoke :application, ARGV
`;

    // 11. Health Controller
    files['app/controllers/application_controller.rb'] =
      `class ApplicationController < ActionController::API
end
`;

    files['app/controllers/health_controller.rb'] = `class HealthController < ApplicationController
  def show
    render json: {
      status: "ok",
      timestamp: Time.current.iso8601,
      application: "${projectName}"
    }
  end
end
`;

    // 12. API V1 Base Controller
    files['app/controllers/api/v1/base_controller.rb'] = `module Api
  module V1
    class BaseController < ApplicationController
      before_action :set_default_format

      private

      def set_default_format
        request.format = :json
      end
    end
  end
end
`;

    // 13. Model directory placeholder
    files['app/models/application_record.rb'] = `class ApplicationRecord < ActiveRecord::Base
  primary_abstract_class
end
`;

    // 14. db/seeds.rb
    files['db/seeds.rb'] =
      `# This file should contain all the record creation needed to seed the database.
# The data can then be loaded with: bin/rails db:seed
`;

    // 15. RSpec configuration
    files['spec/rails_helper.rb'] = `require "spec_helper"
ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"

abort("The Rails environment is running in production mode!") if Rails.env.production?
require "rspec/rails"

RSpec.configure do |config|
  config.fixture_paths = [Rails.root.join("spec/fixtures")]
  config.use_transactional_fixtures = true
  config.infer_spec_type_from_file_location!
  config.filter_rails_from_backtrace!
end
`;

    files['spec/spec_helper.rb'] = `RSpec.configure do |config|
  config.expect_with :rspec do |expectations|
    expectations.include_chain_clauses_in_custom_matcher_descriptions = true
  end

  config.mock_with :rspec do |mocks|
    mocks.verify_partial_doubles = true
  end

  config.shared_context_metadata_behavior = :apply_to_host_groups
end
`;

    // 16. Request spec for health endpoint
    files['spec/requests/health_spec.rb'] = `require "rails_helper"

RSpec.describe "Health", type: :request do
  describe "GET /health" do
    it "returns ok status" do
      get "/health"

      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)
      expect(json["status"]).to eq("ok")
      expect(json["application"]).to eq("${projectName}")
    end
  end
end
`;

    // 17. .gitignore
    files['.gitignore'] = `# Ruby / Rails
*.gem
*.rbc
/.config
/coverage/
/InstalledFiles
/pkg/
/spec/reports/
/spec/examples.txt
/test/tmp/
/test/version_tmp/
/tmp/

# Bundler
/.bundle
/vendor/bundle

# Database
/db/*.sqlite3
/db/*.sqlite3-journal
/db/*.sqlite3-shm
/db/*.sqlite3-wal

# Environment
.env
.env.local
.env.*.local

# Logs
/log/*
!/log/.keep

# Storage
/storage/*
!/storage/.keep

# Tmp
/tmp/*
!/tmp/.keep
!/tmp/pids/
/tmp/pids/*
!/tmp/pids/.keep

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
`;

    // 18. Makefile
    files['Makefile'] = `RAILS := bundle exec rails

.PHONY: setup server test console routes db-create db-migrate db-seed lint

setup:
\tbundle install
\t$(RAILS) db:create
\t$(RAILS) db:migrate

server:
\t$(RAILS) server

test:
\tbundle exec rspec

console:
\t$(RAILS) console

routes:
\t$(RAILS) routes

db-create:
\t$(RAILS) db:create

db-migrate:
\t$(RAILS) db:migrate

db-seed:
\t$(RAILS) db:seed

lint:
\tbundle exec rubocop
`;

    // 19. .rubocop.yml
    files['.rubocop.yml'] = `require:
  - rubocop-rails

AllCops:
  NewCops: enable
  TargetRubyVersion: 3.1
  Exclude:
    - "db/schema.rb"
    - "bin/*"
    - "vendor/**/*"

Style/Documentation:
  Enabled: false

Style/FrozenStringLiteralComment:
  Enabled: false

Metrics/BlockLength:
  Exclude:
    - "spec/**/*"
    - "config/routes.rb"
`;
  },
};
