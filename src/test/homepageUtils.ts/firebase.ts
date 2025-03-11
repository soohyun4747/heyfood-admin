import { db } from 'config/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { UserData } from 'templates/UsersTemplate';

export const regions: { [key: string]: string } = {
	bukgu: '/regions/bukgu',
	busanjingu: '/regions/busanjingu',
	dongraegu: '/regions/dongraegu',
	dongu: '/regions/dongu',
	gangseogu: '/regions/gangseogu',
	geumjeongu: '/regions/geumjeongu',
	gijangun: '/regions/gijangun',
	haeundaegu: '/regions/haeundaegu',
	jungu: '/regions/jungu',
	namgu: '/regions/namgu',
	sahagu: '/regions/sahagu',
	sasangu: '/regions/sasangu',
	seogu: '/regions/seogu',
	suyeongu: '/regions/suyeongu',
	yeongdogu: '/regions/yeongdogu',
	yeonjaegu: '/regions/yeonjaegu',
};

const regionsKorean = {
	북구: 'bukgu',
	부산진구: 'busanjingu',
	동래구: 'dongraegu',
	동구: 'dongu',
	강서구: 'gangseogu',
	금정구: 'geumjeongu',
	해운대구: 'haeundaegu',
	중구: 'jungu',
	남구: 'namgu',
	사하구: 'sahagu',
	사상구: 'sasangu',
	서구: 'seogu',
	수영구: 'suyeongu',
	영도구: 'yeongdogu',
	연제구: 'yeonjaegu',
};

export const addUser = async (userData: Omit<UserData, 'id'>) => {
	try {
		await addDoc(collection(db, 'users'), userData);
	} catch (error) {
		console.error('Error adding document: ', error);
	}
};

export const getRegionId = (address: string) => {
	const regionsKoreanKeys = Object.keys(regionsKorean);
	let regionId = '';

	for (let i = 0; i < regionsKoreanKeys.length; i++) {
		if (containsWholeWord(address, regionsKoreanKeys[i])) {
			regionId = regions[regionsKoreanKeys[i]];
			break;
		}
	}
};

const containsWholeWord = (text: string, word: string): boolean => {
	if (!text || !word) return false;

	// Match whole words, considering spaces and punctuation
	const regex = new RegExp(`(^|\\s|[.,!?])${word}($|\\s|[.,!?])`, 'u');
	return regex.test(text);
};
