#!/usr/bin/env -S node --import tsx

import { runCLI } from '../src/cli/runner.js'

await runCLI(process.argv.slice(2))
