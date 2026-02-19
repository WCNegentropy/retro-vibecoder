# Retro Vibecoder UPG - CLI Assessment

**Date**: 2026-02-10 (initial), 2026-02-17 (updated)
**Assessed by**: Claude, as an AI agent actually using the tool
**Method**: Full install, build, CLI exploration, and scaffolding a real project

---

## What Is It?

Retro Vibecoder UPG (Universal Procedural Generator) is a deterministic project scaffolding engine. Given a seed number, it generates a complete project with a specific tech stack selected from a "Universal Matrix" of archetypes, languages, frameworks, databases, and runtimes. It uses Mulberry32 seeded RNG so the same seed always produces the same project.

It also supports declarative YAML manifest templates (Nunjucks-based) for more traditional template-driven generation.

---

## Build & Install Experience

| Step | Result | Notes |
|------|--------|-------|
| `pnpm install` | Clean in ~11s | No issues |
| `pnpm run build` | All 5 packages in ~22s | Zero errors, zero warnings |
| `pnpm run test` | 30/30 tests pass | Tests across shared, procedural, and cli packages |

**Verdict**: Flawless build pipeline. Turbo caching works well. The monorepo structure (shared → core/procedural → cli/desktop) is clean and well-layered.

---

## CLI Usability Assessment

### Commands Tested

| Command | Works | Quality |
|---------|-------|---------|
| `upg seed <n>` | Yes | Generates full project to disk with elapsed time and language-aware "Next steps" |
| `upg preview <n>` | Yes | Clean JSON output, good for piping |
| `upg sweep` | Yes | Batch generation with good summary stats |
| `upg validate <manifest>` | Yes | Clear output with actionable warnings and contextual error guidance |
| `upg generate [template]` | Yes | Template-based generation with `--use-defaults` and `--json` output |
| `upg search <query>` | Yes | Registry search with spinner, `--format json` support |
| `upg init` | Yes | Manifest initialization with `--json` output |
| `upg --help` | Yes | ✅ Fixed — displays examples and full command list |
| `upg` (no args) | Yes | ✅ Fixed — shows help output |

---

## Real-World Scaffolding Test

### Scenario

I built a **CLI task manager** ("taskr") with SQLite persistence. This is a simple-medium complexity project that normally requires scaffolding:
- TypeScript + ESM configuration
- Commander.js CLI framework
- tsup build pipeline with shebang
- Vitest testing setup
- Package.json with bin field
- tsconfig.json with modern settings
- Dockerfile, CI/CD, Makefile, .gitignore, LICENSE

### What UPG Gave Me (1 command)

```bash
upg seed 6 --archetype cli --language typescript -o /tmp/upg-test/task-cli
```

**15 files generated** including:
- `package.json` with commander, tsup, vitest, TypeScript, prettier
- `tsconfig.json` with ES2022, strict, bundler resolution
- `tsup.config.ts` with `#!/usr/bin/env node` shebang banner
- `src/index.ts` with commander already wired up using a clean subcommand pattern
- `src/commands/hello.ts` showing the command pattern to follow
- `Makefile` with build/test/lint/clean/install-global targets
- `Dockerfile` with multi-stage build
- `.github/workflows/ci.yml` with full lint/typecheck/test/build pipeline
- `.gitignore`, `LICENSE`, `README.md`

### What I Added (the actual custom logic)

- `src/db.ts` - SQLite connection + schema (new file)
- `src/commands/add.ts` - Add task command
- `src/commands/list.ts` - List/filter tasks
- `src/commands/done.ts` - Mark task done
- `src/commands/remove.ts` - Delete task
- Updated `package.json` to add `better-sqlite3`
- Updated `src/index.ts` to register new commands

### Result

Built on first try with `npx tsup`. All commands worked perfectly. The scaffold's command pattern (`helloCommand(program)`) was trivial to replicate for my own commands.

### Token Savings Estimate

| Task | Without UPG (estimated tokens) | With UPG |
|------|-------------------------------|----------|
| package.json setup | ~400 tokens | 0 (generated) |
| tsconfig.json | ~200 tokens | 0 (generated) |
| tsup.config.ts | ~150 tokens | 0 (generated) |
| CLI boilerplate (commander setup) | ~300 tokens | 0 (generated) |
| Command pattern scaffold | ~200 tokens | 0 (generated, hello.ts as example) |
| Dockerfile | ~400 tokens | 0 (generated) |
| CI/CD workflow | ~500 tokens | 0 (generated) |
| Makefile | ~200 tokens | 0 (generated) |
| .gitignore, LICENSE, README | ~300 tokens | 0 (generated) |
| **Total boilerplate** | **~2,650 tokens** | **1 CLI command (~50 tokens)** |
| Custom logic (db, commands) | ~1,200 tokens | ~1,200 tokens |
| **Grand total** | **~3,850 tokens** | **~1,250 tokens** |

**Estimated savings: ~67% fewer tokens** for this project type.

---

## Pass 2 Enrichment Engine

### Overview

The Pass 2 Enrichment Engine is a second-pass enhancement pipeline that runs after initial project generation. It uses the same deterministic RNG (forked via `rng.fork()`) to enhance projects with production-ready features.

### Enrichment Categories

| Category    | Strategies                              | Purpose                                                     |
|-------------|----------------------------------------|-------------------------------------------------------------|
| **CI/CD**   | GitHub Actions, GitLab CI, Release      | Enhanced workflows with caching, matrix testing, security   |
| **Quality** | Linting, Environment Files              | ESLint/Ruff/clippy configs, `.env.example`, `.editorconfig` |
| **Logic**   | API Routes, CLI Commands, Models, Middleware, Web Components | Real CRUD implementations, ORM models |
| **Testing** | Unit Tests, Integration Tests, Test Config | Framework-specific test generation                       |
| **DevOps**  | Docker Production, Docker Compose       | Multi-stage builds, health checks, compose enrichment       |
| **Docs**    | README Enrichment                       | Setup instructions, badges, project structure overview      |

