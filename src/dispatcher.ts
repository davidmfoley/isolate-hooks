import React from 'react'
import dirtyDependenciess from './dirtyDepenendencies'
import { IsolatedHookState } from './isolatedHookState'

type SetState<T> = React.Dispatch<React.SetStateAction<T>>

interface Dispatcher {
  useMemo: typeof React.useMemo
  useState: typeof React.useState
  useEffect: typeof React.useEffect
  useLayoutEffect: typeof React.useEffect
  useContext: typeof React.useContext
  useRef: typeof React.useRef
}

export const createIsolatedDispatcher = (
  isolatedHookState: IsolatedHookState
): Dispatcher => {
  const useState = <T>(
    initialState: T | (() => T)
  ): [state: T, setter: SetState<T>] => {
    const factory: () => T = ((typeof initialState === 'function'
      ? initialState
      : () => initialState) as unknown) as () => T

    const [state, updateState] = isolatedHookState.nextHookState(
      'useState',
      factory
    )

    return [state.value, updateState]
  }
  type Deps = any[] | undefined

  const useEffectHandler = (effectSet: any) => (
    effect: () => (() => void) | undefined,
    deps: Deps
  ) => {
    effectSet.nextEffect(effect, deps)
  }

  const useEffect = useEffectHandler(isolatedHookState.effects)
  const useLayoutEffect = useEffectHandler(isolatedHookState.layoutEffects)

  return {
    useMemo: ((fn: any, deps: any) => {
      const [state] = isolatedHookState.nextHookState('useMemo', () => ({
        value: fn(),
        deps,
      }))
      if (dirtyDependenciess(deps, state.value.deps)) {
        state.value.value = fn()
      }
      return state.value.value
    }) as any,
    useState: useState as any,
    useEffect: useEffect as any,
    useLayoutEffect: useLayoutEffect as any,
    useContext: (type) => isolatedHookState.contextValue(type),
    useRef: (initialValue?: any) => {
      const [ref] = isolatedHookState.nextHookState(
        'useRef',
        () => initialValue
      )
      return { current: ref.value }
    },
  }
}
