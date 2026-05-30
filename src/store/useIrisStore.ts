import { create } from 'zustand';

interface IrisState {
  cursor: { x: number; y: number };
  selectedNodes: string[];
  predictions: string[];
  isPredicting: boolean;
  showMediaModal: boolean;
  sleepMode: boolean;
  blockFrequencies: Record<string, number>;
  coreBlocks: string[];
  activeTone: string | null;
  ambientContext: string;
  isListening: boolean;
  isTranscribing: boolean;
  sttDownloadProgress: number;
  sttReady: boolean;
  liveCaption: string;
  sttError: string | null;
  setCursor: (x: number, y: number) => void;
  addNode: (node: string) => void;
  clearNodes: () => void;
  setPredictions: (words: string[]) => void;
  setIsPredicting: (status: boolean) => void;
  setShowMediaModal: (val: boolean) => void;
  setSleepMode: (val: boolean) => void;
  incrementFrequency: (node: string) => void;
  reoptimizeLayout: () => void;
  setActiveTone: (tone: string | null) => void;
  setAmbientContext: (context: string) => void;
  setIsListening: (status: boolean) => void;
  setIsTranscribing: (status: boolean) => void;
  setSttDownloadProgress: (progress: number) => void;
  setSttReady: (status: boolean) => void;
  setLiveCaption: (caption: string) => void;
  setSttError: (error: string | null) => void;
}

const defaultBlocks = ["Physical", "Social", "Pain", "Adjust", "Yes", "No", "Hungry", "Thirsty", "Entertainment", "Music", "EMERGENCY", "Sleep Mode", "Re-Optimize Layout"];

export const useIrisStore = create<IrisState>((set) => ({
  cursor: { x: 0, y: 0 },
  selectedNodes: [],
  predictions: [],
  isPredicting: false,
  showMediaModal: false,
  sleepMode: false,
  blockFrequencies: {},
  coreBlocks: [...defaultBlocks],
  activeTone: null,
  ambientContext: "",
  isListening: false,
  isTranscribing: false,
  sttDownloadProgress: 0,
  sttReady: false,
  liveCaption: "",
  sttError: null,
  setCursor: (x, y) => set({ cursor: { x, y } }),
  addNode: (node) => set((state) => ({ selectedNodes: [...state.selectedNodes, node] })),
  clearNodes: () => set({ selectedNodes: [], predictions: [] }),
  setPredictions: (words) => set({ predictions: words }),
  setIsPredicting: (status) => set({ isPredicting: status }),
  setShowMediaModal: (val) => set({ showMediaModal: val }),
  setSleepMode: (val) => set({ sleepMode: val }),
  incrementFrequency: (node) => set((state) => {
    const newFreqs = { ...state.blockFrequencies };
    newFreqs[node] = (newFreqs[node] || 0) + 1;
    return { blockFrequencies: newFreqs };
  }),
  reoptimizeLayout: () => set((state) => {
    // Sort blocks based on frequency (highest first)
    const sorted = [...state.coreBlocks].sort((a, b) => {
      const freqA = state.blockFrequencies[a] || 0;
      const freqB = state.blockFrequencies[b] || 0;
      return freqB - freqA; // descending
    });
    // In a 4x4 grid (or similar), indices that are closest to center are roughly in the middle of the array.
    // For simplicity, we define an optimal center-out index mapping for an array of 13 items.
    // Optimal visual indices for 4 columns: center blocks are 5, 6, 9, 10
    const optimalIndices = [5, 6, 9, 10, 4, 7, 8, 11, 1, 2, 0, 3, 12];
    const newGrid = new Array(sorted.length);
    sorted.forEach((block, i) => {
      const targetIndex = optimalIndices[i] !== undefined ? optimalIndices[i] : i;
      newGrid[targetIndex] = block;
    });
    return { coreBlocks: newGrid };
  }),
  setActiveTone: (tone) => set({ activeTone: tone }),
  setAmbientContext: (context) => set({ ambientContext: context }),
  setIsListening: (status) => set({ isListening: status }),
  setIsTranscribing: (status) => set({ isTranscribing: status }),
  setSttDownloadProgress: (progress) => set({ sttDownloadProgress: progress }),
  setSttReady: (status) => set({ sttReady: status }),
  setLiveCaption: (caption) => set({ liveCaption: caption }),
  setSttError: (error) => set({ sttError: error }),
}));
