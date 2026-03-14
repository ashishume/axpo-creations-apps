import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface ModalContextValue {
  activeModalId: string | null;
  openModal: (id: string) => boolean;
  closeModal: (id: string) => void;
  isModalOpen: (id: string) => boolean;
  canOpenModal: () => boolean;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [activeModalId, setActiveModalId] = useState<string | null>(null);

  const openModal = useCallback((id: string): boolean => {
    if (activeModalId && activeModalId !== id) {
      return false;
    }
    setActiveModalId(id);
    return true;
  }, [activeModalId]);

  const closeModal = useCallback((id: string) => {
    if (activeModalId === id) {
      setActiveModalId(null);
    }
  }, [activeModalId]);

  const isModalOpen = useCallback((id: string): boolean => {
    return activeModalId === id;
  }, [activeModalId]);

  const canOpenModal = useCallback((): boolean => {
    return activeModalId === null;
  }, [activeModalId]);

  return (
    <ModalContext.Provider value={{ activeModalId, openModal, closeModal, isModalOpen, canOpenModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModalContext() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModalContext must be used within a ModalProvider");
  }
  return context;
}

export function useModal(modalId: string) {
  const { openModal, closeModal, isModalOpen, canOpenModal } = useModalContext();
  
  return {
    isOpen: isModalOpen(modalId),
    open: () => openModal(modalId),
    close: () => closeModal(modalId),
    canOpen: canOpenModal(),
  };
}
