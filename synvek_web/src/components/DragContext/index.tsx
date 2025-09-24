import { createContext, ReactNode, useContext, useState } from 'react'

// 定义拖拽类型
type DragType = string | null

// 定义 context 值的类型
type DragContextType = [DragType, (dragType: DragType) => void]

// 创建 context 并指定类型
export const DragContext = createContext<DragContextType>([null, (dragType) => {}])

interface DragProviderProps {
  children: ReactNode
}

export const DragProvider = ({ children }: DragProviderProps) => {
  const [dragType, setDragType] = useState<DragType>(null)

  return <DragContext.Provider value={[dragType, setDragType]}>{children}</DragContext.Provider>
}

export const useDrag = (): DragContextType => {
  return useContext(DragContext)
}
