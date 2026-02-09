/**
 * Ruby Gem Strategy
 *
 * Generates Ruby gem library packages for RubyGems.
 */

import type { GenerationStrategy } from '../../types.js';

/**
 * Ruby gem strategy
 */
export const RubyGemStrategy: GenerationStrategy = {
  id: 'library-ruby',
  name: 'Ruby Gem',
  priority: 10,

  matches: stack => stack.archetype === 'library' && stack.language === 'ruby',

  apply: async ({ files, projectName }) => {
    const gemName = projectName.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    const modName = gemName
      .split(/[-_]/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join('');
    const reqName = gemName.replace(/-/g, '/');

    // gemspec
    files[`${gemName}.gemspec`] = `# frozen_string_literal: true

Gem::Specification.new do |spec|
  spec.name          = "${gemName}"
  spec.version       = ${modName}::VERSION
  spec.authors       = ["Author"]
  spec.email         = ["author@example.com"]

  spec.summary       = "${projectName} library"
  spec.description   = "${projectName} library"
  spec.homepage      = "https://github.com/example/${gemName}"
  spec.license       = "MIT"
  spec.required_ruby_version = ">= 3.1.0"

  spec.files = Dir["lib/**/*", "LICENSE", "README.md"]
  spec.require_paths = ["lib"]
end
`;

    // lib entry
    files[`lib/${reqName}.rb`] = `# frozen_string_literal: true

require_relative "${gemName}/version"

module ${modName}
  # Generate a greeting message.
  #
  # @param name [String] the name to greet
  # @param greeting [String] the greeting prefix
  # @return [String] the greeting message
  def self.greet(name, greeting: "Hello")
    "#{greeting}, #{name}!"
  end

  # Add two numbers.
  #
  # @param a [Numeric] first number
  # @param b [Numeric] second number
  # @return [Numeric] the sum
  def self.add(a, b)
    a + b
  end
end
`;

    // version
    files[`lib/${gemName}/version.rb`] = `# frozen_string_literal: true

module ${modName}
  VERSION = "0.1.0"
end
`;

    // Gemfile
    files['Gemfile'] = `source "https://rubygems.org"

gemspec

group :development, :test do
  gem "rspec", "~> 3.13"
  gem "rubocop", require: false
end
`;

    // Rakefile
    files['Rakefile'] = `require "rspec/core/rake_task"

RSpec::Core::RakeTask.new(:spec)

task default: :spec
`;

    // Tests
    files[`spec/${gemName}_spec.rb`] = `require "${reqName}"

RSpec.describe ${modName} do
  describe ".greet" do
    it "greets with default greeting" do
      expect(${modName}.greet("World")).to eq("Hello, World!")
    end

    it "greets with custom greeting" do
      expect(${modName}.greet("World", greeting: "Hi")).to eq("Hi, World!")
    end
  end

  describe ".add" do
    it "adds two numbers" do
      expect(${modName}.add(1, 2)).to eq(3)
    end
  end
end
`;

    files['spec/spec_helper.rb'] = `RSpec.configure do |config|
  config.expect_with :rspec do |expectations|
    expectations.include_chain_clauses_in_custom_matcher_descriptions = true
  end
end
`;

    // .gitignore
    files['.gitignore'] = `*.gem
.bundle/
pkg/
tmp/
Gemfile.lock
`;

    // Makefile
    files['Makefile'] = `.PHONY: install test lint build publish clean

install:
\tbundle install

test:
\tbundle exec rspec

lint:
\tbundle exec rubocop

build:
\tgem build ${gemName}.gemspec

publish: build
\tgem push ${gemName}-*.gem

clean:
\trm -f ${gemName}-*.gem
`;
  },
};
