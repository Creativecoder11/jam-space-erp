import { create } from "zustand";

interface ProjectFilters {
  search: string;
  status: string;
  type: string;
  page: number;
  pageSize: number;
}

interface ProjectState {
  filters: ProjectFilters;
  setSearch: (search: string) => void;
  setStatus: (status: string) => void;
  setType: (type: string) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
}

const defaultFilters: ProjectFilters = {
  search: "",
  status: "all",
  type: "all",
  page: 1,
  pageSize: 10,
};

export const useProjectStore = create<ProjectState>((set) => ({
  filters: defaultFilters,
  setSearch: (search) => set((state) => ({ filters: { ...state.filters, search, page: 1 } })),
  setStatus: (status) => set((state) => ({ filters: { ...state.filters, status, page: 1 } })),
  setType: (type) => set((state) => ({ filters: { ...state.filters, type, page: 1 } })),
  setPage: (page) => set((state) => ({ filters: { ...state.filters, page } })),
  resetFilters: () => set({ filters: defaultFilters }),
}));
