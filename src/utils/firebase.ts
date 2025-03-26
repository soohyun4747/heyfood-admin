import { db, storage } from 'config/firebase';
import {
	collection,
	deleteDoc,
	doc,
	DocumentData,
	endAt,
	getCountFromServer,
	getDoc,
	getDocs,
	limit,
	orderBy,
	query,
	QueryConstraint,
	QueryDocumentSnapshot,
	QuerySnapshot,
	setDoc,
	startAfter,
	startAt,
	updateDoc,
	where,
} from 'firebase/firestore';
import { Dispatch, SetStateAction } from 'react';
import {
	deleteObject,
	getDownloadURL,
	ref,
	uploadBytes,
} from 'firebase/storage';
import { message, UploadFile } from 'antd';
import { UploadFileStatus } from 'antd/es/upload/interface';
import { getOriginFileObj } from './image';

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

export const fetchTableData = async (
	collectionName: string,
	startDocInfo: StartDocInfo | undefined,
	pageSize: number,
	page: number,
	total: number,
	setLoading: (value: boolean) => void,
	setRowData: ((value: React.SetStateAction<any[]>) => void) | undefined,
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
						collection(db, collectionName),
						...queryConstraints,
						limit(pageSize)
				  )
				: query(
						collection(db, collectionName),
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
						collection(db, collectionName),
						...queryConstraints,
						limit(total % pageSize)
				  )
				: query(
						collection(db, collectionName),
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
							collection(db, collectionName),
							...queryConstraints,
							startAt(startDocInfo.doc),
							limit(
								(pageIdx - startDocInfo.pageIdx + 1) * pageSize
							)
					  )
					: query(
							collection(db, collectionName),
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
							collection(db, collectionName),
							...queryConstraints,
							startAfter(startDocInfo.doc),
							limit((startDocInfo.pageIdx - pageIdx) * pageSize)
					  )
					: query(
							collection(db, collectionName),
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

		if (setRowData) {
			setRowData(newData);
		}
		setLoading(false);
		return newData;

	} catch (error) {
		console.error('Error fetching data:', error);
		setLoading(false);
	}
};

export const fetchLogWholeData = async (collectionName: string) => {
	try {
		const q = query(
			collection(db, collectionName),
			orderBy('createdAt', 'desc')
		);

		const querySnapshot = await getDocs(q);
		console.log(querySnapshot.docs.map((doc) => doc.data()));
	} catch (error) {
		console.log(error);
	}
};

export const fetchSearchData = async (
	collectionName: string,
	startDocInfo: StartDocInfo | undefined,
	pageSize: number,
	page: number,
	filter: { value: string | undefined; field: string } | undefined,
	search: { value: string | undefined; field: string },
	setLoading: (value: React.SetStateAction<boolean>) => void,
	setRowData: ((value: React.SetStateAction<any[]>) => void) | undefined,
	setStartDocInfo: React.Dispatch<
		React.SetStateAction<StartDocInfo | undefined>
	>,
	setTotalCount: (value: React.SetStateAction<number>) => void // For setting total count
) => {
	const qConstraintsFilter = filter
		? [where(filter.field, '==', filter.value)]
		: [];
	const qContraintsSearch = search.value
		? [
				orderBy(search.field),
				startAt(search.value),
				endAt(search.value + '\uf8ff'),
		  ]
		: [];

	const qConstraintsSearchForCount = search.value
		? [
				where(search.field, '>=', search.value),
				where(search.field, '<=', search.value + '\uf8ff'),
		  ]
		: [];

	try {
		// Total count query (no pagination, just count)
		const countQuery = query(
			collection(db, collectionName),
			...qConstraintsFilter,
			...qConstraintsSearchForCount
		);
		const countSnapshot = await getCountFromServer(countQuery);
		const totalCount = countSnapshot.data().count;

		// Set the total count
		setTotalCount(totalCount);

		return await fetchTableData(
			collectionName,
			startDocInfo,
			pageSize,
			page,
			totalCount,
			setLoading,
			setRowData,
			setStartDocInfo,
			[...qConstraintsFilter, ...qContraintsSearch]
		);
	} catch (error) {
		console.error(`Error fetching ${collectionName}:`, error);
	}
};

