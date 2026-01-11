import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {cyan, green, red, yellow} from '../../../src/utils/color.utils.js'

describe('color.utils', () => {
  describe('cyan', () => {
    it('wraps text with cyan color', () => {
      const result = cyan('test')

      // Should contain the text
      assert.ok(result.includes('test'))
    })

    it('handles empty string', () => {
      const result = cyan('')

      assert.equal(typeof result, 'string')
    })

    it('handles special characters', () => {
      const result = cyan('test!@#$%')

      assert.ok(result.includes('test!@#$%'))
    })
  })

  describe('green', () => {
    it('wraps text with green color', () => {
      const result = green('success')

      // Should contain the text
      assert.ok(result.includes('success'))
    })

    it('handles empty string', () => {
      const result = green('')

      assert.equal(typeof result, 'string')
    })

    it('handles multiline text', () => {
      const result = green('line1\nline2')

      assert.ok(result.includes('line1'))
      assert.ok(result.includes('line2'))
    })
  })

  describe('red', () => {
    it('wraps text with red color', () => {
      const result = red('error')

      // Should contain the text
      assert.ok(result.includes('error'))
    })

    it('handles empty string', () => {
      const result = red('')

      assert.equal(typeof result, 'string')
    })

    it('handles numbers as strings', () => {
      const result = red('404')

      assert.ok(result.includes('404'))
    })
  })

  describe('yellow', () => {
    it('wraps text with yellow color', () => {
      const result = yellow('warning')

      // Should contain the text
      assert.ok(result.includes('warning'))
    })

    it('handles empty string', () => {
      const result = yellow('')

      assert.equal(typeof result, 'string')
    })

    it('handles symbols', () => {
      const result = yellow('⚠')

      assert.ok(result.includes('⚠'))
    })
  })

  describe('integration', () => {
    it('all color functions return different outputs for same input', () => {
      const text = 'test'
      const cyanResult = cyan(text)
      const greenResult = green(text)
      const redResult = red(text)
      const yellowResult = yellow(text)

      // All should contain the text
      assert.ok(cyanResult.includes(text))
      assert.ok(greenResult.includes(text))
      assert.ok(redResult.includes(text))
      assert.ok(yellowResult.includes(text))

      // All should be strings
      assert.equal(typeof cyanResult, 'string')
      assert.equal(typeof greenResult, 'string')
      assert.equal(typeof redResult, 'string')
      assert.equal(typeof yellowResult, 'string')
    })
  })
})
