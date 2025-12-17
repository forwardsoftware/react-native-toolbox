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
      // Allow util.styleText even though it's marked as experimental by ESLint
      // It's available and stable in Node.js 22.13.0+ (our minimum required version)
      'n/no-unsupported-features/node-builtins': ['error', {
        ignores: ['util.styleText']
      }]
    }
  }
]
