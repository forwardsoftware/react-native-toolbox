#!/usr/bin/env -S node --loader ts-node/esm --disable-warning=ExperimentalWarning

import { runCLI } from '../src/cli/runner.js'

await runCLI(process.argv.slice(2))
