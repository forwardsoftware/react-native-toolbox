# Code Review Findings

**Status:** Pending  
**Created:** 2026-01-05  
**Target:** Improvement recommendations from a code review, prioritized for the "Test Developer" agent.

---

## Test Coverage Improvements (Priority: Medium)

### 1. Add Tests for Verbose Output

The `-v` flag behavior is not explicitly tested in any command.

**Files to update:**
- `test/commands/icons.test.ts`
- `test/commands/splash.test.ts`

**Test cases to add:**
```typescript
it('runs icons with verbose flag and shows detailed output', async () => {
  const {stdout} = await runCommand(['icons', '--appName', 'test', '-v'])
  
  expect(stdout).to.contain("Generating icon")
  expect(stdout).to.contain("Icon '")
})
```

### 2. Add Tests for Malformed Input Images

No tests verify behavior with corrupt or wrong-format files.

**Test cases to add:**
```typescript
it('handles corrupt image file gracefully', async () => {
  fs.writeFileSync('assets/icon.png', 'not a valid image')
  
  const {error} = await runCommand(['icons', '--appName', 'test'])
  
  // Verify appropriate error handling
})
```

### 3. Add Unit Tests for `extractAppName` Utility

**File to create:** `test/utils/app.utils.test.ts`

**Test cases:**
- Valid `app.json` with `name` property
- Missing `app.json` file
- Invalid JSON in `app.json`
- Valid JSON but missing `name` property
- Empty `name` property

```typescript
import {expect} from 'chai'
import fs from 'node:fs'
import {rimrafSync} from 'rimraf'
import {extractAppName} from '../../src/utils/app.utils.js'

describe('extractAppName', () => {
  afterEach(() => {
    rimrafSync('app.json')
  })

  it('returns name from valid app.json', () => {
    fs.writeFileSync('app.json', JSON.stringify({name: 'TestApp'}))
    expect(extractAppName()).to.equal('TestApp')
  })

  it('returns null when app.json is missing', () => {
    expect(extractAppName()).to.be.null
  })

  it('returns null when app.json has invalid JSON', () => {
    fs.writeFileSync('app.json', 'not valid json')
    expect(extractAppName()).to.be.null
  })

  it('returns undefined when name property is missing', () => {
    fs.writeFileSync('app.json', JSON.stringify({version: '1.0.0'}))
    expect(extractAppName()).to.be.undefined
  })
})
```

### 4. Add Tests for `dotenv` Verbose Flag

Once verbose flag is added to `dotenv` command, add corresponding tests.

---

## Code Fixes Required Before Testing

### 1. Fix Typo in Error Messages (Priority: Low)

**Files:** `src/commands/icons.ts`, `src/commands/splash.ts`

Change `"retrive"` to `"retrieve"` in error messages.

**Location in icons.ts:** Line 68
**Location in splash.ts:** Line 66

```typescript
// Before:
this.error(`${red('✘')} Failed to retrive ${cyan('appName')} value...`)

// After:
this.error(`${red('✘')} Failed to retrieve ${cyan('appName')} value...`)
```

### 2. Add Verbose Flag to `dotenv` Command (Priority: Medium)

**File:** `src/commands/dotenv.ts`

Add verbose flag to match `icons` and `splash` commands for consistency.

```typescript
static override flags = {
  help: Flags.help({ char: 'h' }),
  verbose: Flags.boolean({
    char: 'v',
    default: false,
    description: 'Print more detailed log messages.',
  }),
}
```

### 3. Add Missing License Header (Priority: Low)

**File:** `src/constants.ts`

Add MPL-2.0 license header to match other source files:

```typescript
/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
```

### 4. Standardize Path Prefixes (Priority: Low)

**Files:** `src/commands/icons.ts`, `src/commands/splash.ts`

Inconsistent use of `./` prefix in paths:

**In icons.ts (no prefix):**
```typescript
this.generateAndroidIcons(args.file, 'android/app/src/main')
this.generateIOSIcons(args.file, `ios/${flags.appName}/Images.xcassets/AppIcon.appiconset`)
```

