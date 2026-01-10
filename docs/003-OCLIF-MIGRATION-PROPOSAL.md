# Proposal: Migrate from oclif to Zero-Dependencies CLI

**Status**: Completed ✅  
**Date**: January 7, 2026  
**Author**: Architecture Review  
**Approved**: January 7, 2026  
**Completed**: January 11, 2026  

---

## Executive Summary

This proposal outlines the migration of `rn-toolbox` from the oclif framework to a zero-dependencies approach using Node.js built-in APIs. The migration aims to reduce bundle size, eliminate framework lock-in, and simplify the codebase while maintaining full backward compatibility with the existing CLI interface.

---

## Current State Analysis

### oclif Dependencies

| Package | Type | Purpose |
|---------|------|---------|
| `@oclif/core` | Runtime | Command framework, arg parsing, help |
| `@oclif/plugin-help` | Runtime | Help command and flag |
| `@oclif/test` | Dev | Test utilities (`runCommand()`) |
| `@oclif/prettier-config` | Dev | Code formatting config |
| `oclif` | Dev | CLI tooling (manifest, readme gen) |

### oclif Features Currently Used

| Feature | Usage Location | Replacement Strategy |
|---------|----------------|---------------------|
| `Command` base class | All commands | Custom `BaseCommand` class |
| `Args.string()` | icons, splash, dotenv | `node:util.parseArgs()` positionals |
| `Flags.string()` | icons, splash | `node:util.parseArgs()` options |
| `Flags.boolean()` | All commands (`-v`) | `node:util.parseArgs()` options |
| `Flags.help()` | All commands (`-h`) | Custom help handler |
| `this.parse()` | All commands | Custom `parseArgs()` wrapper |
| `this.log()` | All commands | `console.log()` wrapper |
| `this.warn()` | icons, splash | `console.warn()` wrapper |
| `this.error()` | All commands | Custom `CommandError` + `process.exit()` |
| `runCommand()` | All tests | Custom test helper |

### Commands Inventory

| Command | Args | Flags | Complexity |
|---------|------|-------|------------|
| `dotenv` | `environmentName` (required) | `-h`, `-v` | Low |
| `icons` | `file` (optional, default) | `-a`, `-h`, `-v` | Medium |
| `splash` | `file` (optional, default) | `-a`, `-h`, `-v` | Medium |

### Global CLI Features

| Feature | Current Behavior | Replacement |
|---------|------------------|-------------|
| `rn-toolbox --help` | Shows all commands | Custom global help |
| `rn-toolbox --version` | Shows version info | Read from package.json |
| `rn-toolbox <unknown>` | Error with suggestions | Error with available commands |
| No command provided | Shows help | Show global help |

---

## Design Decisions

### DD-1: Argument Parser

**Decision**: Use `node:util.parseArgs()` (built-in since Node.js 18.3+)

**Rationale**:
- Zero external dependencies
- Battle-tested implementation
- Supports all required features (positionals, options, short flags)
- Project already requires Node.js 22.13+

**Example**:
```typescript
import { parseArgs } from 'node:util'

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    appName: { type: 'string', short: 'a' },
    verbose: { type: 'boolean', short: 'v' },
    help: { type: 'boolean', short: 'h' },
  },
  allowPositionals: true,
})
```

---

### DD-2: Exit Codes

**Decision**: Define explicit exit codes for each error category

**Specification**:

```typescript
export const ExitCode = {
  SUCCESS: 0,           // Command completed successfully
  GENERAL_ERROR: 1,     // Unexpected runtime error
  INVALID_ARGUMENT: 2,  // Missing required arg, invalid flag value
  FILE_NOT_FOUND: 3,    // Source file doesn't exist
  CONFIG_ERROR: 4,      // app.json missing or invalid
  GENERATION_ERROR: 5,  // Image generation failed
} as const

export type ExitCode = typeof ExitCode[keyof typeof ExitCode]
```

**Usage in Commands**:
```typescript
if (!sourceFileExists) {
  throw new CommandError(
    `Source file ${cyan(args.file)} not found!`,
    ExitCode.FILE_NOT_FOUND
  )
}
```

---

### DD-3: Help Output Format

**Decision**: Maintain oclif-parity help format

