"use client";

import { create } from "zustand";
import type { GameSnapshot } from "@kartu-satu/shared";
import { diffSnapshots, type UiEvent } from "./events";

interface RoomStore {
  snapshot: GameSnapshot | null;
  events: UiEvent[];
  error: string;
  setSnapshot: (snapshot: GameSnapshot | null) => void;
  dismissEvent: (id: number) => void;
  setError: (error: string) => void;
  reset: () => void;
}

const MAX_VISIBLE_EVENTS = 4;

export const useRoomStore = create<RoomStore>((set, get) => ({
  snapshot: null,
  events: [],
  error: "",
  setSnapshot: (snapshot) => {
    if (!snapshot) {
      set({ snapshot: null });
      return;
    }

    const fresh = diffSnapshots(get().snapshot, snapshot);
    set((state) => ({
      snapshot,
      events: [...state.events, ...fresh].slice(-MAX_VISIBLE_EVENTS)
    }));
  },
  dismissEvent: (id) => set((state) => ({ events: state.events.filter((event) => event.id !== id) })),
  setError: (error) => set({ error }),
  reset: () => set({ snapshot: null, events: [], error: "" })
}));