**In splash.ts (has prefix):**
```typescript
this.generateAndroidSplashscreens(args.file, './android/app/src/main/res')
this.generateIOSSplashscreens(args.file, `./ios/${flags.appName}/Images.xcassets/Splashscreen.imageset`)
```

**Recommendation:** Remove `./` prefix from splash.ts paths for consistency with icons.ts and standard Node.js path handling.

### 5. Improve `extractAppName` Error Handling (Priority: Low)

**File:** `src/utils/app.utils.ts`

Current implementation silently returns `null` for all error cases. Consider more specific error handling to help users debug issues.

**Current:**
```typescript
export function extractAppName() {
  try {
    const { name } = JSON.parse(readFileSync('./app.json', 'utf8'))
    return name
  } catch {
    return null
  }
}
```

**Suggested improvement:**
```typescript
export function extractAppName(): string | null {
  try {
    const content = readFileSync('./app.json', 'utf8')
    const parsed = JSON.parse(content)
    
    if (typeof parsed.name !== 'string' || parsed.name.trim() === '') {
      return null
    }
    
    return parsed.name
  } catch {
    return null
  }
}
```

---

## Refactoring Suggestions (Lower Priority)

### 1. Extract Base Command Class (Priority: Medium)

**Issue:** Both `Icons` and `Splash` commands duplicate the same `logVerbose()` implementation and `_isVerbose` property.

**File to create:** `src/commands/base.ts`

```typescript
/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Command } from '@oclif/core'

export abstract class BaseCommand extends Command {
  protected _isVerbose: boolean = false

  protected logVerbose(message?: string, ...args: unknown[]) {
    if (this._isVerbose) {
      this.log(message, ...args)
    }
  }
}
```

**Then update commands to extend `BaseCommand` instead of `Command`.**

### 2. Add Type Definitions for Icon Sizes (Priority: Low)

**File:** `src/types.ts`

Add interfaces for icon sizes (currently only splashscreen sizes are typed):

```typescript
export interface IconSizeAndroid {
  density: string;
  size: number;
}

export interface IconSizeIOS {
  baseSize: number;
  idiom?: string;
  name: string;
  scales: number[];
}
```

**Then update `src/constants.ts`:**
```typescript
export const ICON_SIZES_ANDROID: Array<IconSizeAndroid> = [...]
export const ICON_SIZES_IOS: Array<IconSizeIOS> = [...]
```

### 3. Improve Error Collection (Priority: Medium)

**Issue:** In `icons.ts` and `splash.ts`, errors during image generation are logged but execution continues silently. Users may not realize some icons failed to generate.

**Files:** `src/commands/icons.ts`, `src/commands/splash.ts`

**Suggestion:** Collect errors and report summary at end:

```typescript
private errors: string[] = []

// In catch blocks:
this.errors.push(`Failed to generate: ${outputPath}`)

// At end of run():
if (this.errors.length > 0) {
  this.warn(`${yellow('⚠')} ${this.errors.length} asset(s) failed to generate:`)
  this.errors.forEach(err => this.log(`  - ${err}`))
}
```

---

## Files Reference

| File | Test File | Status |
|------|-----------|--------|
| `src/commands/icons.ts` | `test/commands/icons.test.ts` | Needs verbose tests, fix typo, standardize paths |
| `src/commands/splash.ts` | `test/commands/splash.test.ts` | Needs verbose tests, fix typo, standardize paths |
| `src/commands/dotenv.ts` | `test/commands/dotenv.test.ts` | Needs verbose flag + tests |
| `src/utils/app.utils.ts` | ❌ Missing | Create new test file, improve error handling |
| `src/utils/file-utils.ts` | ❌ Missing | Consider adding tests |
| `src/utils/color.utils.ts` | ❌ Missing | Consider adding tests |
| `src/constants.ts` | N/A | Add license header, add types |
| `src/types.ts` | N/A | Add icon size interfaces |

---

## Priority Summary

| Priority | Count | Items |
|----------|-------|-------|
| 🔶 Medium | 5 | Base command extraction, error collection, verbose tests, dotenv verbose flag, malformed input tests |
| 🔷 Low | 6 | Typo fix, license header, path prefixes, extractAppName improvement, icon size types, utility tests |
