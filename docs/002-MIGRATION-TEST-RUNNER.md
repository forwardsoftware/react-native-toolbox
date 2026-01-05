# Migration Plan: Mocha → Node.js Test Runner

**Status:** Pending  
**Created:** 2026-01-05  
**Target:** Replace Mocha/Chai with Node.js built-in test runner, tsx, and node:assert

---

## Decision Summary

| Component | Before | After |
|-----------|--------|-------|
| Test runner | Mocha 11.x | `node:test` (built-in) |
| Assertion library | Chai 6.x | `node:assert/strict` |
| TypeScript loader | ts-node 10.x | tsx 4.x |
| Coverage | None | `--experimental-test-coverage` |
| Config file | `.mocharc.json` | CLI flags only |

---

## Tasks

### Phase 1: Setup

- [ ] **1.1** Install tsx
  ```bash
  pnpm add -D tsx
  ```

- [ ] **1.2** Verify tsx works with node:test (quick spike)
  ```bash
  node --import tsx --test test/commands/dotenv.test.ts
  ```

---

### Phase 2: Migrate Test Files

#### 2.1 Migrate dotenv.test.ts

- [ ] Update imports:
  ```typescript
  // Remove
  import {expect} from 'chai'
  
  // Add
  import assert from 'node:assert/strict'
  import {afterEach, describe, it} from 'node:test'
  ```

- [ ] Replace assertions:
  | Before | After |
  |--------|-------|
  | `expect(error?.oclif?.exit).to.equal(2)` | `assert.equal(error?.oclif?.exit, 2)` |
  | `expect(stdout).to.contain('...')` | `assert.ok(stdout.includes('...'))` |
  | `expect(envContent).to.eq(...)` | `assert.equal(envContent, ...)` |

#### 2.2 Migrate icons.test.ts

- [ ] Update imports (same pattern as 2.1)

- [ ] Add timeout to describe block:
  ```typescript
  describe('icons', {timeout: 60_000}, () => {
  ```

- [ ] Replace assertions:
  | Before | After |
  |--------|-------|
  | `expect(stdout).to.contain(...)` | `assert.ok(stdout.includes(...))` |
  | `expect(fs.existsSync(...)).to.be.true` | `assert.ok(fs.existsSync(...))` |
  | `expect(iosAppIcons.length).to.eq(9)` | `assert.equal(iosAppIcons.length, 9)` |
  | `expect(mipmapDirs.length).to.eq(5)` | `assert.equal(mipmapDirs.length, 5)` |
  | `expect(androidPngCount).to.eq(10)` | `assert.equal(androidPngCount, 10)` |

#### 2.3 Migrate splash.test.ts

- [ ] Update imports (same pattern as 2.1)

- [ ] Add timeout to describe block:
  ```typescript
  describe('splash', {timeout: 60_000}, () => {
  ```

- [ ] Replace assertions (same patterns as 2.2)

---

### Phase 3: Update Configuration Files

#### 3.1 Update package.json

- [ ] Update scripts:
  ```json
  {
    "scripts": {
      "cleanup": "rimraf android/ ios/ dist/ coverage/ oclif.manifest.json .env",
      "test": "node --import tsx --test --experimental-test-coverage 'test/**/*.test.ts'",
      "posttest": "pnpm run lint"
    }
  }
  ```

- [ ] Remove devDependencies:
  - `mocha`
  - `@types/mocha`
  - `chai`
  - `@types/chai`
  - `ts-node`

- [ ] Add devDependencies:
  - `tsx` (already added in Phase 1)

#### 3.2 Update bin/dev.js

- [ ] Change shebang from:
  ```javascript
  #!/usr/bin/env -S node --loader ts-node/esm --disable-warning=ExperimentalWarning
  ```
  To:
  ```javascript
  #!/usr/bin/env -S node --import tsx
  ```

#### 3.3 Update bin/dev.cmd

- [ ] Change from:
  ```cmd
  node --loader ts-node/esm --no-warnings=ExperimentalWarning "%~dp0\dev" %*
  ```
  To:
  ```cmd
  node --import tsx "%~dp0\dev" %*
  ```

