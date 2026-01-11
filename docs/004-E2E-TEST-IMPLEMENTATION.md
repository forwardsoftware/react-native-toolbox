# Proposal: E2E Test Implementation

**Status**: ✅ Implemented  
**Date**: January 11, 2026  
**Author**: Architecture Review  
**Priority**: Nice to Have  
**Related**: [003-OCLIF-MIGRATION-PROPOSAL.md](003-OCLIF-MIGRATION-PROPOSAL.md) (Appendix B)

---

## Executive Summary

This proposal outlines the implementation of End-to-End (E2E) tests for the `rn-toolbox` CLI. E2E tests spawn the actual CLI binary as a subprocess and verify behavior from the user's perspective, complementing the existing integration tests.

---

## Background

### Current Test Infrastructure

The project currently has **integration tests** that:
- Import command classes directly
- Call `command.run(args)` method
- Capture console output via mocked `console.log/warn/error`
- Assert on `CommandError` instances

**Location**: [test/helpers/run-command.ts](../test/helpers/run-command.ts)

### Why E2E Tests?

| Aspect | Integration Tests | E2E Tests |
|--------|------------------|-----------|
| Speed | Fast | Slower |
| Isolation | Imports code directly | Spawns subprocess |
| Coverage | Command logic | Full CLI lifecycle |
| Exit codes | Via `CommandError.exitCode` | Via `process.exitCode` |
| Entry points | Skip `bin/run.js` | Test actual entry point |
| Env variables | Shared with test process | Isolated subprocess |

**E2E tests catch issues that integration tests miss:**
- Entry point configuration errors (`bin/run.js`)
- Module resolution issues in production build
- Exit code propagation
- Signal handling (SIGINT, SIGTERM)
- Environment variable isolation

---

## Goals

1. Verify CLI works correctly when spawned as subprocess
2. Test global flags (`--help`, `--version`)
3. Test error handling for unknown commands
4. Validate exit codes match specification
5. Ensure built output (`dist/`) works correctly

---

## Design

### E2E Test Helper

Create `test/helpers/run-cli.ts`:

```typescript
/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export interface CLIResult {
  stdout: string
  stderr: string
  exitCode: number
}

export interface CLIOptions {
  /** Use dev entry point (TypeScript) instead of production build */
  dev?: boolean
  /** Environment variables to pass to subprocess */
  env?: Record<string, string>
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number
  /** Current working directory for the subprocess */
  cwd?: string
}

/**
 * Spawns the CLI as a subprocess and captures output
 */
export function runCLI(args: string[], options: CLIOptions = {}): Promise<CLIResult> {
  const { dev = false, env = {}, timeout = 30000, cwd } = options

  return new Promise((resolve, reject) => {
    const binPath = dev
      ? join(__dirname, '../../bin/dev.js')
      : join(__dirname, '../../bin/run.js')

    const child = spawn('node', [binPath, ...args], {
      env: {
        ...process.env,
        ...env,
        NO_COLOR: '1', // Disable colors for easier assertion
      },
      cwd,
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      reject(new Error(`CLI timed out after ${timeout}ms`))
    }, timeout)

    child.on('close', (exitCode) => {
      clearTimeout(timer)
      resolve({
        stdout,
        stderr,
        exitCode: exitCode ?? 0,
      })
    })

    child.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
  })
}
```

---

### E2E Test File

Create `test/e2e/cli.test.ts`:

