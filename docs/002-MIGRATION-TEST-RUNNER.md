# Migration Plan: Mocha → Node.js Test Runner

**Status:** Ready for Implementation  
**Created:** 2026-01-05  
**Updated:** 2026-01-11  
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

#### 2.4 Migrate app.utils.test.ts

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
  | `expect(await extractAppName()).to.equal('TestApp')` | `assert.equal(await extractAppName(), 'TestApp')` |
  | `expect(await extractAppName()).to.be.undefined` | `assert.equal(await extractAppName(), undefined)` |

#### 2.5 Migrate color.utils.test.ts

- [ ] Update imports (same pattern as 2.4)

- [ ] Replace assertions:
  | Before | After |
  |--------|-------|
  | `expect(result).to.include('test')` | `assert.ok(result.includes('test'))` |
  | `expect(result).to.be.a('string')` | `assert.equal(typeof result, 'string')` |

#### 2.6 Migrate file-utils.test.ts

- [ ] Update imports (same pattern as 2.4)

- [ ] Replace assertions:
  | Before | After |
  |--------|-------|
  | `expect(result).to.be.true` | `assert.ok(result)` |
  | `expect(result).to.be.false` | `assert.equal(result, false)` |
  | `expect(fs.existsSync(dirPath)).to.be.true` | `assert.ok(fs.existsSync(dirPath))` |
  | `expect(fs.statSync(dirPath).isDirectory()).to.be.true` | `assert.ok(fs.statSync(dirPath).isDirectory())` |

---

### Phase 3: Update Configuration Files

#### 3.1 Update package.json

- [ ] Update scripts:
  ```json
  {
    "scripts": {
      "cleanup": "node -e \"const fs=require('fs');['android','ios','dist','coverage','.nyc_output','.env','tsconfig.tsbuildinfo'].forEach(p=>fs.rmSync(p,{force:true,recursive:true}))\"",
      "test": "node --import tsx --test --experimental-test-coverage 'test/**/*.test.ts'",
      "posttest": "pnpm run lint"
    }
  }
  ```

  > **Note:** The test command runs tests in parallel by default. If file-based tests conflict, add `--test-concurrency=1`.

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

#### 4.3 Update AGENTS.md

- [ ] Update "Testing Instructions" section to reference Node.js test runner
- [ ] Update test command examples

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
| `expect(x).to.be.undefined` | `assert.equal(x, undefined)` |
| `expect(x).to.contain(y)` | `assert.ok(x.includes(y))` |
| `expect(x).to.include(y)` | `assert.ok(x.includes(y))` |
| `expect(x).to.match(/re/)` | `assert.match(x, /re/)` |
| `expect(x).to.deep.equal(y)` | `assert.deepEqual(x, y)` |
| `expect(x).to.be.null` | `assert.equal(x, null)` |
| `expect(x).to.be.a('string')` | `assert.equal(typeof x, 'string')` |
| `expect(fn).to.throw()` | `assert.throws(fn)` |

---

## Reference: Test File Template

```typescript
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {after, afterEach, before, beforeEach, describe, it} from 'node:test'

import {ExitCode} from '../../src/cli/errors.js'
import CommandClass from '../../src/commands/{command}.js'
import {runCommand} from '../helpers/run-command.js'

describe('command-name', {timeout: 60_000}, () => {
  before(() => {
    // One-time setup (e.g., create assets directory, copy test files)
    fs.mkdirSync('assets', {recursive: true})
    fs.copyFileSync('test/assets/icon.png', 'assets/icon.png')
  })

  after(() => {
    // One-time teardown
    fs.rmSync('assets', {force: true, recursive: true})
  })

  beforeEach(() => {
    // Per-test setup
  })

  afterEach(() => {
    // Per-test teardown (e.g., remove generated directories)
    for (const dir of ['android', 'ios']) {
      fs.rmSync(dir, {force: true, recursive: true})
    }
  })

  it('should do something', async () => {
    const {stdout, error} = await runCommand(CommandClass, ['--flag', 'value'])
    
    assert.ok(stdout.includes('expected output'))
    assert.equal(error, undefined)
  })

  it('should fail gracefully', async () => {
    const {error} = await runCommand(CommandClass, [])
    
    assert.equal(error?.exitCode, ExitCode.INVALID_ARGUMENT)
  })
})
```

---

## Dependency Delta

```diff
  "devDependencies": {
-   "@types/chai": "^5",
-   "@types/mocha": "^10",
    "@types/node": "^25",
-   "chai": "^6",
    "eslint": "^9",
    "eslint-config-prettier": "^10",
-   "mocha": "^11",
-   "ts-node": "^10",
+   "tsx": "^4",
    "typescript": "^5",
    "typescript-eslint": "^8.52.0"
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
