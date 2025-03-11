import { db } from 'config/firebase';
import {
	collection,
	DocumentData,
	getCountFromServer,
	getDocs,
	limit,
	orderBy,
	query,
	QueryConstraint,
	QueryDocumentSnapshot,
	QuerySnapshot,
	startAfter,
	startAt,
	where,
} from 'firebase/firestore';

export interface StartDocInfo {
	pageIdx: number;
	doc: QueryDocumentSnapshot<DocumentData, DocumentData>;
}

export const fetchTotalCount = async (path: string) => {
	try {
		const querySnapshot = await getDocs(collection(db, path));
		return querySnapshot.size; // `size` will give the number of documents in the snapshot
	} catch (error) {
		console.error('Error fetching user count:', error);
	}
};

export const fetchData = async (
	path: string,
	startDocInfo: StartDocInfo | undefined,
	pageSize: number,
	page: number,
	total: number,
	setLoading: (value: boolean) => void,
	setRowData: (value: React.SetStateAction<any[]>) => void,
	setStartDocInfo: React.Dispatch<
		React.SetStateAction<StartDocInfo | undefined>
	>,
	queryConstraints?: QueryConstraint[]
) => {
	try {
		setLoading(true);

		const pageIdx = page - 1;
		const lastPage = Math.ceil(total / pageSize);

		let q;
		let newData: any[] = [];
		let querySnapshot: QuerySnapshot<DocumentData, DocumentData> | null =
			null;
		let startDocIdx = 0;

		if (page === 1) {
			q = queryConstraints
				? query(
						collection(db, path),
						...queryConstraints,
						limit(pageSize)
				  )
				: query(
						collection(db, path),
						orderBy('createdAt', 'desc'),
						limit(pageSize)
				  );

			querySnapshot = await getDocs(q);
			newData = querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}));
		} else if (page === lastPage) {
			q = queryConstraints
				? query(
						collection(db, path),
						...queryConstraints,
						limit(total % pageSize)
				  )
				: query(
						collection(db, path),
						orderBy('createdAt'),
						limit(total % pageSize)
				  );
			querySnapshot = await getDocs(q);
			startDocIdx = querySnapshot.docs.length - 1;
			for (let i = startDocIdx; 0 <= i; i--) {
				const doc = querySnapshot.docs[i];
				newData.push({ id: doc.id, ...doc.data() });
			}
		} else {
			if (startDocInfo && startDocInfo.pageIdx < pageIdx) {
				q = queryConstraints
					? query(
							collection(db, path),
							...queryConstraints,
							startAt(startDocInfo.doc),
							limit(
								(pageIdx - startDocInfo.pageIdx + 1) * pageSize
							)
					  )
					: query(
							collection(db, path),
							orderBy('createdAt', 'desc'),
							startAt(startDocInfo.doc),
							limit(
								(pageIdx - startDocInfo.pageIdx + 1) * pageSize
							)
					  );
				querySnapshot = await getDocs(q);
				startDocIdx = (pageIdx - startDocInfo.pageIdx) * pageSize;
				for (let i = startDocIdx; i < querySnapshot.docs.length; i++) {
					const doc = querySnapshot.docs[i];
					newData.push({ id: doc.id, ...doc.data() });
				}
			} else if (startDocInfo && pageIdx < startDocInfo.pageIdx) {
				q = queryConstraints
					? query(
							collection(db, path),
							...queryConstraints,
							startAfter(startDocInfo.doc),
							limit((startDocInfo.pageIdx - pageIdx) * pageSize)
					  )
					: query(
							collection(db, path),
							orderBy('createdAt'),
							startAfter(startDocInfo.doc),
							limit((startDocInfo.pageIdx - pageIdx) * pageSize)
					  );
				querySnapshot = await getDocs(q);
				startDocIdx = querySnapshot.docs.length - 1;

				for (
					let i = startDocIdx;
					querySnapshot.docs.length - 1 - pageSize < i;
					i--
				) {
					const doc = querySnapshot.docs[i];
					newData.push({ id: doc.id, ...doc.data() });
				}
			}
		}

		if (querySnapshot) {
			setStartDocInfo({
				pageIdx: page - 1,
				doc: querySnapshot.docs[startDocIdx],
			});
		}

		setRowData(newData);
		setLoading(false);
	} catch (error) {
		console.error('Error fetching users:', error);
		setLoading(false);
	}
};

export const fetchLogWholeData = async (path: string) => {
	try {
		const q = query(collection(db, path), orderBy('createdAt', 'desc'));

		const querySnapshot = await getDocs(q);
		console.log(querySnapshot.docs.map((doc) => doc.data()));
	} catch (error) {
		console.log(error);
	}
};

export const fetchSearchData = async (
	path: string,
	startDocInfo: StartDocInfo | undefined,
	pageSize: number,
	page: number,
	search: { value: string | undefined; field: string },
	total: number,
	setLoading: (value: React.SetStateAction<boolean>) => void,
	setRowData: (value: React.SetStateAction<any[]>) => void,
	setStartDocInfo: React.Dispatch<
		React.SetStateAction<StartDocInfo | undefined>
	>,
	setTotalCount: (value: React.SetStateAction<number>) => void // For setting total count
) => {
	await fetchData(
		path,
		startDocInfo,
		pageSize,
		page,
		total,
		setLoading,
		setRowData,
		setStartDocInfo,
		[
			orderBy(search.field),
			where(search.field, '>=', search.value),
			where(search.field, '<=', search.value + '\uf8ff'),
		]
	);
	try {
		// Total count query (no pagination, just count)
		const countQuery = query(
			collection(db, 'users'),
			where(search.field, '>=', search.value),
			where(search.field, '<=', search.value + '\uf8ff')
		);
		const countSnapshot = await getCountFromServer(countQuery);
		const totalCount = countSnapshot.data().count;

		// Set the total count
		setTotalCount(totalCount);
	} catch (error) {
		console.error('Error fetching users:', error);
	}
};
