# React Native Toolbox - Copilot Instructions

## Project Overview

This is an **oclif-based CLI tool** (`rn-toolbox`) that automates React Native asset generation:
- **icons**: Generate app icons for iOS/Android from a source image (uses `sharp`)
- **splash**: Generate splashscreens for iOS/Android from a source image
- **dotenv**: Copy environment-specific `.env.{environment}` files to `.env`

## Architecture

```
src/
├── index.ts          # Re-exports @oclif/core run (entry point)
├── commands/         # oclif Command classes (one file per command)
├── constants.ts      # iOS/Android asset size definitions
├── types.ts          # TypeScript interfaces (SplashscreenSize, ContentJson)
└── utils/            # Shared utilities (file ops, colors, app.json parsing)
```

### Key Patterns

- **Commands extend `Command` from `@oclif/core`** – use static `args`, `flags`, `description`, `examples` properties
- **Parallel processing** – iOS and Android generation runs concurrently via `Promise.all()`
- **Verbose logging** – commands support `-v` flag; use `this.logVerbose()` for debug output
- **App name resolution** – extracted from `app.json` via `extractAppName()` or provided via `--appName` flag
- **Console colors** – use `cyan()`, `green()`, `red()`, `yellow()` from `utils/color.utils.ts` (wraps `node:util.styleText`)

### Adding a New Command

1. Create `src/commands/{name}.ts` extending `Command`
2. Define `static args`, `flags`, `description`, `examples`
3. Implement `run()` method
4. Run `pnpm build` then `oclif manifest` to update command registry

## Development Workflow

```bash
pnpm install          # Install dependencies
pnpm build            # Compile TypeScript to dist/
pnpm test             # Run Mocha tests + lint
pnpm lint             # ESLint only
```

**Run locally during development:**
```bash
./bin/dev.js icons --appName MyApp
```

## Testing & Debugging

- Tests live in `test/commands/{command}.test.ts`
- Use `@oclif/test` `runCommand()` helper
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
- **oclif + Prettier ESLint config** - run `pnpm lint` before committing
- **MPL-2.0 license headers** required on all source files

## File Structure Conventions

- Asset size definitions go in `constants.ts` (typed arrays of dimension configs)
- Shared types go in `types.ts`
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
