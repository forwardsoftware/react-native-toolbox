import {includeIgnoreFile} from '@eslint/compat'
import oclif from 'eslint-config-oclif'
import prettier from 'eslint-config-prettier'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const gitignorePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.gitignore')

export default [
  includeIgnoreFile(gitignorePath),
  ...oclif,
  prettier,
  {
    rules: {
      // Allow util.styleText even though it's marked as experimental
      // It's available in Node.js 20.12.0+, 21.7.0+, and 22.13.0+
      'n/no-unsupported-features/node-builtins': ['error', {
        ignores: ['util.styleText']
      }]
    }
  }
]