**Template**:
```
<description>

USAGE
  $ rn-toolbox <command> [ARGS] [FLAGS]

ARGUMENTS
  ARG  [default: value] Description

FLAGS
  -s, --flag=<value>  Description
  -b, --boolean       Description

EXAMPLES
  $ rn-toolbox command
```

**Implementation**: Custom `generateHelp()` function that reads command metadata and formats output.

---

### DD-4: Lazy Default Resolution

**Decision**: Support function defaults in flag configuration

**Rationale**: Current `extractAppName` is used as a lazy default for `--appName`. This must continue to work (only called if flag not provided).

**Implementation**:
```typescript
interface FlagConfig {
  type: 'string' | 'boolean'
  short?: string
  default?: string | boolean | (() => string | undefined)
  description?: string
}

// In parser:
function resolveDefault(config: FlagConfig): string | boolean | undefined {
  if (typeof config.default === 'function') {
    return config.default()
  }
  return config.default
}
```

---

### DD-5: CLI Interface

**Decision**: Maintain exact same CLI interface (no breaking changes)

**Current Interface**:
```bash
# dotenv
rn-toolbox dotenv <environmentName> [-v] [-h]

# icons
rn-toolbox icons [file] [-a <appName>] [-v] [-h]

# splash  
rn-toolbox splash [file] [-a <appName>] [-v] [-h]
```

**Validation**: E2E tests will verify interface compatibility.

---

### DD-6: Test Strategy

**Decision**: Two-tier testing approach

| Tier | Type | Implementation | Priority |
|------|------|----------------|----------|
| 1 | Integration | Import and call commands directly | Must Have |
| 2 | E2E | Spawn CLI subprocess | Nice to Have |

**Integration Test Helper**:
```typescript
// test/helpers/run-command.ts
interface CommandResult {
  stdout: string
  stderr: string
  error?: CommandError
}

async function runCommand(
  CommandClass: typeof BaseCommand,
  args: string[]
): Promise<CommandResult>
```

**E2E Test Helper** (future):
```typescript
// test/helpers/run-cli.ts
async function runCLI(args: string[]): Promise<{
  stdout: string
  stderr: string
  exitCode: number
}>
```

---

## Migration Plan

### Phase 1: Foundation ✅ COMPLETE

Create the CLI infrastructure without modifying existing commands.

#### 1.1 Create `src/cli/errors.ts` ✅

```typescript
/*
 * Copyright (c) 2025 ForWarD Software
 * MPL-2.0 License
 */

export const ExitCode = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  INVALID_ARGUMENT: 2,
  FILE_NOT_FOUND: 3,
  CONFIG_ERROR: 4,
  GENERATION_ERROR: 5,
} as const

export type ExitCodeValue = typeof ExitCode[keyof typeof ExitCode]

export class CommandError extends Error {
  constructor(
    message: string,
    public readonly exitCode: ExitCodeValue = ExitCode.GENERAL_ERROR
  ) {
    super(message)
    this.name = 'CommandError'
  }
}
```

#### 1.2 Create `src/cli/output.ts` ✅

Console output utilities with color support.

```typescript
export function log(message: string): void
export function warn(message: string): void
export function error(message: string, exitCode?: ExitCodeValue): never
export function logVerbose(message: string, isVerbose: boolean): void
```

#### 1.3 Create `src/cli/parser.ts` ✅

Wrapper around `node:util.parseArgs()` with:
- Positional args with defaults
- Flag definitions with lazy defaults
- Help flag interception
- Validation

#### 1.4 Create `src/cli/help.ts` ✅

Help text generator:
- `generateCommandHelp(commandConfig)` — single command help
- `generateGlobalHelp()` — list all commands

#### 1.5 Create `src/cli/runner.ts` ✅

Command router:
- Parse first arg as command name
- Route to appropriate command
- Handle global `--help` and `--version`
- Handle unknown commands with helpful error

---

### DD-7: Version Flag

**Decision**: Support `--version` / `-V` flag at global level

**Implementation**:
- Read version from `package.json` at runtime
- Display format: `rn-toolbox/5.0.1 node-v22.13.0 darwin-arm64`

**Rationale**: oclif provides this automatically; users may rely on it for scripting.

---

### Phase 2: Command Migration ✅ COMPLETE

Migrate commands one at a time, starting with the simplest.

