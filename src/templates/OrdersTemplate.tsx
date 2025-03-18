import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { CommonTemplate } from './CommonTemplate';
import {
	Input,
	Pagination,
	Radio,
	RadioChangeEvent,
	Select,
	Table,
} from 'antd';
import {
	fetchCollectionData,
	fetchDataWithDocId,
	fetchSearchData,
	fetchTableData,
	fetchTotalCount,
	StartDocInfo,
} from 'utils/firebase';
import { PAGE_SIZE } from 'const/table';
import {
	categoryAllValue,
	collNameMenuCategories,
	collNameMenus,
	MenuCategory,
	MenuData,
} from './MenusTemplate';
import {
	collection,
	count,
	DocumentData,
	endAt,
	getCountFromServer,
	getDocs,
	limit,
	orderBy,
	Query,
	query,
	startAt,
	Timestamp,
	where,
} from 'firebase/firestore';
import { ColumnsType } from 'antd/es/table';
import { collNameUsers, GuestData, UserData } from './UsersTemplate';
import { useNavigate } from 'react-router-dom';
import { useDocIdStore } from 'stores/docIdStore';
import { pathNames } from 'const/pathNames';
import { db } from 'config/firebase';
import { log } from 'node:console';

const searchFieldOrdererName = 'ordererName';
const searchFieldMenuName = 'menuName';

const searchFieldOptions = [
	{ value: searchFieldOrdererName, label: '주문자명' },
	{ value: searchFieldMenuName, label: '메뉴명' },
];

const collNameOrders = 'orders';
const collNameOrderItems = 'orderItems';
const collNameGuests = 'guests';

export const ordererType = {
	user: 'user',
	guest: 'guest',
} as const;

export type OrdererType = (typeof ordererType)[keyof typeof ordererType];

export const paymentMethod = {
	onlinePayment: 'onlinePayment',
	offlinePayment: 'offlinePayment',
	bankTranfer: 'bankTransfer',
} as const;

export type PaymentMethod = (typeof paymentMethod)[keyof typeof paymentMethod];

export interface OrderData {
	id: string;
	ordererId: string;
	ordererType: OrdererType;
	deliveryDate: Timestamp;
	address: string;
	addressDetail: string;
	comment?: string;
	paymentMethod: PaymentMethod;
	createdAt: Timestamp;
	updatedAt?: Timestamp;
}

export interface OrderItemData {
	id: string;
	orderId: string;
	menuId: string;
	quantity: number;
	createdAt: Timestamp;
	updatedAt?: Timestamp;
}

interface OrderRowData extends OrderData {
	menuId: string;
	quantity: number;
}

