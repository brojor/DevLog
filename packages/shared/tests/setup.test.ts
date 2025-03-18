import { describe, expect, it } from 'vitest'

describe('basic test setup', () => {
  it('should verify that the test environment is working correctly', () => {
    expect(1 + 1).toBe(2)
  })

  it('should be able to work with asynchronous tests', async () => {
    const result = await Promise.resolve('test')
    expect(result).toBe('test')
  })
})
