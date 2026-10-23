import { create } from "zustand";

/** Purely client-side UI state. Server data lives in TanStack Query; nothing persistent is stored here. */
interface UiState {
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
}
export const useUi = create<UiState>((set) => ({ navOpen: false, setNavOpen: (navOpen) => set({ navOpen }) }));