#### 2.1 Update `src/commands/base.ts` ✅

New base command class without oclif:

```typescript
export interface CommandConfig {
  name: string
  description: string
  args: ArgConfig[]
  flags: Record<string, FlagConfig>
  examples: string[]
}

export abstract class BaseCommand {
  protected isVerbose = false
  
  abstract readonly config: CommandConfig
  abstract execute(args: ParsedArgs): Promise<void>
  
  async run(argv: string[]): Promise<void> {
    const parsed = parseArgs(argv, this.config)
    if (parsed.flags.help) {
      showHelp(this.config)
      return
    }
    this.isVerbose = parsed.flags.verbose as boolean
    await this.execute(parsed)
  }
  
  protected log(message: string): void
  protected warn(message: string): void
  protected error(message: string, exitCode?: ExitCodeValue): never
  protected logVerbose(message: string): void
}
```

#### 2.2 Migrate `dotenv` Command ✅

**Why first**: Simplest command, no image processing, validates approach.

**Changes**:
- Remove `@oclif/core` imports
- Replace static properties with `config` object
- Replace `this.parse()` with new parser
- Update error handling to use `CommandError`

#### 2.3 Migrate `icons` Command ✅

**Changes**:
- Same structural changes as dotenv
- Ensure lazy `extractAppName` still works
- Preserve parallel iOS/Android generation

#### 2.4 Migrate `splash` Command ✅

**Changes**:
- Same structural changes as icons

---

### Phase 3: Test Infrastructure ✅ COMPLETE

#### 3.1 Create `test/helpers/run-command.ts` ✅

```typescript
import { BaseCommand } from '../../src/commands/base.js'
import { CommandError } from '../../src/cli/errors.js'

interface CommandResult {
  stdout: string
  stderr: string
  error?: CommandError
}

export async function runCommand(
  CommandClass: new () => BaseCommand,
  args: string[]
): Promise<CommandResult> {
  const stdout: string[] = []
  const stderr: string[] = []
  
  // Capture console output
  const originalLog = console.log
  const originalError = console.error
  const originalWarn = console.warn
  
  console.log = (...args) => stdout.push(args.join(' '))
  console.warn = (...args) => stderr.push(args.join(' '))
  console.error = (...args) => stderr.push(args.join(' '))
  
  let error: CommandError | undefined
  
  try {
    const command = new CommandClass()
    await command.run(args)
  } catch (e) {
    if (e instanceof CommandError) {
      error = e
    } else {
      throw e
    }
  } finally {
    console.log = originalLog
    console.warn = originalWarn
    console.error = originalError
  }
  
  return {
    stdout: stdout.join('\n'),
    stderr: stderr.join('\n'),
    error,
  }
}
```

#### 3.2 Update Test Files ✅

**Before** (oclif):
```typescript
import { runCommand } from '@oclif/test'

it('runs icons', async () => {
  const { stdout, error } = await runCommand(['icons', '--appName', 'test'])
  expect(error?.oclif?.exit).to.equal(2)
})
```

**After** (custom):
```typescript
import { runCommand } from '../helpers/run-command.js'
import Icons from '../../src/commands/icons.js'
import { ExitCode } from '../../src/cli/errors.js'

it('runs icons', async () => {
  const { stdout, error } = await runCommand(Icons, ['--appName', 'test'])
  expect(error?.exitCode).to.equal(ExitCode.CONFIG_ERROR)
})
```

---

### Phase 4: Cleanup & Documentation ✅ COMPLETE

#### 4.1 Update Entry Points ✅

**bin/run.js**:
```javascript
#!/usr/bin/env node
import { runCLI } from '../dist/cli/runner.js'

await runCLI(process.argv.slice(2))
```

**bin/dev.js**:
```javascript
#!/usr/bin/env node
import { register } from 'node:module'
register('ts-node/esm', import.meta.url)

const { runCLI } = await import('../src/cli/runner.js')
await runCLI(process.argv.slice(2))
```

#### 4.2 Update `package.json` ✅

**Remove**:
```json
{
  "dependencies": {
    "@oclif/core": "^4.5.2",
    "@oclif/plugin-help": "^6.2.32"
  },
  "devDependencies": {
    "@oclif/prettier-config": "^0.2.1",
    "@oclif/test": "^4",
    "oclif": "^4.22.6"
  },
  "oclif": { ... }
}
```