#### 3.4 Delete .mocharc.json

- [ ] Remove file: `.mocharc.json`

#### 3.5 Update tsconfig.json

- [ ] Remove `ts-node` block:
  ```jsonc
  // Remove this entire section
  "ts-node": {
    "esm": true
  }
  ```

#### 3.6 Update .vscode/launch.json

- [ ] Update runtimeArgs to use tsx instead of ts-node

---

### Phase 4: Update Documentation

#### 4.1 Update .github/copilot-instructions.md

- [ ] Change test command reference from Mocha to Node.js test runner
- [ ] Update testing section

#### 4.2 Update .github/agents/test-developer.agent.md

- [ ] Update test framework description
- [ ] Update test patterns and examples
- [ ] Update imports in code examples

#### 4.3 Update TODO.md

- [ ] Update test file references (remove Mocha-specific notes)

---

### Phase 5: Cleanup & Verify

- [ ] **5.1** Run full test suite:
  ```bash
  pnpm test
  ```

- [ ] **5.2** Verify coverage output appears in stdout

- [ ] **5.3** Remove old dependencies:
  ```bash
  pnpm remove mocha @types/mocha chai @types/chai ts-node
  ```

- [ ] **5.4** Run tests again after dependency removal

- [ ] **5.5** Verify bin/dev.js still works:
  ```bash
  ./bin/dev.js icons --help
  ```

- [ ] **5.6** Run lint to ensure no issues:
  ```bash
  pnpm lint
  ```

---

## Reference: Assertion Mapping

| Chai | node:assert/strict |
|------|-------------------|
| `expect(x).to.equal(y)` | `assert.equal(x, y)` |
| `expect(x).to.eq(y)` | `assert.equal(x, y)` |
| `expect(x).to.be.true` | `assert.ok(x)` |
| `expect(x).to.be.false` | `assert.equal(x, false)` |
| `expect(x).to.contain(y)` | `assert.ok(x.includes(y))` |
| `expect(x).to.match(/re/)` | `assert.match(x, /re/)` |
| `expect(x).to.deep.equal(y)` | `assert.deepEqual(x, y)` |
| `expect(x).to.be.null` | `assert.equal(x, null)` |
| `expect(fn).to.throw()` | `assert.throws(fn)` |

---

## Reference: Test File Template

```typescript
import {runCommand} from '@oclif/test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {after, afterEach, before, beforeEach, describe, it} from 'node:test'
import {rimrafSync} from 'rimraf'

describe('command-name', {timeout: 60_000}, () => {
  before(() => {
    // One-time setup
  })

  after(() => {
    // One-time teardown
  })

  beforeEach(() => {
    // Per-test setup
  })

  afterEach(() => {
    // Per-test teardown
  })

  it('should do something', async () => {
    const {stdout, error} = await runCommand(['command', '--flag', 'value'])
    
    assert.ok(stdout.includes('expected output'))
    assert.equal(error, undefined)
  })

  it('should fail gracefully', async () => {
    const {error} = await runCommand(['command'])
    
    assert.equal(error?.oclif?.exit, 2)
  })
})
```

---

## Dependency Delta

```diff
  "devDependencies": {
    "@eslint/compat": "^2",
    "@oclif/prettier-config": "^0.2.1",
    "@oclif/test": "^4",
-   "@types/chai": "^5",
-   "@types/mocha": "^10",
    "@types/node": "^25",
-   "chai": "^6",
    "eslint": "^9",
    "eslint-config-oclif": "^6",
    "eslint-config-prettier": "^10",
-   "mocha": "^11",
    "oclif": "^4.22.6",
    "rimraf": "^6",
-   "ts-node": "^10",
+   "tsx": "^4",
    "typescript": "^5"
  }
```

**Net change:** -5 packages, +1 package

---

## Rollback Plan

If issues arise, revert by:
1. Restore `.mocharc.json` from git
2. Restore original `package.json` dependencies
3. Restore original test files
4. Run `pnpm install`

```bash
git checkout HEAD -- .mocharc.json package.json test/ bin/dev.js bin/dev.cmd tsconfig.json
pnpm install
```
