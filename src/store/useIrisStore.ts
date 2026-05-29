import { create } from 'zustand';

interface IrisState {
  cursor: { x: number; y: number };
  selectedNodes: string[];
  setCursor: (x: number, y: number) => void;
  addNode: (node: string) => void;
  clearNodes: () => void;
}

export const useIrisStore = create<IrisState>((set) => ({
  cursor: { x: 0, y: 0 },
  selectedNodes: [],
  setCursor: (x, y) => set({ cursor: { x, y } }),
  addNode: (node) => set((state) => ({ selectedNodes: [...state.selectedNodes, node] })),
  clearNodes: () => set({ selectedNodes: [] }),
}));
