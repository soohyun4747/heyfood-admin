import { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
	collection,
	getCountFromServer,
	getDocs,
	query,
	QueryConstraint,
} from 'firebase/firestore';
import {
	collNameGuests,
	collNameOrders,
	OrderData,
	ordererType,
	OrderItemData,
} from 'templates/OrdersTemplate';
import { db } from 'config/firebase';
import { collNameUsers, IUser } from 'templates/UsersTemplate';
import { collNameMenus, MenuData } from 'templates/MenusTemplate';
import { Button, message } from 'antd';
import { FileExcelFilled } from '@ant-design/icons';
import { fetchDataWithDocId } from 'utils/firebase';
import {
	formatTimestampToDate,
	formatTimestampToDateTime,
	formatTimestampToTime,
} from 'utils/time';
import FullPageLoader from './PageLoader';

interface OrderExcel {
	no: number;
	orderTime: string;
	orderDate: string;
	ordererId: string;
	ordererName: string;
	address: string;
	recipient: string;
	contact: string;
	email: string;
	deliveryDate: string;
	driver: string;
	menuName: string;
	quantity: number;
	price: number;
	vat: number;
	total: number;
}

export const ExcelButton = ({
	qConstraints,
}: {
	qConstraints: QueryConstraint[];
}) => {
	const [loading, setLoading] = useState<boolean>(false);
	const [messageApi, contextHolder] = message.useMessage();
	const [orders, setOrders] = useState<OrderData[]>([]);
	const [menus, setMenus] = useState<MenuData[]>([]);
	const [orderers, setOrderers] = useState<IUser[]>([]);

	const handleExport = async () => {
		try {
			const q = query(collection(db, 'orderItems'), ...qConstraints);
			const totalCountSnapshot = await getCountFromServer(q);

			if (totalCountSnapshot.data().count > 5000) {
				messageApi.open({
					type: 'error',
					content:
						'데이터 개수가 5000개 이하일 때 다운로드가 가능합니다.',
				});
				return;
			}
			setLoading(true);
			const querySnapshot = await getDocs(q);
			const orderExcelData: OrderExcel[] = [];

			let count = 1;
			for (const doc of querySnapshot.docs) {
				const data = doc.data() as OrderItemData;

				let orderData: OrderData | undefined = orders.find(
					(order) => order.id === data.orderId
				);

				if (!orderData) {
					orderData = await fetchDataWithDocId(
						collNameOrders,
						data.orderId
					);
					setOrders((prev) => {
						if (orderData) {
							prev.push(orderData);
						}
						return prev;
					});
				}

				let ordererData: IUser | undefined = orderers.find(
					(orderer) => orderer.id === orderData?.ordererId
				);

				if (!ordererData && orderData) {
					ordererData = await fetchDataWithDocId(
						orderData.ordererType === ordererType.user
							? collNameUsers
							: collNameGuests,
						orderData.ordererId
					);
					setOrderers((prev) => {
						if (ordererData) {
							prev.push(ordererData);
						}
						return prev;
					});
				}

				let menuData: MenuData | undefined = menus.find(
					(menu) => menu.id === data.menuId
				);

				if (!menuData) {
					menuData = await fetchDataWithDocId(
						collNameMenus,
						data.menuId
					);
					setMenus((prev) => {
						if (menuData) {
							prev.push(menuData);
						}
						return prev;
					});
				}

				if (orderData && menuData && ordererData) {
					const vat = (menuData.price / 100) * 10 * data.quantity;

					orderExcelData.push({
						no: count++,
						orderTime: formatTimestampToTime(data.createdAt),
						orderDate: formatTimestampToDate(data.createdAt),
						ordererId: ordererData.id,
						ordererName: ordererData.name,
						address:
							orderData.address + ' ' + orderData.addressDetail,
						recipient: ordererData.name,
						contact: ordererData.phone,
						email: ordererData.email || '',
						deliveryDate: formatTimestampToDateTime(
							data.deliveryDate
						),
						driver: '',
						menuName: data.menuId,
						quantity: data.quantity,
						price: menuData.price,
						vat: vat,
						total: menuData.price * data.quantity + vat,
					});
				}
			}

			const worksheet = XLSX.utils.json_to_sheet(orderExcelData, {
				header: [
					'no',
					'orderTime',
					'orderDate',
					'ordererId',
					'ordererName',
					'address',
					'recipient',
					'contact',
					'email',
					'deliveryDate',
					'driver',
					'menuName',
					'quantity',
					'price',
					'vat',
					'total',
				],
			});

			// 한글 열 이름 지정
			const headers = [
				'No.',
				'주문시간',
				'주문일',
				'주문아이디',
				'업체명&현장명',
				'주문배송지',
				'받는사람',
				'연락처',
				'명세서수신이메일',
				'배송시작일',
				'담당기사',
				'메뉴명',
				'수량',
				'금액',
				'부가세',
				'합계',
			];
			XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A1' });

			const workbook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(workbook, worksheet, '주문 내역');

			const excelBuffer = XLSX.write(workbook, {
				bookType: 'xlsx',
				type: 'array',
			});

			const blob = new Blob([excelBuffer], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			});

			saveAs(blob, `order_export_${new Date().toISOString()}.xlsx`);
			setLoading(false);
		} catch (error) {
			console.error('엑셀 다운로드 오류:', error);
		}
	};

	return (
		<>
			{loading && <FullPageLoader />}
			{contextHolder}
			<Button
				variant='filled'
				color='green'
				icon={<FileExcelFilled />}
				onClick={handleExport}>
				다운로드
			</Button>
		</>
	);
};

export default ExcelButton;
