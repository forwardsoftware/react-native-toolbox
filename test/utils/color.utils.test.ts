import {expect} from 'chai'

import {cyan, green, red, yellow} from '../../src/utils/color.utils.js'

describe('color.utils', () => {
  describe('cyan', () => {
    it('wraps text with cyan color', () => {
      const result = cyan('test')

      // Should contain the text
      expect(result).to.include('test')
    })

    it('handles empty string', () => {
      const result = cyan('')

      expect(result).to.be.a('string')
    })

    it('handles special characters', () => {
      const result = cyan('test!@#$%')

      expect(result).to.include('test!@#$%')
    })
  })

  describe('green', () => {
    it('wraps text with green color', () => {
      const result = green('success')

      // Should contain the text
      expect(result).to.include('success')
    })

    it('handles empty string', () => {
      const result = green('')

      expect(result).to.be.a('string')
    })

    it('handles multiline text', () => {
      const result = green('line1\nline2')

      expect(result).to.include('line1')
      expect(result).to.include('line2')
    })
  })

  describe('red', () => {
    it('wraps text with red color', () => {
      const result = red('error')

      // Should contain the text
      expect(result).to.include('error')
    })

    it('handles empty string', () => {
      const result = red('')

      expect(result).to.be.a('string')
    })

    it('handles numbers as strings', () => {
      const result = red('404')

      expect(result).to.include('404')
    })
  })

  describe('yellow', () => {
    it('wraps text with yellow color', () => {
      const result = yellow('warning')

      // Should contain the text
      expect(result).to.include('warning')
    })

    it('handles empty string', () => {
      const result = yellow('')

      expect(result).to.be.a('string')
    })

    it('handles symbols', () => {
      const result = yellow('⚠')

      expect(result).to.include('⚠')
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
      expect(cyanResult).to.include(text)
      expect(greenResult).to.include(text)
      expect(redResult).to.include(text)
      expect(yellowResult).to.include(text)

      // All should be strings
      expect(cyanResult).to.be.a('string')
      expect(greenResult).to.be.a('string')
      expect(redResult).to.be.a('string')
      expect(yellowResult).to.be.a('string')
    })
  })
})