**Update scripts**:
```json
{
  "scripts": {
    "cleanup": "rimraf android/ ios/ dist/ .nyc_output/ .env",
    "build": "rimraf dist && tsc -b",
    "prepack": "pnpm build",
    "test": "mocha --forbid-only \"test/**/*.test.ts\"",
    "posttest": "pnpm run lint"
  }
}
```

**Remove from files array**:
```json
{
  "files": [
    "./bin",
    "./dist"
  ]
}
```

**Update ESLint config** (`eslint.config.mjs`):
- Remove `eslint-config-oclif` import
- Keep `eslint-config-prettier` and standard TypeScript rules
```

#### 4.3 Update `src/index.ts` ✅

```typescript
// Public API exports
export { runCLI } from './cli/runner.js'
export { BaseCommand } from './commands/base.js'
export { ExitCode, CommandError } from './cli/errors.js'

// Command exports
export { default as Icons } from './commands/icons.js'
export { default as Splash } from './commands/splash.js'
export { default as Dotenv } from './commands/dotenv.js'
```

#### 4.4 Create README Maintenance Guide ✅

See [Appendix A: README Maintenance Guide](#appendix-a-readme-maintenance-guide).

---

## File Structure After Migration

```
src/
├── cli/
│   ├── errors.ts       # ExitCode enum, CommandError class
│   ├── help.ts         # generateCommandHelp(), generateGlobalHelp()
│   ├── output.ts       # log(), warn(), error(), logVerbose()
│   ├── parser.ts       # parseArgs() wrapper
│   ├── runner.ts       # runCLI() entry point
│   └── types.ts        # CLI-specific types (ArgConfig, FlagConfig, etc.)
├── commands/
│   ├── base.ts         # BaseCommand class (no oclif)
│   ├── dotenv.ts       # Migrated
│   ├── icons.ts        # Migrated
│   └── splash.ts       # Migrated
├── constants.ts        # Unchanged
├── index.ts            # Updated exports
├── types.ts            # Unchanged
└── utils/              # Unchanged
    ├── app.utils.ts
    ├── color.utils.ts
    └── file-utils.ts

test/
├── helpers/
│   └── run-command.ts  # Integration test helper
├── commands/
│   ├── dotenv.test.ts  # Updated
│   ├── icons.test.ts   # Updated
│   └── splash.test.ts  # Updated
└── ...
```

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Arg parsing edge cases | Low | Medium | Use battle-tested `node:util.parseArgs()` |
| Help output differences | Medium | Low | Compare with snapshot tests |
| Breaking CLI interface | Low | High | Maintain exact same args/flags |
| Test migration issues | Medium | Medium | Migrate tests incrementally |
| Missing oclif features | Low | Medium | Audit all oclif usage upfront |
| ESLint config dependency | Low | Low | Replace `eslint-config-oclif` with standard config |

---

## Effort Estimation

| Phase | Tasks | Estimated Hours |
|-------|-------|-----------------|
| Phase 1 | Foundation (6 files) | 3-4 hours |
| Phase 2 | Command migration (4 files) | 2-3 hours |
| Phase 3 | Test infrastructure (4 files) | 2-3 hours |
| Phase 4 | Cleanup & docs | 1-2 hours |
| **Total** | | **8-12 hours** |

---

## Rollback Plan

If critical issues are discovered after migration:

1. **Git revert**: All changes will be in a single PR/branch, allowing easy revert
2. **Version pinning**: Users can pin to last oclif-based version (5.0.x)
3. **Parallel maintenance**: If needed, maintain both versions temporarily

**Recommendation**: Tag the last oclif version as `v5.0.1-oclif` before merging migration.

---

## Success Criteria

- [x] All existing tests pass
- [x] CLI interface unchanged (`rn-toolbox icons`, `splash`, `dotenv`)
- [x] Help output matches oclif format
- [x] Exit codes work correctly
- [x] No oclif packages in `dependencies`
- [x] No oclif packages in `devDependencies`
- [x] Bundle size reduced (sharp is now the only runtime dependency)
- [x] README updated with accurate command docs
- [x] `--version` flag works (shows package version)
- [x] Unknown command shows helpful error message

---

## Appendix A: README Maintenance Guide

### Overview

With oclif removed, the README command documentation must be maintained manually. This guide explains how to keep it up to date.

### When to Update README

Update the README when:
- Adding a new command
- Adding/removing/modifying flags or arguments
- Changing default values
- Updating command descriptions or examples

### README Command Documentation Format

Each command should be documented in this format:

```markdown
### `rn-toolbox <command>`

