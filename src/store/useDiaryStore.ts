import { create } from 'zustand';
import dayjs from 'dayjs';

interface DiaryStore {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  goToPrevDay: () => void;
  goToNextDay: () => void;
}

export const useDiaryStore = create<DiaryStore>((set, get) => ({
  selectedDate: dayjs().format('YYYY-MM-DD'),

  setSelectedDate: (date) => set({ selectedDate: date }),

  goToPrevDay: () =>
    set({
      selectedDate: dayjs(get().selectedDate)
        .subtract(1, 'day')
        .format('YYYY-MM-DD'),
    }),

  goToNextDay: () =>
    set({
      selectedDate: dayjs(get().selectedDate)
        .add(1, 'day')
        .format('YYYY-MM-DD'),
    }),
}));
