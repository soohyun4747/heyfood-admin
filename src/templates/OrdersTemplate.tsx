import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { CommonTemplate } from './CommonTemplate';
import {
	Button,
	DatePicker,
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
	fetchTableData,
	fetchTotalCount,
	StartDocInfo,
} from 'utils/firebase';
import { PAGE_SIZE } from 'const/table';
import {
	categoryAllValue,
	collNameMenuCategories,
	collNameMenus,
	CategoryData,
	MenuData,
} from './MenusTemplate';
import {
	collection,
	getCountFromServer,
	orderBy,
	query,
	QueryConstraint,
	Timestamp,
	where,
} from 'firebase/firestore';
import { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { useDocIdStore } from 'stores/docIdStore';
import { pathNames } from 'const/pathNames';
import { db } from 'config/firebase';
import { Dayjs } from 'dayjs';
import ExcelButton from 'components/ExcelButton';
import { dayjsToTimestamp } from 'utils/time';

const searchFieldOrdererName = 'ordererName';
const searchFieldMenuName = 'menuId';

const searchFieldOptions = [
	{ value: searchFieldOrdererName, label: '주문자명' },
	{ value: searchFieldMenuName, label: '메뉴명' },
];

export const collNameOrders = 'orders';
export const collNameOrderItems = 'orderItems';
export const collNameGuests = 'guests';

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
	address: string;
	addressDetail: string;
	comment?: string;
	paymentMethodId: PaymentMethod;
	createdAt: Timestamp;
	updatedAt?: Timestamp;
}

export interface OrderItemData {
	id: string;
	orderId: string;
	ordererName: string;
	categoryId: string;
	menuId: string;
	quantity: number;
	deliveryDate: Timestamp;
	createdAt: Timestamp;
	updatedAt?: Timestamp;
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
	const [loading, setLoading] = useState(true);
	const [rowData, setRowData] = useState<OrderItemData[]>([]);
	const [menuCategories, setMenuCategories] = useState<CategoryData[]>();
	const [menuList, setMenuList] = useState<MenuData[]>([]);
	const [orderStart, setOrderStart] = useState<Dayjs>();
	const [orderEnd, setOrderEnd] = useState<Dayjs>();
	const [deliveryStart, setDeliveryStart] = useState<Dayjs>();
	const [deliveryEnd, setDeliveryEnd] = useState<Dayjs>();
	const [onlyEdit, setOnlyEdit] = useState<boolean>(false);
	const [orders, setOrders] = useState<OrderData[]>([]);
	const [qConstraints, setQConstraints] = useState<QueryConstraint[]>([]);

	const { Search } = Input;

	const navigte = useNavigate();
	const setDocId = useDocIdStore((state) => state.setId);

	useEffect(() => {
		initFetchData();
	}, []);

	useEffect(() => {
		getSetCurrentPageOrdersData();
	}, [rowData]);

	const initFetchData = async () => {
		const totalCnt = await fetchTotalCount(collNameOrderItems);

		if (totalCnt) {
			setTotal(totalCnt);
			fetchTableData(
				collNameOrderItems,
				startDocInfo,
				PAGE_SIZE,
				currentPage,
				totalCnt,
				setLoading,
				setRowData,
				setStartDocInfo
			);
		}

		fetchCollectionData(collNameMenus, setMenuList);
		fetchCollectionData(collNameMenuCategories, setMenuCategories);
	};

	const resetFiltersGetSetData = async () => {
		setCurrentPage(1);
		setStartDocInfo(undefined);
		setSearchValue(undefined);
		setOrderStart(undefined);
		setOrderEnd(undefined);
		setDeliveryStart(undefined);
		setDeliveryEnd(undefined);
		setOnlyEdit(false);
		setSelectedMenuCategory(categoryAllValue);

		const totalCnt = await fetchTotalCount(collNameOrderItems);

		if (totalCnt) {
			setTotal(totalCnt);
			fetchTableData(
				collNameOrderItems,
				undefined,
				PAGE_SIZE,
				1,
				totalCnt,
				setLoading,
				setRowData,
				setStartDocInfo
			);
		}
	};

	const getSetCurrentPageOrdersData = async () => {
		const ordersData = await Promise.all(
			rowData.map(async (row) => {
				return await fetchDataWithDocId(collNameOrders, row.orderId);
			})
		);

		setOrders(ordersData);
	};

