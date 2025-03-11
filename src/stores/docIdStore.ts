import { create } from 'zustand';

interface DocIdStore {
	id: string | undefined;
	setId: (value: string | undefined) => void;
}

export const useDocIdStore = create<DocIdStore>((set) => {
	return {
		id: undefined,
		setId: (value) => set((state) => ({ id: value })),
	};
});