export const fetchDataWithDocId = async (
	collectionName: string,
	id: string,
	setData?: Dispatch<SetStateAction<any>>
) => {
	try {
		const docRef = doc(db, collectionName, id);
		const docSnap = await getDoc(docRef);

		if (docSnap.exists()) {
			const data = { id: docSnap.id, ...docSnap.data() };
			if (setData) {
				setData(data);
			}
			return data as any;
		} else {
			console.error(`No such document with id ${id}!`);
		}
	} catch (err) {
		console.error('Error fetching document:', err);
	}
};

export const fetchCollectionData = async (
	collectionName: string,
	setData?: Dispatch<SetStateAction<any>>
) => {
	try {
		const querySnapshot = await getDocs(collection(db, collectionName));
		const documents = querySnapshot.docs.map((doc) => ({
			id: doc.id, // 문서 ID 포함
			...doc.data(), // 문서 데이터 포함
		}));
		if (setData) {
			setData(documents);
		}
		return documents;
	} catch (err) {
		console.error('Error fetching collection:', err);
	}
};

export const uploadFileData = async (file: UploadFile, path: string) => {
	const fileRef = ref(storage, path); // Firebase Storage의 "uploads" 폴더에 파일 저장

	try {
		// Firebase Storage에 파일 업로드
		if (file.originFileObj) {
			await uploadBytes(fileRef, file.originFileObj);
		} else {
			console.error('no originFileObj in the file');
		}
	} catch (error) {
		console.error(error);
		message.error(`파일 업로드에 실패했습니다`);
	}
};

export const addData = async (collectionName: string, data: any) => {
	try {
		const docRef = doc(db, collectionName, data.id); // "users" collection and custom document ID
		const { id, ...dataWithoutId } = data;

		await setDoc(docRef, dataWithoutId);
		return true;
	} catch (error) {
		console.error('Error adding document:', error);
		return false;
	}
};

export const updateData = async (collectionName: string, data: any) => {
	try {
		const docRef = doc(db, collectionName, data.id);
		const { id, ...dataWithoutId } = data;

		await updateDoc(docRef, dataWithoutId);
		return true;
	} catch (error) {
		console.error('Error updating document: ', error);
		return false;
	}
};

export const fetchFileData = async (
	paths: string[],
	setFileList?: Dispatch<SetStateAction<UploadFile<any>[]>>
) => {
	const files: UploadFile<any>[] = await Promise.all(
		paths.map(async (path) => {
			try {
				const url = path
					? await getDownloadURL(ref(storage, path))
					: undefined;
				return {
					uid: path, // 고유 ID (파일 경로 사용)
					name: path?.split('/').pop() || 'image.jpg', // 파일 이름
					status: 'done' as UploadFileStatus, // 업로드 완료 상태
					url, // Firebase Storage에서 가져온 다운로드 URL
				};
			} catch (error) {
				console.error('Failed to get image URL:', error);
				return Promise.reject(error);
			}
		})
	);

	if (setFileList) {
		setFileList(files);
	}

	return files;
};

export const deleteData = async (collectionName: string, id: string) => {
	try {
		const docRef = doc(db, collectionName, id); // "users" 컬렉션과 문서 ID로 참조 생성
		await deleteDoc(docRef); // 문서 삭제

		console.log(`Document with ID ${id} deleted successfully!`);
		return true;
	} catch (error) {
		console.error('Error deleting document:', error);
		return false;
	}
};

export const deleteFile = async (filePath: string) => {
	const fileRef = ref(storage, filePath);

	try {
		await deleteObject(fileRef);
		console.log(`Successfully deleted ${filePath}`);
	} catch (error) {
		console.error('Error deleting file:', error);
		throw error;
	}
};