<description>

**Usage:**
\`\`\`bash
rn-toolbox <command> [ARGS] [FLAGS]
\`\`\`

**Arguments:**
| Argument | Description | Default |
|----------|-------------|---------|
| `ARG` | Description | `value` |

**Flags:**
| Flag | Short | Description |
|------|-------|-------------|
| `--flag` | `-f` | Description |

**Examples:**
\`\`\`bash
rn-toolbox command arg --flag value
\`\`\`
```

### Keeping Docs in Sync

1. **Source of Truth**: The command's `config` object is the source of truth
2. **Review Process**: PRs that modify commands should update README
3. **CI Check** (optional): Could add a script to validate docs match config

### Example: Documenting the `icons` Command

```markdown
### `rn-toolbox icons`

Generate app icons using a file as template.

The template icon file should be at least 1024x1024px.

**Usage:**
\`\`\`bash
rn-toolbox icons [FILE] [-a <value>] [-v] [-h]
\`\`\`

**Arguments:**
| Argument | Description | Default |
|----------|-------------|---------|
| `FILE` | Input icon file | `./assets/icon.png` |

**Flags:**
| Flag | Short | Description |
|------|-------|-------------|
| `--appName` | `-a` | App name for output path. Default from `app.json` |
| `--verbose` | `-v` | Print detailed log messages |
| `--help` | `-h` | Show help |

**Examples:**
\`\`\`bash
# Use default icon location
rn-toolbox icons

# Specify custom icon file
rn-toolbox icons ./my-icon.png --appName MyApp

# Verbose output
rn-toolbox icons -v
\`\`\`
```

### Future Enhancement: Auto-Generation Script

Consider creating a script that generates README sections from command configs:

```bash
pnpm run docs:generate
```

This could read each command's `config` object and output Markdown. Implementation deferred to future work.

---

## Appendix B: E2E Test Implementation (Nice to Have)

### Overview

E2E tests spawn the actual CLI binary and verify end-to-end behavior.

### Implementation

```typescript
// test/helpers/run-cli.ts
import { spawn } from 'node:child_process'
import { join } from 'node:path'

interface CLIResult {
  stdout: string
  stderr: string
  exitCode: number
}

export function runCLI(args: string[]): Promise<CLIResult> {
  return new Promise((resolve, reject) => {
    const binPath = join(__dirname, '../../bin/run.js')
    const child = spawn('node', [binPath, ...args], {
      env: { ...process.env, NO_COLOR: '1' },
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data) => { stdout += data })
    child.stderr.on('data', (data) => { stderr += data })

    child.on('close', (exitCode) => {
      resolve({ stdout, stderr, exitCode: exitCode ?? 0 })
    })

    child.on('error', reject)
  })
}
```

### Usage

```typescript
import { runCLI } from '../helpers/run-cli.js'
import { ExitCode } from '../../src/cli/errors.js'

describe('CLI E2E', () => {
  it('shows help with --help flag', async () => {
    const { stdout, exitCode } = await runCLI(['--help'])
    
    expect(exitCode).to.equal(ExitCode.SUCCESS)
    expect(stdout).to.contain('rn-toolbox')
    expect(stdout).to.contain('icons')
    expect(stdout).to.contain('splash')
    expect(stdout).to.contain('dotenv')
  })

  it('exits with error for unknown command', async () => {
    const { stderr, exitCode } = await runCLI(['unknown'])
    
    expect(exitCode).to.equal(ExitCode.INVALID_ARGUMENT)
    expect(stderr).to.contain('Unknown command')
  })
})
```

### When to Implement

- After integration tests are stable
- Before major releases
- As part of CI pipeline hardening

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-01-07 | Initial proposal | Architecture Review |
| 2026-01-07 | Added: version flag, global CLI features, ESLint config, rollback plan | Architecture Review |
| 2026-01-11 | Migration completed: all phases implemented, tests passing, README updated | Architecture Review |