export function OrdersTemplate() {
	const [total, setTotal] = useState(0);
	const [searchValue, setSearchValue] = useState<string>();
	const [searchField, setSearchField] = useState<string>(
		searchFieldOptions[0].value
	);
	const [startDocInfo, setStartDocInfo] = useState<StartDocInfo>();
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedMenuCategory, setSelectedMenuCategory] =
		useState<string>(categoryAllValue);
	const [loading, setLoading] = useState(false);
	const [rowData, setRowData] = useState<OrderRowData[]>([]);
	const [menuCategories, setMenuCategories] = useState<MenuCategory[]>();
	const [menuList, setMenuList] = useState<MenuData[]>([]);
	const [ordererNames, setOrdererNames] = useState<Record<string, string>>(
		{}
	);

	const { Search } = Input;

	const navigte = useNavigate();
	const setDocId = useDocIdStore((state) => state.setId);

	useEffect(() => {
		initFetchData();
	}, []);

	useEffect(() => {
		fetchOrdererNames();
	}, [rowData]); // rowData가 변경될 때마다 실행

	const initFetchData = async () => {
		fetchFilteredSearchOrdererName(
			undefined,
			undefined,
			startDocInfo,
			currentPage,
			PAGE_SIZE,
			setLoading,
			setTotal,
			setStartDocInfo,
			setRowData
		);

		fetchCollectionData(collNameMenus, setMenuList);
		fetchCollectionData(collNameMenuCategories, setMenuCategories);
	};

	const fetchOrdererNames = async () => {
		const namesMap: Record<string, string> = {};

		for (const order of rowData) {
			const collName =
				order.ordererType === ordererType.guest
					? collNameGuests
					: collNameUsers;
			const ordererInfo = await fetchDataWithDocId(
				collName,
				order.ordererId
			);
			namesMap[order.ordererId] = ordererInfo?.name;
		}

		setOrdererNames(namesMap);
	};

	const onChangeSearchField = (value: string) => {
		setSearchValue(undefined);
		setStartDocInfo(undefined);
		setCurrentPage(1);
		setSearchField(value);

		if (value === searchFieldOrdererName) {
			fetchFilteredSearchOrdererName(
				selectedMenuCategory === categoryAllValue
					? undefined
					: selectedMenuCategory,
				undefined,
				undefined,
				1,
				PAGE_SIZE,
				setLoading,
				setTotal,
				setStartDocInfo,
				setRowData
			);
		} else {
			fetchFilteredSearchMenuName(
				selectedMenuCategory === categoryAllValue
					? undefined
					: selectedMenuCategory,
				undefined,
				undefined,
				1,
				PAGE_SIZE,
				setLoading,
				setTotal,
				setStartDocInfo,
				setRowData
			);
		}
	};

	const onChangeSearchValue = async (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		setSearchValue(e.target.value);
		setStartDocInfo(undefined);
		setCurrentPage(1);

		if (searchField === searchFieldOrdererName) {
			fetchFilteredSearchOrdererName(
				selectedMenuCategory === categoryAllValue
					? undefined
					: selectedMenuCategory,
				e.target.value,
				undefined,
				1,
				PAGE_SIZE,
				setLoading,
				setTotal,
				setStartDocInfo,
				setRowData
			);
		} else {
			fetchFilteredSearchMenuName(
				selectedMenuCategory === categoryAllValue
					? undefined
					: selectedMenuCategory,
				e.target.value,
				undefined,
				1,
				PAGE_SIZE,
				setLoading,
				setTotal,
				setStartDocInfo,
				setRowData
			);
		}
	};

	const onSelectMenuCategory = async (e: RadioChangeEvent) => {
		setSelectedMenuCategory(e.target.value);

		if (searchField === searchFieldOrdererName) {
			fetchFilteredSearchOrdererName(
				e.target.value === categoryAllValue
					? undefined
					: e.target.value,
				searchValue,
				startDocInfo,
				1,
				PAGE_SIZE,
				setLoading,
				setTotal,
				setStartDocInfo,
				setRowData
			);
		} else {
			fetchFilteredSearchMenuName(
				e.target.value === categoryAllValue
					? undefined
					: e.target.value,
				searchValue,
				startDocInfo,
				1,
				PAGE_SIZE,
				setLoading,
				setTotal,
				setStartDocInfo,
				setRowData
			);
		}
	};

	const handlePageChange = async (page: number) => {
		setCurrentPage(page);

		if (searchField === searchFieldOrdererName) {
			fetchFilteredSearchOrdererName(
				selectedMenuCategory === categoryAllValue
					? undefined
					: selectedMenuCategory,
				searchValue,
				startDocInfo,
				page,
				PAGE_SIZE,
				setLoading,
				setTotal,
				setStartDocInfo,
				setRowData
			);
		} else {
			fetchFilteredSearchMenuName(
				selectedMenuCategory === categoryAllValue
					? undefined
					: selectedMenuCategory,
				searchValue,
				startDocInfo,
				page,
				PAGE_SIZE,
				setLoading,
				setTotal,
				setStartDocInfo,
				setRowData
			);
		}
	};

	const columns: ColumnsType<OrderRowData> = [
		{
			title: '주문일',
			dataIndex: 'createdAt',
			render: (value: Timestamp) =>
				new Date(
					value.seconds * 1000 + value.nanoseconds / 1000000
				).toLocaleString(),
		},
		{
			title: '배달일',
			dataIndex: 'deliveryDate',
			render: (value: Timestamp) =>
				new Date(
					value.seconds * 1000 + value.nanoseconds / 1000000
				).toLocaleString(),
		},
		{
			title: '주문자명',
			dataIndex: 'ordererId',
			render: (value) => ordererNames[value],
		},
		{
			title: '주소',
			dataIndex: 'address',
		},
		{
			title: '메뉴명',
			dataIndex: 'menuId',
			render: (value) => menuList.find((menu) => menu.id === value)?.name,
		},
		{
			title: '수량',
			dataIndex: 'quantity',
			render: (value) => `${value}개`,
		},
		{
			title: '요청사항',
			dataIndex: 'comment',
		},
		{
			title: '금액',
			dataIndex: 'menuId',
			render: (value, record) => {
				const menuInfo = menuList.find((menu) => menu.id === value);

				if (menuInfo) {
					return `${menuInfo.price * record.quantity}원`;
				}
			},
		},
		{
			title: '',
			fixed: 'right',
			width: 40,
			render: (value, record) => (
				<div
					className='text-blue-400 hover:cursor-pointer'
					onClick={() => {
						setDocId(record.id);
						navigte(pathNames.orderDetail);
					}}>
					보기
				</div>
			),
		},
	];

	return (
		<CommonTemplate
			label={'메뉴관리'}
			allCnt={total}>
			<div className='flex flex-col gap-[12px]'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-[8px]'>
						<Select
							value={searchField}
							style={{ width: 120 }}
							options={searchFieldOptions}
							onChange={onChangeSearchField}
						/>
						<Search
							value={searchValue}
							placeholder='input search text'
							allowClear
							style={{ width: 200 }}
							onChange={onChangeSearchValue}
						/>
					</div>
				</div>
				<Radio.Group
					value={selectedMenuCategory}
					onChange={onSelectMenuCategory}>
					<Radio.Button value={categoryAllValue}>전체</Radio.Button>
					{menuCategories?.map((category) => (
						<Radio.Button
							key={category.id}
							value={category.id}>
							{category.name}
						</Radio.Button>
					))}
				</Radio.Group>
				<Table<OrderRowData>
					size={'small'}
					className={'hey-table'}
					columns={columns}
					rowKey={(record) => record.id}
					dataSource={rowData}
					loading={loading}
					pagination={false}
					scroll={{ y: 600 }} // Enables vertical scroll with 400px height
				/>
				<div className='w-full flex justify-center mt-[36px]'>
					<Pagination
						current={currentPage}
						total={total}
						pageSize={PAGE_SIZE}
						onChange={handlePageChange}
						showSizeChanger={false}
					/>
				</div>
			</div>
		</CommonTemplate>
	);
}

