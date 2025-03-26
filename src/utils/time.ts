import dayjs, { Dayjs } from 'dayjs';
import { Timestamp } from 'firebase/firestore';

export const formatTimestampToDate = (timestamp: Timestamp): string => {
	if (!timestamp || !timestamp.toDate) return '';

	const date = timestamp.toDate(); // Firebase Timestamp → JS Date
	const year = date.getFullYear();
	const month = date.getMonth() + 1; // 0-indexed
	const day = date.getDate();

	return `${year}.${month}.${day}`;
};

export const formatTimestampToTime = (timestamp: Timestamp): string => {
	if (!timestamp || !timestamp.toDate) return '';

	const date = timestamp.toDate(); // Firebase Timestamp → JS Date
	const hours = date.getHours();
	const minutes = String(date.getMinutes()).padStart(2, '0'); // 항상 두 자리로

	return `${hours}:${minutes}`;
};

export const formatTimestampToDateTime = (timestamp: Timestamp): string => {
	if (!timestamp || !timestamp.toDate) return '';

	const date = timestamp.toDate(); // Firebase Timestamp → JS Date
	const year = date.getFullYear();
	const month = date.getMonth() + 1; // 0-indexed
	const day = date.getDate();
	const hours = date.getHours();
	const minutes = String(date.getMinutes()).padStart(2, '0'); // 항상 두 자리로

	return `${year}.${month}.${day} ${hours}:${minutes}`;
};

export const dayjsToTimestamp = (value: Dayjs) => {
	return Timestamp.fromDate(value.toDate());
};

export const timestampToDayjs = (value: Timestamp) => {
	return dayjs(value.toDate());
};

export const getTimestampStartofDay = (date: Dayjs): Timestamp => {
	// Set the time to midnight (00:00:00)
	const startOfDay = date.startOf('day'); // Dayjs의 startOf 메서드를 사용하여 00:00:00로 설정

	// Use Firebase Timestamp to create a Timestamp object
	return Timestamp.fromDate(startOfDay.toDate()); // Dayjs 객체를 Date 객체로 변환 후 Timestamp로 변환
};

export const getTimestampEndofDay = (date: Dayjs): Timestamp => {
	// Set the time to the last moment of the day (23:59:59.999)
	const endOfDay = date.endOf('day'); // Dayjs의 endOf 메서드를 사용하여 23:59:59.999로 설정

	// Use Firebase Timestamp to create a Timestamp object
	return Timestamp.fromDate(endOfDay.toDate()); // Dayjs 객체를 Date 객체로 변환 후 Timestamp로 변환
};
