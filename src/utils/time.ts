export const formatTimestampToDate = (timestamp: any): string => {
	if (!timestamp || !timestamp.toDate) return '';

	const date = timestamp.toDate(); // Firebase Timestamp → JS Date
	const year = date.getFullYear();
	const month = date.getMonth() + 1; // 0-indexed
	const day = date.getDate();

	return `${year}.${month}.${day}`;
};

export const formatTimestampToTime = (timestamp: any): string => {
	if (!timestamp || !timestamp.toDate) return '';

	const date = timestamp.toDate(); // Firebase Timestamp → JS Date
	const hours = date.getHours();
	const minutes = String(date.getMinutes()).padStart(2, '0'); // 항상 두 자리로

	return `${hours}:${minutes}`;
};

export const formatTimestampToDateTime = (timestamp: any): string => {
	if (!timestamp || !timestamp.toDate) return '';

	const date = timestamp.toDate(); // Firebase Timestamp → JS Date
	const year = date.getFullYear();
	const month = date.getMonth() + 1; // 0-indexed
	const day = date.getDate();
	const hours = date.getHours();
	const minutes = String(date.getMinutes()).padStart(2, '0'); // 항상 두 자리로

	return `${year}.${month}.${day} ${hours}:${minutes}`;
};
