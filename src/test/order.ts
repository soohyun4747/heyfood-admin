import {
	getFirestore,
	collection,
	addDoc,
	Timestamp,
} from 'firebase/firestore';
import { fakerKO as faker } from '@faker-js/faker';
import { IUser } from 'templates/UsersTemplate';
import { OrderData, OrderItemData } from 'templates/OrdersTemplate';
import { db } from 'config/firebase';

const geteCategoryId = (menuId: string) => {
	switch (menuId) {
		case '김밥샌드위치':
		case '김밥닭강정':
			return '김밥도시락';

		case '소고기덮밥':
		case '제육덮밥':
		case '불고기덮밥':
			return '덮밥도시락';

		case '참치김밥':
		case '돈까스김밥':
		case '델리김밥':
			return '김밥한줄';

		case '풍성다과박스':
		case '알찬다과박스':
			return '다과박스';
		default:
			return '김밥도시락F'
	}
};

// 🔹 메뉴 ID 배열 (사용자가 제공)
const menuIds = [
	'김밥샌드위치',
	'김밥닭강정',
	'소고기덮밥',
	'제육덮밥',
	'불고기덮밥',
	'참치김밥',
	'돈까스김밥',
	'델리김밥',
	'풍성다과박스',
	'알찬다과박스',
];

// export const generateRandomOrderData = async (
// 	userCount: number = 5,
// 	orderCount: number = 5,
// 	orderItemsPerOrder: number = 3
// ) => {
// 	const usersRef = collection(db, 'users');
// 	// const guestsRef = collection(db, 'guests');
// 	const ordersRef = collection(db, 'orders');
// 	const orderItemsRef = collection(db, 'orderItems');

// 	const users: IUser[] = [];
// 	const helpers = faker.helpers as any;

// 	console.log('🔹 [Step 1] Adding Users...');
// 	await Promise.all(
// 		Array.from({ length: userCount }).map(async (_, i) => {
// 			const user: Omit<IUser, 'id'> = {
// 				name: faker.person.fullName(),
// 				email: faker.internet.email(),
// 				phone: `010-${faker.number.int({
// 					min: 1000,
// 					max: 9999,
// 				})}-${faker.number.int({ min: 1000, max: 9999 })}`,
// 				address: `부산광역시 ${faker.location.city()} ${faker.location.street()}`, // 랜덤 한국 주소
// 				addressDetail: `${faker.number.int({
// 					min: 1,
// 					max: 30,
// 				})}동 ${faker.number.int({ min: 101, max: 2000 })}호`,
// 				createdAt: Timestamp.fromDate(faker.date.recent()),
// 			};

// 			const docRef = await addDoc(usersRef, user);
// 			users.push({ ...user, id: docRef.id });
// 			console.log(`✅ User ${i + 1} added: ${docRef.id}`);
// 		})
// 	);

// 	const orderIds: string[] = [];

// 	console.log('\n🔹 [Step 2] Adding Orders...');
// 	const orderers: IUser[] = [];

// 	await Promise.all(
// 		Array.from({ length: orderCount }).map(async (_, i) => {
// 			orderers.push(helpers.arrayElement(users));
// 			const order: Omit<OrderData, 'id'> = {
// 				ordererId: orderers[i].id,
// 				ordererType: helpers.arrayElement(['user']),
// 				address: faker.location.streetAddress(),
// 				addressDetail: faker.location.secondaryAddress(),
// 				paymentMethodId: helpers.arrayElement([
// 					'offlinePayment',
// 					'onlinePayment',
// 					'bankTransfer',
// 				]),
// 				createdAt: Timestamp.fromDate(faker.date.recent()),
// 			};

// 			const docRef = await addDoc(ordersRef, order);
// 			orderIds.push(docRef.id);
// 			console.log(`✅ Order ${i + 1} added: ${docRef.id}`);
// 		})
// 	);

// 	console.log('\n🔹 [Step 3] Adding OrderItems...');
// 	await Promise.all(
// 		orderIds.map(async (orderId, i) => {
// 			await Promise.all(
// 				Array.from({ length: orderItemsPerOrder }).map(async (_, j) => {
// 					const menuId = helpers.arrayElement(menuIds);

// 					const orderItem: Omit<OrderItemData, 'id'> = {
// 						orderId,
// 						ordererName: orderers[i].name,
// 						menuId: menuId,
// 						categoryId: geteCategoryId(menuId),
// 						quantity: faker.number.int({ min: 1, max: 5 }),
// 						deliveryDate: Timestamp.fromDate(faker.date.future()),
// 						createdAt: Timestamp.fromDate(faker.date.recent()),
// 					};

// 					await addDoc(orderItemsRef, orderItem);
// 				})
// 			);
// 			console.log(`✅ OrderItems for Order ${i + 1} added.`);
// 		})
// 	);

// 	console.log('\n🚀 모든 랜덤 데이터가 Firestore에 추가되었습니다!');
// };
