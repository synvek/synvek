import { createContext, useContext, useMemo } from 'react'
import { CurrentWorkspace } from './CurrentWorkspace'

//export const GlobalContext = createContext(globalContext)
interface GlobalContextProps {
  currentWorkspace: CurrentWorkspace
}

export const GlobalContext = createContext<GlobalContextProps>({ currentWorkspace: new CurrentWorkspace() })

export const GlobalContextProvider = GlobalContext.Provider

//const currentWorkspace = { currentWorkspace: new CurrentWorkspace() }

export const useGlobalContext = () => {
  const globalContext = useContext(GlobalContext)

  //const globalRef = useRef<{ currentWorkspace: CurrentWorkspace }>(currentWorkspace)

  return useMemo(() => {
    return {
      currentWorkspace: globalContext.currentWorkspace,
    }
  }, [])
  //  return globalRef.current
}
