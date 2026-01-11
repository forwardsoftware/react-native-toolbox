#!/usr/bin/env -S node --import tsx

import { runCLI } from '../src/cli/runner.js'

try {
  await runCLI(process.argv.slice(2))
} catch (err) {
  // CommandError will call process.exit() via error() function
  // Other errors should exit with code 1
  console.error(err)
  process.exit(1)
}