const getCategoryMenuIds = async (categoryId: string) => {
	const menuQuery = query(
		collection(db, collNameMenus),
		where('categoryId', '==', categoryId)
	);
	const menuSnapshot = await getDocs(menuQuery);

	if (menuSnapshot.empty) {
		console.log(`카테고리가 ${categoryId}인 메뉴가 없습니다.`);
		return;
	}

	const validMenuIds = menuSnapshot.docs.map((doc) => doc.id);

	return validMenuIds;
};

const getOrdererIdsContainNameVal = async (value: string) => {
	const queryConstraints = [
		orderBy('name'),
		startAt(value),
		endAt(value + '\uf8ff'),
	];

	//users
	const usersQuery = query(
		collection(db, collNameUsers),
		...queryConstraints
	);
	const usersSnapshot = await getDocs(usersQuery);

	//guests
	const guestsQuery = query(
		collection(db, collNameGuests),
		...queryConstraints
	);
	const guestsSnapshot = await getDocs(guestsQuery);

	//둘다 없는 경우
	if (usersSnapshot.empty && guestsSnapshot.empty) {
		console.log('검색된 주문자가 없습니다.');
		return;
	}

	const userIds = !usersSnapshot.empty
		? usersSnapshot.docs.map((doc) => doc.id)
		: [];

	const guestIds = !guestsSnapshot.empty
		? guestsSnapshot.docs.map((doc) => doc.id)
		: [];

	const ordererIds = [...userIds, ...guestIds];

	return ordererIds;
};

const getMenuIdsContainMenuVal = async (value: string) => {
	const queryConstraints = [
		orderBy('name'),
		startAt(value),
		endAt(value + '\uf8ff'),
	];

	const menusQuery = query(
		collection(db, collNameMenus),
		...queryConstraints
	);
	const menusSnapshot = await getDocs(menusQuery);

	//둘다 없는 경우
	if (menusSnapshot.empty) {
		console.log('검색된 메뉴명이 없습니다.');
		return;
	}

	const menuIds = menusSnapshot.docs.map((doc) => doc.id);

	return menuIds;
};

const getOrderIdsByOrdererIds = async (ordererIds: string[]) => {
	const ordersQuery = query(
		collection(db, collNameOrders),
		where('ordererId', 'in', ordererIds)
	);
	const ordersSnapshot = await getDocs(ordersQuery);

	if (ordersSnapshot.empty) {
		console.log('해당 주문자가 포함된 주문이 없습니다.');
		return;
	}

	return ordersSnapshot.docs.map((doc) => doc.id);
};

