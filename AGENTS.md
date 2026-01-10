# AGENTS.md

A guide for AI coding agents working on the React Native Toolbox project.

## Project Overview

This is a **zero-dependencies CLI tool** (`rn-toolbox`) that automates React Native asset generation:
- **icons** - Generate app icons for iOS/Android from a source image (uses `sharp`)
- **splash** - Generate splashscreens for iOS/Android from a source image
- **dotenv** - Copy environment-specific `.env.{environment}` files to `.env`

## Setup Commands

```bash
pnpm install          # Install dependencies
pnpm build            # Compile TypeScript to dist/
pnpm test             # Run Mocha tests + lint
pnpm lint             # ESLint only
pnpm cleanup          # Remove generated android/, ios/, dist/, .env
```

## Running Locally

Use the development entry point during development:

```bash
./bin/dev.js icons --appName MyApp
./bin/dev.js splash --appName MyApp
./bin/dev.js dotenv development
```

## Testing Instructions

- Tests are located in `test/commands/{command}.test.ts`
- Run `pnpm test` to execute all tests with Mocha
- Run `pnpm lint` before committing to ensure ESLint passes
- Tests create temporary `assets/`, `android/`, `ios/` directories - cleaned up in `after`/`afterEach` hooks
- Test assets are stored in `test/assets/`

To run a specific test file:
```bash
pnpm mocha --forbid-only "test/commands/icons.test.ts"
```

## Code Style

- **ESM modules** - use `.js` extensions in imports (e.g., `'../types.js'`)
- **Node.js 22.13.0+** required (uses `node:util.styleText`)
- **Prettier + TypeScript ESLint config** - run `pnpm lint` before committing
- **MPL-2.0 license headers** required on all source files

### TypeScript Conventions

- Strict mode enabled
- All types go in `src/types.ts` (shared) or `src/cli/types.ts` (CLI-specific)
- Asset size definitions go in `src/constants.ts`

## Architecture

```
src/
├── index.ts          # Public API exports
├── cli/              # CLI infrastructure (zero-dependencies)
│   ├── errors.ts     # ExitCode enum, CommandError class
│   ├── help.ts       # Help text generation
│   ├── output.ts     # Console output utilities
│   ├── parser.ts     # Argument parser (uses node:util.parseArgs)
│   ├── runner.ts     # Main CLI entry point & command router
│   └── types.ts      # CLI type definitions
├── commands/         # Command implementations
│   ├── base.ts       # BaseCommand abstract class
│   ├── dotenv.ts     # Dotenv command
│   ├── icons.ts      # Icons command
│   └── splash.ts     # Splash command
├── constants.ts      # iOS/Android asset size definitions
├── types.ts          # TypeScript interfaces
└── utils/            # Shared utilities (file ops, colors, app.json)
```

### Key Patterns

- **Commands extend `BaseCommand`** - use `config` object with `args`, `flags`, `description`, `examples`
- **Parallel processing** - iOS and Android generation runs concurrently via `Promise.all()`
- **Verbose logging** - commands support `-v` flag; use `this.logVerbose()` for debug output
- **App name resolution** - extracted from `app.json` via `extractAppName()` or provided via `--appName` flag
- **Console colors** - use `cyan()`, `green()`, `red()`, `yellow()` from `utils/color.utils.ts`

## Adding a New Command

1. Create `src/commands/{name}.ts` extending `BaseCommand`
2. Define `config` object with `name`, `args`, `flags`, `description`, `examples`
3. Implement `execute(parsed: ParsedArgs)` method
4. Register command in `src/cli/runner.ts` command registry
5. Run `pnpm build` to compile TypeScript
6. Add tests in `test/commands/{name}.test.ts`
7. Update README.md with command documentation

## Exit Codes

| Code | Constant | Meaning |
|------|----------|---------|
| 0 | `ExitCode.SUCCESS` | Command completed successfully |
| 1 | `ExitCode.GENERAL_ERROR` | Unexpected runtime error |
| 2 | `ExitCode.INVALID_ARGUMENT` | Missing required arg, invalid flag value |
| 3 | `ExitCode.FILE_NOT_FOUND` | Source file doesn't exist |
| 4 | `ExitCode.CONFIG_ERROR` | app.json missing or invalid |
| 5 | `ExitCode.GENERATION_ERROR` | Image generation failed |

## Sharp Image Processing

All image generation uses the `sharp` library:

```typescript
// Simple resize (iOS icons, splashscreens)
await sharp(inputPath).resize(width, height, {fit: 'cover'}).toFile(outputPath)

// Resize with mask compositing (Android icons)
await sharp(inputPath)
  .resize(size)
  .composite([{ blend: 'dest-in', gravity: 'center', input: mask }])
  .toFile(outputPath)
```

## PR Guidelines

- Run `pnpm lint` and `pnpm test` before committing
- Ensure all tests pass
- Add or update tests for any code changes
- Follow existing code patterns and conventions