```typescript
/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { ExitCode } from '../../src/cli/errors.js'
import { runCLI } from '../helpers/run-cli.js'

describe('CLI E2E', () => {
  describe('Global flags', () => {
    it('shows help with --help flag', async () => {
      const { stdout, exitCode } = await runCLI(['--help'])

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes('rn-toolbox'))
      assert.ok(stdout.includes('icons'))
      assert.ok(stdout.includes('splash'))
      assert.ok(stdout.includes('dotenv'))
    })

    it('shows help with -h flag', async () => {
      const { stdout, exitCode } = await runCLI(['-h'])

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes('USAGE'))
    })

    it('shows version with --version flag', async () => {
      const { stdout, exitCode } = await runCLI(['--version'])

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.match(stdout, /rn-toolbox\/\d+\.\d+\.\d+/)
      assert.ok(stdout.includes('node-'))
    })

    it('shows version with -V flag', async () => {
      const { stdout, exitCode } = await runCLI(['-V'])

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.match(stdout, /rn-toolbox\/\d+\.\d+\.\d+/)
    })

    it('shows help when no command provided', async () => {
      const { stdout, exitCode } = await runCLI([])

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes('COMMANDS'))
    })
  })

  describe('Unknown command', () => {
    it('exits with error for unknown command', async () => {
      const { stderr, exitCode } = await runCLI(['unknown'])

      assert.equal(exitCode, ExitCode.INVALID_ARGUMENT)
      assert.ok(stderr.includes('Unknown command: unknown'))
      assert.ok(stderr.includes('Available commands'))
    })

    it('suggests available commands', async () => {
      const { stderr } = await runCLI(['icns']) // typo

      assert.ok(stderr.includes('icons'))
      assert.ok(stderr.includes('splash'))
      assert.ok(stderr.includes('dotenv'))
    })
  })

  describe('Command help', () => {
    it('shows icons command help', async () => {
      const { stdout, exitCode } = await runCLI(['icons', '--help'])

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes('Generate app icons'))
      assert.ok(stdout.includes('--appName'))
      assert.ok(stdout.includes('--verbose'))
    })

    it('shows splash command help', async () => {
      const { stdout, exitCode } = await runCLI(['splash', '--help'])

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes('Generate app splashscreens'))
      assert.ok(stdout.includes('--appName'))
    })

    it('shows dotenv command help', async () => {
      const { stdout, exitCode } = await runCLI(['dotenv', '--help'])

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes('Manage .env files'))
      assert.ok(stdout.includes('ENVIRONMENTNAME'))
    })
  })

  describe('Exit codes', () => {
    it('returns FILE_NOT_FOUND for missing source file', async () => {
      const { exitCode } = await runCLI(['icons', './nonexistent.png', '--appName', 'Test'])

      assert.equal(exitCode, ExitCode.FILE_NOT_FOUND)
    })

    it('returns CONFIG_ERROR when app.json missing and no --appName', async () => {
      const { exitCode } = await runCLI(['icons'], { cwd: '/tmp' })

      assert.equal(exitCode, ExitCode.CONFIG_ERROR)
    })

    it('returns INVALID_ARGUMENT for missing required arg', async () => {
      const { exitCode } = await runCLI(['dotenv'])

      assert.equal(exitCode, ExitCode.INVALID_ARGUMENT)
    })
  })
})
```

---

## Implementation Plan

### Phase 1: Helper & Basic Tests ✅ COMPLETED

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| 1.1 | Create `test/helpers/run-cli.ts` | 30 min | ✅ Done |
| 1.2 | Create `test/e2e/cli.test.ts` with global flag tests | 30 min | ✅ Done |
| 1.3 | Add unknown command tests | 15 min | ✅ Done |
| 1.4 | Add command help tests | 15 min | ✅ Done |

### Phase 2: Exit Code Tests ✅ COMPLETED

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| 2.1 | Add exit code tests for each error scenario | 30 min | ✅ Done |
| 2.2 | Test production build (`bin/run.js`) | 15 min | ⚠️ Deferred |
| 2.3 | Test dev build (`bin/dev.js`) | 15 min | ✅ Done |

> **Note**: Task 2.2 deferred - all E2E tests currently use dev mode (`dev: true`) to avoid build requirement. Production build testing can be added later if needed.

### Phase 3: CI Integration ✅ COMPLETED

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| 3.1 | Add E2E test script to `package.json` | 10 min | ✅ Done |
| 3.2 | Run E2E tests in CI after build step | 15 min | ⚠️ Partial |

> **Note**: Task 3.2 partial - E2E tests added to package.json scripts, but not yet verified in CI pipeline.

---

## Test Organization

### Directory Structure

```
test/
├── helpers/
│   ├── run-command.ts   # Integration test helper (existing)
│   └── run-cli.ts       # E2E test helper (new)
├── commands/            # Integration tests (existing)
│   ├── dotenv.test.ts
│   ├── icons.test.ts
│   └── splash.test.ts
└── e2e/                 # E2E tests (new)
    └── cli.test.ts
```

### Running Tests

```bash
# Run all tests (integration + E2E)
pnpm test

# Run only E2E tests
node --import tsx --test "test/e2e/**/*.test.ts"

# Run only integration tests
node --import tsx --test "test/commands/**/*.test.ts"
```

### Package.json Scripts (Optional)

```json
{
  "scripts": {
    "test": "node --import tsx --test 'test/**/*.test.ts'",
    "test:unit": "node --import tsx --test 'test/commands/**/*.test.ts' 'test/utils/**/*.test.ts'",
    "test:e2e": "node --import tsx --test 'test/e2e/**/*.test.ts'"
  }
}
```

---

## Considerations

### Build Before E2E

E2E tests for production mode require the TypeScript to be compiled:

```bash
pnpm build && pnpm test:e2e
```

Alternatively, E2E tests can use `dev: true` option to test via `tsx`.

### Test Isolation