const fetchFilteredSearchOrdererName = async (
	categoryId: string | undefined,
	searchName: string | undefined,
	startDocInfo: StartDocInfo | undefined,
	page: number,
	pageSize: number,
	setLoading: (value: boolean) => void,
	setTotal: Dispatch<SetStateAction<number>>,
	setStartDocInfo: React.Dispatch<
		React.SetStateAction<StartDocInfo | undefined>
	>,
	setRowData: (value: React.SetStateAction<OrderRowData[]>) => void
) => {
	try {
		// 1️⃣ 카테고리의 menuId 목록 가져오기
		const validMenuIds = categoryId
			? await getCategoryMenuIds(categoryId)
			: undefined;

		let orderIds = undefined;

		if (searchName) {
			// 2️⃣ 주문자 ID 찾기 (users, guests 컬렉션)
			const ordererIds = await getOrdererIdsContainNameVal(searchName);

			if (ordererIds) {
				// 3️⃣ 해당 주문자의 orderId 찾기 (orders 컬렉션)
				orderIds = await getOrderIdsByOrdererIds(ordererIds);
			}
			if (!orderIds) {
				setTotal(0);
				setRowData([]);
				return;
			}
		}

		const queryConstraints = [];

		if (orderIds) {
			queryConstraints.push(where('orderId', 'in', orderIds));
		}
		if (validMenuIds) {
			queryConstraints.push(where('menuId', 'in', validMenuIds));
		}

		// 4️⃣ 전체 개수 가져오기
		const totalCountQuery = query(
			collection(db, collNameOrderItems),
			...queryConstraints
		);
		const totalCountSnapshot = await getCountFromServer(totalCountQuery);
		const totalCount = totalCountSnapshot.data().count;
		setTotal(totalCount);

		// 5️⃣ 주문 아이템 가져오기 (menuId + orderId 필터링) + 페이지네이션 적용
		const orderItemsData = await fetchTableData(
			collNameOrderItems,
			startDocInfo,
			pageSize,
			page,
			totalCount,
			setLoading,
			undefined,
			setStartDocInfo,
			[...queryConstraints, orderBy('createdAt', 'desc')]
		);
		if (orderItemsData) {
			getSetRowDataWithOrderItems(orderItemsData, setRowData);
		} else {
			setRowData([]);
		}
	} catch (error) {
		console.error('🔥 Error fetching order items:', error);
		return;
	}
};

const getSetRowDataWithOrderItems = async (
	orderItems: OrderItemData[],
	setRowData: (value: React.SetStateAction<OrderRowData[]>) => void
) => {
	//order Item 기준으로 order 정보를 채워서 row data로 넣기
	const orderItemRowData = await Promise.all(
		orderItems.map(async (item) => {
			const order = await fetchDataWithDocId(
				collNameOrders,
				item.orderId
			);
			return { ...order, ...item };
		})
	);

	setRowData(orderItemRowData);
};

const fetchFilteredSearchMenuName = async (
	categoryId: string | undefined,
	searchName: string | undefined,
	startDocInfo: StartDocInfo | undefined,
	page: number,
	pageSize: number,
	setLoading: (value: boolean) => void,
	setTotal: Dispatch<SetStateAction<number>>,
	setStartDocInfo: React.Dispatch<
		React.SetStateAction<StartDocInfo | undefined>
	>,
	setRowData: (value: React.SetStateAction<OrderRowData[]>) => void
) => {
	try {
		// 1️⃣ 카테고리의 menuId 목록 가져오기
		let validMenuIds = categoryId
			? await getCategoryMenuIds(categoryId)
			: undefined;

		if (searchName) {
			// 2️⃣ 메뉴명의 메뉴 ID 찾기 (menus 컬렉션)
			const menuNameIds = await getMenuIdsContainMenuVal(searchName);

			if (menuNameIds && validMenuIds) {
				// 3️⃣ validMenuIds에서 menuIds 교집합
				const categoryMenuIds = [...validMenuIds];
				validMenuIds = menuNameIds.filter((id) =>
					categoryMenuIds.includes(id)
				);
			}

			if (!menuNameIds || !validMenuIds || validMenuIds.length < 1) {
				setTotal(0);
				setRowData([]);
				return;
			}
		}

		const queryConstraints = validMenuIds
			? [where('menuId', 'in', validMenuIds)]
			: [];

		// 4️⃣ 전체 개수 가져오기
		const totalCountQuery = query(
			collection(db, 'orderItems'),
			...queryConstraints
		);
		const totalCountSnapshot = await getCountFromServer(totalCountQuery);
		const totalCount = totalCountSnapshot.data().count;
		setTotal(totalCount);

		// 5️⃣ 주문 아이템 가져오기 (menuId + orderId 필터링) + 페이지네이션 적용
		const orderItemsData = await fetchTableData(
			collNameOrderItems,
			startDocInfo,
			pageSize,
			page,
			totalCount,
			setLoading,
			undefined,
			setStartDocInfo,
			[...queryConstraints, orderBy('createdAt', 'desc')]
		);
		if (orderItemsData) {
			getSetRowDataWithOrderItems(orderItemsData, setRowData);
		} else {
			setRowData([]);
		}
	} catch (error) {
		console.error('🔥 Error fetching order items:', error);
		return;
	}
};
