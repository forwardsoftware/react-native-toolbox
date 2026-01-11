# React Native Toolbox - Copilot Instructions

## Project Overview

This is a **zero-dependencies CLI tool** (`rn-toolbox`) that automates React Native asset generation:
- **icons**: Generate app icons for iOS/Android from a source image (uses `sharp`)
- **splash**: Generate splashscreens for iOS/Android from a source image
- **dotenv**: Copy environment-specific `.env.{environment}` files to `.env`

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
├── types.ts          # TypeScript interfaces (SplashscreenSize, ContentJson)
└── utils/            # Shared utilities (file ops, colors, app.json parsing)
```

### Key Patterns

- **Commands extend `BaseCommand`** – use `config` object with `args`, `flags`, `description`, `examples`
- **Parallel processing** – iOS and Android generation runs concurrently via `Promise.all()`
- **Verbose logging** – commands support `-v` flag; use `this.logVerbose()` for debug output
- **App name resolution** – extracted from `app.json` via `extractAppName()` or provided via `--appName` flag
- **Console colors** – use `cyan()`, `green()`, `red()`, `yellow()` from `utils/color.utils.ts` (wraps `node:util.styleText`)
- **Node.js built-in parser** – uses `node:util.parseArgs()` (Node.js 18.3+)

### Adding a New Command

1. Create `src/commands/{name}.ts` extending `BaseCommand`
2. Define `config` object with `name`, `args`, `flags`, `description`, `examples`
3. Implement `execute(parsed: ParsedArgs)` method
4. Register command in `src/cli/runner.ts` command registry
5. Run `pnpm build` to compile TypeScript
6. Update README.md with command documentation

## Development Workflow

```bash
pnpm install          # Install dependencies
pnpm build            # Compile TypeScript to dist/
pnpm test             # Run Node.js test runner with coverage + lint
pnpm lint             # ESLint only
```

**Run locally during development:**
```bash
./bin/dev.js icons --appName MyApp
```

## Testing & Debugging

- Tests live in `test/commands/{command}.test.ts`
- Uses Node.js built-in `node:test` runner with `node:assert/strict`
- Use custom `runCommand()` helper from `test/helpers/run-command.ts`
- Tests create temporary `assets/`, `android/`, `ios/` directories - cleaned up in `after`/`afterEach` hooks
- Test assets stored in `test/assets/`

**Debugging approach:** Replicate unit test setup locally:
1. Create an `assets/` folder with test input files (e.g., copy from `test/assets/`)
2. Run command via `./bin/dev.js icons --appName TestApp`
3. Inspect generated `android/` and `ios/` directories
4. Clean up with `pnpm cleanup`

## Code Style

- **ESM modules** - use `.js` extensions in imports (e.g., `'../types.js'`)
- **Node.js 22.13.0+** required (uses `node:util.styleText`)
- **Prettier + TypeScript ESLint config** - run `pnpm lint` before committing
- **MPL-2.0 license headers** required on all source files

## File Structure Conventions

- Asset size definitions go in `constants.ts` (typed arrays of dimension configs)
- Shared types go in `types.ts`
- CLI-specific types go in `cli/types.ts`
- Platform-specific logic stays within command files (private methods prefixed with platform name)

## Sharp Image Processing Patterns

All image generation uses the `sharp` library. Follow these patterns for consistency:

**Simple resize (iOS icons, splashscreens):**
```typescript
await sharp(inputPath).resize(width, height, {fit: 'cover'}).toFile(outputPath)
```

**Resize with mask compositing (Android icons):**
```typescript
await sharp(inputPath)
  .resize(size)
  .composite([{ blend: 'dest-in', gravity: 'center', input: mask }])
  .toFile(outputPath)
```

**SVG masks for Android icons** - generated as `Buffer` from SVG strings:
- Circle mask: `<svg><circle cx="${r}" cy="${r}" r="${r}" /></svg>`
- Rounded corners (10% radius): `<svg><rect ... rx="${size * 0.1}" ry="${size * 0.1}"/></svg>`

See `getMask()` in `src/commands/icons.ts` for implementation.

## Exit Codes

```typescript
ExitCode.SUCCESS = 0           // Command completed successfully
ExitCode.GENERAL_ERROR = 1     // Unexpected runtime error
ExitCode.INVALID_ARGUMENT = 2  // Missing required arg, invalid flag value
ExitCode.FILE_NOT_FOUND = 3    // Source file doesn't exist
ExitCode.CONFIG_ERROR = 4      // app.json missing or invalid
ExitCode.GENERATION_ERROR = 5  // Image generation failed
```
