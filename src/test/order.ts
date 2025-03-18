import {
	getFirestore,
	collection,
	addDoc,
	Timestamp,
} from 'firebase/firestore';
import { fakerKO as faker } from "@faker-js/faker";
import { GuestData, UserData } from 'templates/UsersTemplate';
import { OrderData, OrderItemData } from 'templates/OrdersTemplate';
import { db } from 'config/firebase';

// 🔹 메뉴 ID 배열 (사용자가 제공)
const menuIds = [
	'07d903e3-34aa-4a0f-a29e-01a53c3ab15d',
	'1d44c14a-7d76-403b-b730-60771f426c31',
	'31e8c0f6-c2a0-4e0b-b32b-d2274712f9ed',
	'3b81538a-e71f-4ccb-a902-90a873357ec0',
	'437843b7-f050-46a1-ae12-7f883d5bce4c',
	'541e8f1e-166b-4389-9575-95d135a6929b',
	'fef574e8-e537-491b-81ac-6f9584500758',
	'e8cec960-5cf7-415a-95fd-ead747432da6',
	'e87b76df-543a-48ae-9ab5-197cab4ebfa2',
	'e42e73b7-8fef-472b-9c4c-df6d67e7af9b',
];

export const generateRandomOrderData = async (
	userCount: number = 5,
	orderCount: number = 5,
	orderItemsPerOrder: number = 3
) => {
	// const usersRef = collection(db, 'users');
	const guestsRef = collection(db, 'guests');
	const ordersRef = collection(db, 'orders');
	const orderItemsRef = collection(db, 'orderItems');

	const userIds: string[] = [];
	const helpers = faker.helpers as any;

	console.log('🔹 [Step 1] Adding Users...');
	await Promise.all(
		Array.from({ length: userCount }).map(async (_, i) => {
			const user: Omit<GuestData, 'id'> = {
				name: faker.person.fullName(),
				// email: faker.internet.email(),
				phone: `010-${faker.number.int({
					min: 1000,
					max: 9999,
				})}-${faker.number.int({ min: 1000, max: 9999 })}`,
				address: `${faker.location.city()} ${faker.location.street()}`,
				addressDetail: `${faker.number.int({
					min: 1,
					max: 30,
				})}동 ${faker.number.int({ min: 101, max: 2000 })}호`,
				createdAt: Timestamp.fromDate(faker.date.recent()),
			};

			const docRef = await addDoc(guestsRef, user);
			userIds.push(docRef.id);
			console.log(`✅ User ${i + 1} added: ${docRef.id}`);
		})
	);

	const orderIds: string[] = [];

	console.log('\n🔹 [Step 2] Adding Orders...');
	await Promise.all(
		Array.from({ length: orderCount }).map(async (_, i) => {
			const order: Omit<OrderData, 'id'> = {
				ordererId: helpers.arrayElement(userIds),
				ordererType: helpers.arrayElement(['guest']),
				deliveryDate: Timestamp.fromDate(faker.date.future()),
				address: faker.location.streetAddress(),
				addressDetail: faker.location.secondaryAddress(),
				paymentMethod: helpers.arrayElement([
					'offlinePayment',
					'onlinePayment',
					'bankTransfer',
				]),
				createdAt: Timestamp.fromDate(faker.date.recent()),
			};

			const docRef = await addDoc(ordersRef, order);
			orderIds.push(docRef.id);
			console.log(`✅ Order ${i + 1} added: ${docRef.id}`);
		})
	);

	console.log('\n🔹 [Step 3] Adding OrderItems...');
	await Promise.all(
		orderIds.map(async (orderId, i) => {
			await Promise.all(
				Array.from({ length: orderItemsPerOrder }).map(async (_, j) => {
					const orderItem: Omit<OrderItemData, 'id'> = {
						orderId,
						menuId: helpers.arrayElement(menuIds),
						quantity: faker.number.int({ min: 1, max: 5 }),
						createdAt: Timestamp.fromDate(faker.date.recent()),
					};

					await addDoc(orderItemsRef, orderItem);
				})
			);
			console.log(`✅ OrderItems for Order ${i + 1} added.`);
		})
	);

	console.log('\n🚀 모든 랜덤 데이터가 Firestore에 추가되었습니다!');
};
