import { create } from "zustand";

const MAX_RESULTS = 5;

export type TryOnResult = {
  id: string;
  /** 生成图（含水印），方舟文本模式时可能为空 */
  imageUrl?: string;
  /** 模型返回的试穿分析文案 */
  text?: string;
  createdAt: number;
};

type TryOnState = {
  personPreview: string | null;
  garmentPreviews: string[];
  personFile: File | null;
  garmentFiles: File[];
  results: TryOnResult[];
  activeResultId: string | null;
  setPerson: (file: File, preview: string) => void;
  addGarments: (items: Array<{ file: File; preview: string }>) => void;
  removeGarmentAt: (index: number) => void;
  clearGarments: () => void;
  addResult: (payload: { imageUrl?: string; text?: string }) => void;
  setActiveResult: (id: string | null) => void;
  resetSession: () => void;
};

const empty = (): Pick<
  TryOnState,
  | "personPreview"
  | "garmentPreviews"
  | "personFile"
  | "garmentFiles"
  | "results"
  | "activeResultId"
> => ({
  personPreview: null,
  garmentPreviews: [],
  personFile: null,
  garmentFiles: [],
  results: [],
  activeResultId: null,
});

export const useTryOnStore = create<TryOnState>((set, get) => ({
  ...empty(),

  setPerson: (file, preview) =>
    set({
      personFile: file,
      personPreview: preview,
    }),

  addGarments: (items) =>
    set((state) => ({
      garmentFiles: [...state.garmentFiles, ...items.map((x) => x.file)],
      garmentPreviews: [...state.garmentPreviews, ...items.map((x) => x.preview)],
    })),

  removeGarmentAt: (index) =>
    set((state) => ({
      garmentFiles: state.garmentFiles.filter((_, i) => i !== index),
      garmentPreviews: state.garmentPreviews.filter((_, i) => i !== index),
    })),

  clearGarments: () =>
    set({
      garmentFiles: [],
      garmentPreviews: [],
    }),

  addResult: (payload) => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `r-${Date.now()}`;
    const next: TryOnResult = {
      id,
      imageUrl: payload.imageUrl,
      text: payload.text,
      createdAt: Date.now(),
    };
    const list = [...get().results, next];
    const trimmed =
      list.length > MAX_RESULTS ? list.slice(list.length - MAX_RESULTS) : list;
    set({
      results: trimmed,
      activeResultId: id,
    });
  },

  setActiveResult: (id) => set({ activeResultId: id }),

  resetSession: () => set(empty()),
}));