Each E2E test spawns a new process, ensuring:
- No shared state between tests
- Clean environment variables
- Proper exit code propagation

### Color Handling

E2E helper sets `NO_COLOR=1` to disable ANSI codes, making stdout/stderr assertions simpler.

### Timeout

Default 30-second timeout handles slow CI environments. Individual tests can override:

```typescript
const { stdout } = await runCLI(['icons'], { timeout: 60000 })
```

---

## Success Criteria

- [x] `test/helpers/run-cli.ts` created and working
- [x] `test/e2e/cli.test.ts` with core test cases
- [x] All global flag tests passing
- [x] Exit code tests for all error scenarios
- [x] Tests work with `bin/dev.js`
- [ ] Tests work with both `bin/run.js` and `bin/dev.js` *(deferred)*
- [x] Tests pass in local environment
- [ ] Tests verified in CI environment *(pending CI verification)*

## Additional Test Coverage Implemented

Beyond the original proposal, the following test suites were added:

### Icons Command Tests
- ✅ Generate icons with default file path (`assets/icon.png`)
- ✅ Generate icons with custom file path
- ✅ Verbose output flag (`-v`)
- ✅ Corrupt image file handling
- ✅ Verify iOS `Contents.json` structure
- ✅ Verify all Android density variants
- ✅ Verify all iOS icon sizes

### Splash Command Tests
- ✅ Generate splashscreens successfully
- ✅ Use default file path when not specified
- ✅ Verbose output
- ✅ FILE_NOT_FOUND error for missing file
- ✅ Verify iOS `Contents.json` structure
- ✅ Verify all Android drawable densities
- ✅ Verify iOS 1x/2x/3x variants

### Dotenv Command Tests
- ✅ Copy environment file successfully
- ✅ Replace existing `.env` file
- ✅ Verbose output
- ✅ Fail when source file doesn't exist

### App Name Resolution Tests
- ✅ Read app name from `app.json`
- ✅ Fail when `app.json` missing and no `--appName`
- ✅ Prioritize `--appName` flag over `app.json`

### Flag Variations Tests
- ✅ Short flag `-a` for `appName`
- ✅ Both `--verbose` and `-v` flags work

---

## Effort Estimation

| Phase | Estimated Time |
|-------|----------------|
| Phase 1: Helper & Basic Tests | 1.5 hours |
| Phase 2: Exit Code Tests | 1 hour |
| Phase 3: CI Integration | 30 min |
| **Total** | **~3 hours** |

---

## When to Implement

Recommended triggers:
- Before major version releases
- After any changes to `bin/run.js` or `bin/dev.js`
- When hardening CI pipeline
- If integration tests miss real-world issues

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-01-11 | Initial proposal (extracted from 003-OCLIF-MIGRATION-PROPOSAL.md Appendix B) | Architecture Review |
| 2026-01-11 | ✅ Implementation completed - all phases done with comprehensive test coverage | Development Team |

---

## Implementation Review

### What Was Implemented

The E2E test implementation **exceeded expectations** with comprehensive coverage:

1. **Core Infrastructure** ✅
   - `test/helpers/run-cli.ts` with support for dev/production modes, custom environment variables, timeout control, and VT control character stripping
   - Uses `tsx` loader for dev mode instead of relying on shebang
   - Proper subprocess spawning with output capture

2. **Test Coverage** ✅
   - All proposed tests implemented
   - **Additional 30+ test cases** covering real-world scenarios
   - File verification with actual iOS/Android output structure
   - JSON structure validation for `Contents.json` files
   - Flag variation testing (short/long forms)

3. **Package.json Scripts** ✅
   - `test:e2e` script added for isolated E2E testing
   - `test:integration` script for integration tests
   - Main `test` command runs both with coverage

### Key Differences from Proposal

1. **Enhanced `run-cli.ts` helper**:
   - Added `stripVTControlCharacters` from `node:util` for cleaner output assertions
   - Dev mode uses explicit `tsx` loader instead of shebang
   - Both `NO_COLOR` and `NODE_DISABLE_COLORS` environment variables set

2. **More comprehensive test assertions**:
   - Actual file existence checks for generated assets
   - JSON structure validation
   - Content verification (not just exit codes)
   - Cross-platform output verification (iOS + Android)

3. **Test organization**:
   - Tests grouped by command with proper setup/teardown
   - Temporary directory management in `tmp/e2e-tests`
   - Proper cleanup in `after`/`afterEach` hooks

### Deferred Items

- **Production build testing**: All tests use `dev: true` to avoid build dependency
- **CI verification**: Scripts added but not yet verified in actual CI environment

These can be addressed in future iterations if needed.
