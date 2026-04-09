import { create } from 'zustand';
import type { Invoice, ChatMessage } from '../types/bill';

interface BillStore {
  // Image
  imageUri: string | null;
  imageBase64: string | null;
  setImage: (uri: string, base64: string) => void;

  // Invoice data
  invoice: Invoice | null;
  setInvoice: (data: Invoice) => void;

  // Chat messages for NL editing
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;

  // Loading states
  isExtracting: boolean;
  isEditing: boolean;
  setExtracting: (v: boolean) => void;
  setEditing: (v: boolean) => void;

  // Error
  error: string | null;
  setError: (e: string | null) => void;

  // PDF
  pdfUri: string | null;
  setPdfUri: (uri: string | null) => void;

  // Reset for new scan
  reset: () => void;
}

export const useBillStore = create<BillStore>((set) => ({
  imageUri: null,
  imageBase64: null,
  setImage: (uri, base64) => set({ imageUri: uri, imageBase64: base64 }),

  invoice: null,
  setInvoice: (data) => set({ invoice: data }),

  chatMessages: [],
  addChatMessage: (msg) =>
    set((state) => ({ chatMessages: [...state.chatMessages, msg] })),

  isExtracting: false,
  isEditing: false,
  setExtracting: (v) => set({ isExtracting: v }),
  setEditing: (v) => set({ isEditing: v }),

  error: null,
  setError: (e) => set({ error: e }),

  pdfUri: null,
  setPdfUri: (uri) => set({ pdfUri: uri }),

  reset: () =>
    set({
      imageUri: null,
      imageBase64: null,
      invoice: null,
      chatMessages: [],
      isExtracting: false,
      isEditing: false,
      error: null,
      pdfUri: null,
    }),
}));
