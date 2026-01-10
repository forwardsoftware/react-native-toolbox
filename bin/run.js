#!/usr/bin/env node

import { runCLI } from '../dist/cli/runner.js'

await runCLI(process.argv.slice(2))