	const onChangeSearchField = (value: string) => {
		setSearchValue(undefined);
		setStartDocInfo(undefined);
		setCurrentPage(1);
		setSearchField(value);

		filterDateGetSetRowData(
			selectedMenuCategory,
			undefined,
			value,
			undefined,
			1,
			PAGE_SIZE,
			orderStart,
			orderEnd,
			deliveryStart,
			deliveryEnd,
			onlyEdit,
			setTotal,
			setLoading,
			setStartDocInfo,
			setRowData,
			setQConstraints
		);
	};

	const onChangeSearchValue = async (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		setSearchValue(e.target.value);
		setStartDocInfo(undefined);
		setCurrentPage(1);

		filterDateGetSetRowData(
			selectedMenuCategory,
			e.target.value,
			searchField,
			undefined,
			1,
			PAGE_SIZE,
			orderStart,
			orderEnd,
			deliveryStart,
			deliveryEnd,
			onlyEdit,
			setTotal,
			setLoading,
			setStartDocInfo,
			setRowData,
			setQConstraints
		);
	};

	const onSelectMenuCategory = async (e: RadioChangeEvent) => {
		setSelectedMenuCategory(e.target.value);
		setStartDocInfo(undefined);
		setCurrentPage(1);

		filterDateGetSetRowData(
			e.target.value,
			searchValue,
			searchField,
			undefined,
			1,
			PAGE_SIZE,
			orderStart,
			orderEnd,
			deliveryStart,
			deliveryEnd,
			onlyEdit,
			setTotal,
			setLoading,
			setStartDocInfo,
			setRowData,
			setQConstraints
		);
	};

	const handlePageChange = async (page: number) => {
		setCurrentPage(page);

		filterDateGetSetRowData(
			selectedMenuCategory,
			searchValue,
			searchField,
			startDocInfo,
			page,
			PAGE_SIZE,
			orderStart,
			orderEnd,
			deliveryStart,
			deliveryEnd,
			onlyEdit,
			setTotal,
			setLoading,
			setStartDocInfo,
			setRowData,
			setQConstraints
		);
	};

	const onChangeOrderStartDate = (date: Dayjs) => {        
		setOrderStart(date);
		setStartDocInfo(undefined);
		setCurrentPage(1);

		filterDateGetSetRowData(
			selectedMenuCategory,
			searchValue,
			searchField,
			undefined,
			1,
			PAGE_SIZE,
			date,
			orderEnd,
			deliveryStart,
			deliveryEnd,
			onlyEdit,
			setTotal,
			setLoading,
			setStartDocInfo,
			setRowData,
			setQConstraints
		);
	};

	const onChangeOrderEndDate = (date: Dayjs) => {
		const endDay = date ? date.endOf('day') : undefined;
		setOrderEnd(endDay);
		setStartDocInfo(undefined);
		setCurrentPage(1);

		filterDateGetSetRowData(
			selectedMenuCategory,
			searchValue,
			searchField,
			undefined,
			1,
			PAGE_SIZE,
			orderStart,
			endDay,
			deliveryStart,
			deliveryEnd,
			onlyEdit,
			setTotal,
			setLoading,
			setStartDocInfo,
			setRowData,
			setQConstraints
		);
	};

	const onChangeDeliveryStartDate = (date: Dayjs) => {
		setDeliveryStart(date);
		setStartDocInfo(undefined);
		setCurrentPage(1);

		filterDateGetSetRowData(
			selectedMenuCategory,
			searchValue,
			searchField,
			undefined,
			1,
			PAGE_SIZE,
			orderStart,
			orderEnd,
			date,
			deliveryEnd,
			onlyEdit,
			setTotal,
			setLoading,
			setStartDocInfo,
			setRowData,
			setQConstraints
		);
	};

	const onChangeDeliveryEndDate = (date: Dayjs) => {
		const endDay = date ? date.endOf('day') : undefined;
		setDeliveryEnd(endDay);
		setStartDocInfo(undefined);
		setCurrentPage(1);

		filterDateGetSetRowData(
			selectedMenuCategory,
			searchValue,
			searchField,
			undefined,
			1,
			PAGE_SIZE,
			orderStart,
			orderEnd,
			deliveryStart,
			endDay,
			onlyEdit,
			setTotal,
			setLoading,
			setStartDocInfo,
			setRowData,
			setQConstraints
		);
	};

