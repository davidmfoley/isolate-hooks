import { describe, it, beforeEach, afterEach } from 'mocha'
import { expect } from 'chai'

import { testInIsolation } from '../src'
import { useEffect, useLayoutEffect, useState } from 'react'

describe('effects', () => {
  let invocations: string[]
  beforeEach(() => {
    invocations = []
  })
  describe('useEffect', () => {
    it('invokes effect first time', () => {
      const useEffectExample = () => {
        useEffect(() => {
          invocations.push('effect')
        }, [])
        return ''
      }

      testInIsolation(useEffectExample)
      expect(invocations).to.eql(['effect'])
    })

    it('invokes effect after hook completes', () => {
      const useEffectExample = () => {
        useEffect(() => {
          invocations.push('effect')
        }, [])
        invocations.push('render')
      }

      testInIsolation(useEffectExample)
      expect(invocations).to.eql(['render', 'effect'])
    })

    it('invokes effect if deps change', () => {
      let setName: Function

      const useEffectExample = () => {
        const [name, setter] = useState('arthur')
        setName = setter
        useEffect(() => {
          invocations.push(`hello ${name}`)
        }, [name])
        return ''
      }

      testInIsolation(useEffectExample)
      setName('ford')

      expect(invocations).to.eql(['hello arthur', 'hello ford'])
    })

    it('does not invoke effect if deps do not change', () => {
      let setName: Function

      const useEffectExample = () => {
        const [name, setter] = useState('arthur')
        setName = setter
        useEffect(() => {
          invocations.push(`hello ${name}`)
        }, [name])
        return ''
      }

      testInIsolation(useEffectExample)
      setName('arthur')

      expect(invocations).to.eql(['hello arthur'])
    })

    it('cleans up effect upon dep change and unmount', () => {
      let setName: Function

      const useEffectExample = () => {
        const [name, setter] = useState('arthur')
        setName = setter
        useEffect(() => {
          invocations.push(`hello ${name}`)
          return () => invocations.push(`goodbye ${name}`)
        }, [name])
        return ''
      }

      const isolated = testInIsolation(useEffectExample)
      setName('ford')
      isolated.cleanup()

      expect(invocations).to.eql([
        'hello arthur',
        'goodbye arthur',
        'hello ford',
        'goodbye ford',
      ])
    })
  })

  describe('useLayoutEffect', () => {
    it.skip('runs before useEffect', () => {
      const useEffectOrderExample = () => {
        useEffect(() => {
          invocations.push('useEffect')
          return () => invocations.push('cleanup useEffect')
        }, [])

        useLayoutEffect(() => {
          invocations.push('useLayoutEffect')
          return () => invocations.push('cleanup useLayoutEffect')
        }, [])
        return ''
      }

      testInIsolation(useEffectOrderExample).cleanup()
      expect(invocations).to.eql([
        'useLayoutEffect',
        'useEffect',
        'cleanup useLayoutEffect',
        'cleanup useEffect',
      ])
    })
  })
})