### CLI Integration

```bash
# Standard enrichment
upg seed 42 --enrich --archetype backend --language typescript -o ./my-app

# Full enrichment depth
upg seed 42 --enrich --enrich-depth full -o ./my-app

# Selective enrichment (disable specific strategies)
upg seed 42 --enrich --no-enrich-tests --no-enrich-docker-prod -o ./my-app
```

### Desktop UI Integration

- **EnrichmentPanel** component with master toggle, depth presets, and individual strategy toggles
- Integrated into SeedGeneratorPage and StackComposerPage (as wizard step 5 of 6)
- **Preview.tsx** shows Pass 2 diff highlighting (green for added files, yellow for modified)
- **SettingsPage** includes default enrichment preferences
- **CLICommandsPage** documents all enrichment flags

---

## Code Quality of Generated Output

### Strengths

1. **Modern defaults**: ES2022 target, ESM modules, bundler resolution, strict mode
2. **Working build pipeline**: tsup with shebang, vitest for testing, proper scripts
3. **Good command pattern**: The `helloCommand(program: Command)` pattern is clean and extensible
4. **Production-ready ops files**: Docker multi-stage build, CI/CD, Makefile are all reasonable
5. **Correct bin field**: The `"bin"` entry in package.json is set up correctly for CLI tools
6. **Breadth across ecosystems**: React/Vite, NestJS, FastAPI+SQLAlchemy, Rust+Axum, Phaser game - all generate real, framework-idiomatic code

### Issues Found

1. **Stack-file mismatch for DB/ORM**: Seed 6 selected `prisma + sqlite` in the stack but generated zero Prisma files (no `schema.prisma`, no `@prisma/client` dep). The stack metadata promises more than the code delivers.

2. ~~**Random project names**: No way to pass a custom project name via CLI flags.~~ ✅ **Fixed** — `--name` flag added to `seed` command.

3. ~~**`--help` produces no output**: Critical UX bug.~~ ✅ **Fixed** — Help text now renders with examples and full command listing.

4. **`generate --use-defaults` leaks environment variables**: The dry-run output dumps the entire `process.env` into the variables output, including proxy tokens and internal URLs. Not a security vulnerability per se (it's only shown in dry-run), but it's messy and alarming.

5. **Some inconsistencies in the generated code**:
   - NestJS project (seed 100) stack says `typeorm + sqlite` but the generated `app.module.ts` has no TypeORM imports.

6. **No ESLint config in CLI projects**: The package.json has a `lint` script that runs `eslint src/` but there's no `.eslintrc` or `eslint.config.js` generated.

7. ~~**Missing test for edge cases**: `upg seed 0` and `upg seed -1` should produce clear errors.~~ ✅ **Fixed** — `parseSeed()` rejects `< 1` with clear error messages. Negative numbers are caught and produce helpful hints.

---

## Ratings

| Category | Score (1-10) | Notes |
|----------|-------------|-------|
| **Build/Install** | 9 | Flawless monorepo build |
| **CLI UX** | 8 | Help text with examples, contextual error guidance, JSON output flags |
| **Code Quality (generated)** | 7 | Modern, idiomatic, but stack-file gaps remain for DB/ORM |
| **Breadth/Coverage** | 9 | 7 archetypes × 12 languages × 30+ frameworks |
| **Token Savings for AI** | 8 | ~67% reduction for typical scaffolding tasks |
| **Architecture** | 9 | Clean separation, constraint solver, seeded RNG, manifest system |
| **Documentation** | 8 | Good docs, JSDoc enriched, package READMEs present |
| **Testing** | 7 | 389 tests across shared, procedural, cli, and enrichment packages |

**Overall: 8/10** — A well-architected tool with genuine utility for AI-assisted development. Recent CLI improvements (Phase 1–5) added JSON output flags, contextual error guidance, language-aware "Next steps", improved help text, and better output formatting. The main remaining gaps are in generated code completeness (DB/ORM file generation) and broader test coverage.

---

## Recommendations for Next Iteration

### High Priority
1. ~~**Fix `--help` output**~~ ✅ Fixed — help text renders with examples
2. **Wire up DB/ORM in generated code** — If the stack says `prisma + sqlite`, the generated files should include `schema.prisma`, Prisma client setup, and the dep in `package.json`
3. ~~**Add `--name` flag to `seed` command**~~ ✅ Fixed — `-n, --name <name>` flag added
4. ~~**Fix constraint solver** — Prevent combinations like `cli + express`~~ ✅ Fixed — constraint validation added with suggestions

### Medium Priority
5. **Add unit tests for core package** — Currently has no test files
6. **Fix env variable leak in `generate --use-defaults`** — Filter out `process.env` from template variables or at least from output
7. **Generate ESLint config** for projects that have a `lint` script
   ✅ **Pass 2 Enrichment Engine** — 16 enrichment strategies across 6 categories implemented with CLI flags, desktop UI, and deterministic RNG forking
8. **Add `--eslint`, `--prettier`, `--testing` flags** to `seed` command for more control

### Low Priority
9. **Template gallery** — More built-in templates beyond react-starter and python-api
10. **`upg inspect <seed>`** — A human-friendly preview (not JSON) showing the stack and file tree
11. ~~**Post-generation hooks** — Auto-run `npm install` or `cargo build` after generation~~ ✅ Partially addressed — language-aware "Next steps" guidance now shown after seed/generate writes to disk