	const onClickOnlyEdit = () => {
		setOnlyEdit(true);
		setStartDocInfo(undefined);
		setCurrentPage(1);

		filterDateGetSetRowData(
			selectedMenuCategory,
			searchValue,
			searchField,
			undefined,
			1,
			PAGE_SIZE,
			orderStart,
			orderEnd,
			deliveryStart,
			deliveryEnd,
			true,
			setTotal,
			setLoading,
			setStartDocInfo,
			setRowData,
			setQConstraints
		);
	};

	const columns: ColumnsType<OrderItemData> = [
		{
			title: '주문일',
			dataIndex: 'createdAt',
			render: (value: Timestamp, record) => (
				<div className={`${record.updatedAt && 'text-blue-500'}`}>
					{new Date(
						value.seconds * 1000 + value.nanoseconds / 1000000
					).toLocaleString()}
				</div>
			),
		},
		{
			title: '배달일',
			dataIndex: 'deliveryDate',
			render: (value: Timestamp, record) => (
				<div className={record.updatedAt && 'text-blue-500'}>
					{new Date(
						value.seconds * 1000 + value.nanoseconds / 1000000
					).toLocaleString()}
				</div>
			),
		},
		{
			title: '주문자명',
			dataIndex: 'ordererName',
			render: (value: string, record) => (
				<div className={record.updatedAt && 'text-blue-500'}>
					{value}
				</div>
			),
		},
		{
			title: '주소',
			dataIndex: 'orderId',
			render: (value, record) => (
				<div className={record.updatedAt && 'text-blue-500'}>
					{orders.find((order) => order.id === value)?.address}
				</div>
			),
		},
		{
			title: '메뉴명',
			dataIndex: 'menuId',
			render: (value: string, record) => (
				<div className={record.updatedAt && 'text-blue-500'}>
					{value}
				</div>
			),
		},
		{
			title: '수량',
			dataIndex: 'quantity',
			render: (value: string, record) => (
				<div className={record.updatedAt && 'text-blue-500'}>
					{value}개
				</div>
			),
		},
		{
			title: '요청사항',
			dataIndex: 'comment',
			render: (value: string, record) => (
				<div className={record.updatedAt && 'text-blue-500'}>
					{value}
				</div>
			),
		},
		{
			title: '금액',
			dataIndex: 'menuId',
			render: (value, record) => {
				const menuInfo = menuList.find((menu) => menu.id === value);

				if (menuInfo) {
					return (
						<div className={record.updatedAt && 'text-blue-500'}>
							{menuInfo.price * record.quantity}원
						</div>
					);
				}
			},
		},
		{
			title: '',
			fixed: 'right',
			width: 40,
			render: (value, record) => (
				<div
					className='text-blue-500 underline hover:cursor-pointer'
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
			label={'주문관리'}
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
					<div className='flex items-center gap-[8px]'>
						<div className='flex items-center gap-[4px]'>
							<div className='text-xs text-gray'>주문일</div>
							<DatePicker
								value={orderStart}
								onChange={onChangeOrderStartDate}
							/>
							<div className='text-xs text-gray'>~</div>
							<DatePicker
								value={orderEnd}
								onChange={onChangeOrderEndDate}
							/>
						</div>
						<div className='flex items-center gap-[4px]'>
							<div className='text-xs text-gray'>배달일</div>
							<DatePicker
								value={deliveryStart}
								onChange={onChangeDeliveryStartDate}
							/>
							<div className='text-xs text-gray'>~</div>
							<DatePicker
								value={deliveryEnd}
								onChange={onChangeDeliveryEndDate}
							/>
						</div>
						<Button
							onClick={resetFiltersGetSetData}
							variant='filled'
							color='orange'>
							전체목록
						</Button>
					</div>
				</div>
				<div className='bg-zinc-50 p-[6px] text-xs flex flex-col gap-[4px]'>
					<div>
						*{' '}
						<span className='text-blue-600 font-bold'>파란색</span>
						으로 표시된 내역은 주문 내용이 수정된 건 입니다.
					</div>
					<div>
						* 수정된 건만 조회하고자 할 경우{' '}
						<span
							onClick={onClickOnlyEdit}
							className='hover:cursor-pointer text-blue-600 font-bold underline'>
							여기
						</span>
						를 눌러주세요
					</div>
				</div>
				<div className='flex items-center justify-between'>
					<Radio.Group
						value={selectedMenuCategory}
						onChange={onSelectMenuCategory}>
						<Radio.Button value={categoryAllValue}>
							전체
						</Radio.Button>
						{menuCategories?.map((category) => (
							<Radio.Button
								key={category.id}
								value={category.id}>
								{category.name}
							</Radio.Button>
						))}
					</Radio.Group>
					<ExcelButton qConstraints={qConstraints} />
				</div>
				<Table<OrderItemData>
					size={'small'}
					className={'hey-table'}
					columns={columns}
					rowKey={(record) => record.id}
					dataSource={rowData}
					loading={loading}
					pagination={false}
					scroll={{ y: 380 }} // Enables vertical scroll with 400px height
				/>
				<div className='w-full flex justify-center'>
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

const setQConstraintsByDeliveryDate = async (
	queryConstraints: QueryConstraint[],
	orderStart: Dayjs | undefined,
	orderEnd: Dayjs | undefined,
	deliveryStart: Dayjs | undefined,
	deliveryEnd: Dayjs | undefined
) => {
	if (orderStart) {
		queryConstraints.push(
			where('createdAt', '>=', dayjsToTimestamp(orderStart))
		);
	}
	if (orderEnd) {
		queryConstraints.push(
			where('createdAt', '<=', dayjsToTimestamp(orderEnd))
		);
	}
	if (deliveryStart) {
		queryConstraints.push(
			where(
				'deliveryDate',
				'>=',
				dayjsToTimestamp(deliveryStart)
			)
		);
	}
	if (deliveryEnd) {
		queryConstraints.push(
			where(
				'deliveryDate',
				'<=',
				dayjsToTimestamp(deliveryEnd)
			)
		);
	}

	if (orderStart || orderEnd) {
		queryConstraints.push(orderBy('createdAt'));
	}
	if (deliveryStart || deliveryEnd) {
		queryConstraints.push(orderBy('deliveryDate'));
	}
};

const filterDateGetSetRowData = async (
	selectedMenuCategory: string,
	searchValue: string | undefined,
	searchField: string,
	startDocInfo: StartDocInfo | undefined,
	page: number,
	pageSize: number,
	orderStart: Dayjs | undefined,
	orderEnd: Dayjs | undefined,
	deliveryStart: Dayjs | undefined,
	deliveryEnd: Dayjs | undefined,
	onlyEdit: boolean,
	setTotal: Dispatch<SetStateAction<number>>,
	setLoading: Dispatch<SetStateAction<boolean>>,
	setStartDocInfo: Dispatch<SetStateAction<StartDocInfo | undefined>>,
	setRowData: Dispatch<React.SetStateAction<OrderItemData[]>>,
	setQConstraints: Dispatch<SetStateAction<QueryConstraint[]>>
) => {
	const queryConstraints: QueryConstraint[] = [];

	const isCreatedAtOrder = orderStart || orderEnd ? true : false;
    

	if (orderStart || orderEnd || deliveryStart || deliveryEnd) {
		setQConstraintsByDeliveryDate(
			queryConstraints,
			orderStart,
			orderEnd,
			deliveryStart,
			deliveryEnd
		);
	}

	if (onlyEdit) {
		queryConstraints.push(where('updatedAt', '>', new Date(0)));
		queryConstraints.push(orderBy('updatedAt'));
	}

	//menu category
	if (selectedMenuCategory !== categoryAllValue) {
		queryConstraints.push(where('categoryId', '==', selectedMenuCategory));
		queryConstraints.push(orderBy('categoryId'));
	}

	//search
	if (searchValue) {
		queryConstraints.push(where(searchField, '>=', searchValue));
		queryConstraints.push(where(searchField, '<=', searchValue + '\uf8ff'));
		queryConstraints.push(orderBy(searchField));
	}

	// 4️⃣ 전체 개수 가져오기
	const totalCountQuery = query(
		collection(db, collNameOrderItems),
		...queryConstraints
	);

	const totalCountSnapshot = await getCountFromServer(totalCountQuery);
	const totalCount = totalCountSnapshot.data().count;
	setTotal(totalCount);

	const finalConstraints = isCreatedAtOrder
		? [...queryConstraints]
		: [...queryConstraints, orderBy('createdAt', 'desc')];

	setQConstraints(finalConstraints);

	await fetchTableData(
		collNameOrderItems,
		startDocInfo,
		pageSize,
		page,
		totalCount,
		setLoading,
		setRowData,
		setStartDocInfo,
		finalConstraints
	);
};
