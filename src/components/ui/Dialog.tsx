import { createContext, useContext, useEffect, useRef, useState } from 'react'

interface DialogContextType {
  isOpen: boolean
  close: () => void
}

const DialogContext = createContext<DialogContextType | null>(null)

export function Dialog({ children, open, onOpenChange }: {
  children: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = useState(open)
  const isOpen = open ?? internalOpen
  const close = () => {
    if (onOpenChange) {
      onOpenChange(false)
    } else {
      setInternalOpen(false)
    }
  }

  return (
    <DialogContext.Provider value={{ isOpen, close }}>
      {children}
    </DialogContext.Provider>
  )
}

export function DialogTrigger({ children, asChild = false }: {
  children: React.ReactNode
  asChild?: boolean
}) {
  const { close } = useContext(DialogContext)!

  if (asChild) {
    return (
      <div onClick={() => close()}>
        {children}
      </div>
    )
  }

  return (
    <button onClick={close}>
      {children}
    </button>
  )
}

export function DialogContent({ children, className = '' }: {
  children: React.ReactNode
  className?: string
}) {
  const { isOpen, close } = useContext(DialogContext)!
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, close])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={close}
      />

      {/* 对话框内容 */}
      <div
        ref={dialogRef}
        className={`relative z-10 bg-white rounded-lg shadow-xl p-6 m-4 max-w-lg w-full max-h-[90vh] overflow-y-auto ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      {children}
    </div>
  )
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold text-gray-900">
      {children}
    </h2>
  )
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 flex justify-end space-x-2">
      {children}
    </div>
  )
}