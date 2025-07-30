import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { CommonTemplate } from './CommonTemplate';
import { Button, DatePicker, Input, Pagination, Select, Table } from 'antd';
import { fetchTableData, fetchTotalCount, StartDocInfo } from 'utils/firebase';
import { PAGE_SIZE } from 'const/table';
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
import { db } from 'config/firebase';
import { Dayjs } from 'dayjs';
import { dayjsToTimestamp } from 'utils/time';
import {
	collNameOrders,
	OrderData,
	orderStatusLabels,
	paymentMethodLabels,
} from './OrdersTemplate';
import { pathNames } from 'const/pathNames';

const searchFieldOrdererName = 'ordererName';

const searchFieldOptions = [
	{ value: searchFieldOrdererName, label: '주문자명' },
];

export function PaymentsTemplate() {
	const [total, setTotal] = useState(0);
	const [searchValue, setSearchValue] = useState<string>();
	const [searchField, setSearchField] = useState<string>(
		searchFieldOptions[0].value
	);
	const [startDocInfo, setStartDocInfo] = useState<StartDocInfo>();
	const [currentPage, setCurrentPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [rowData, setRowData] = useState<OrderData[]>([]);
	const [orderStart, setOrderStart] = useState<Dayjs>();
	const [orderEnd, setOrderEnd] = useState<Dayjs>();
	const [onlyEdit, setOnlyEdit] = useState<boolean>(false);
	// const [orders, setOrders] = useState<OrderData[]>([]);
	const [qConstraints, setQConstraints] = useState<QueryConstraint[]>([]);

	const { Search } = Input;

	const navigte = useNavigate();
	const setDocId = useDocIdStore((state) => state.setId);

	useEffect(() => {
		initFetchData();
	}, []);

	// useEffect(() => {
	// 	getSetCurrentPageOrdersData();
	// }, [rowData]);

	const initFetchData = async () => {
		const totalCnt = await fetchTotalCount(collNameOrders);

		if (totalCnt) {
			setTotal(totalCnt);
			fetchTableData(
				collNameOrders,
				startDocInfo,
				PAGE_SIZE,
				currentPage,
				totalCnt,
				setLoading,
				setRowData,
				setStartDocInfo
			);
		}
	};

	const resetFiltersGetSetData = async () => {
		setCurrentPage(1);
		setStartDocInfo(undefined);
		setSearchValue(undefined);
		setOrderStart(undefined);
		setOrderEnd(undefined);
		setOnlyEdit(false);

		const totalCnt = await fetchTotalCount(collNameOrders);

		if (totalCnt) {
			setTotal(totalCnt);
			fetchTableData(
				collNameOrders,
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

	// const getSetCurrentPageOrdersData = async () => {
	// 	// 1. 중복 제거
	// 	const uniqueOrderIds = Array.from(
	// 		new Set(rowData.map((row) => row.orderId))
	// 	);

	// 	// 2. 병렬로 fetch
	// 	const orderPromises = uniqueOrderIds.map((orderId) =>
	// 		fetchDataWithDocId(collNameOrders, orderId)
	// 	);

	// 	try {
	// 		const ordersData: OrderData[] = await Promise.all(orderPromises);
	// 		setOrders(ordersData.filter((data) => data !== undefined));
	// 	} catch (error) {
	// 		console.error('Failed to fetch orders:', error);
	// 	}
	// };

	const onChangeSearchField = (value: string) => {
		setSearchValue(undefined);
		setStartDocInfo(undefined);
		setCurrentPage(1);
		setSearchField(value);

		filterDateGetSetRowData(
			undefined,
			value,
			undefined,
			1,
			PAGE_SIZE,
			orderStart,
			orderEnd,
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
			e.target.value,
			searchField,
			undefined,
			1,
			PAGE_SIZE,
			orderStart,
			orderEnd,
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
			searchValue,
			searchField,
			startDocInfo,
			page,
			PAGE_SIZE,
			orderStart,
			orderEnd,
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
			searchValue,
			searchField,
			undefined,
			1,
			PAGE_SIZE,
			date,
			orderEnd,
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
			searchValue,
			searchField,
			undefined,
			1,
			PAGE_SIZE,
			orderStart,
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
			searchValue,
			searchField,
			undefined,
			1,
			PAGE_SIZE,
			orderStart,
			orderEnd,
			true,
			setTotal,
			setLoading,
			setStartDocInfo,
			setRowData,
			setQConstraints
		);
	};

	const columns: ColumnsType<OrderData> = [
		{
			title: '주문일',
			dataIndex: 'createdAt',
			render: (value: Timestamp, record) => {
				return (
					<div
						className={`${
							record?.updatedAt ? 'text-blue-500' : ''
						}`}>
						{new Date(
							value.seconds * 1000 + value.nanoseconds / 1000000
						).toLocaleString()}
					</div>
				);
			},
		},
		{
			title: '주문자명',
			dataIndex: 'ordererName',
			render: (value: string, record) => {
				return (
					<div className={record?.updatedAt ? 'text-blue-500' : ''}>
						{value}
					</div>
				);
			},
		},
		{
			title: '회사명',
			dataIndex: 'companyName',
			render: (value: string, record) => {
				return (
					<div className={record?.updatedAt ? 'text-blue-500' : ''}>
						{value}
					</div>
				);
			},
		},
		{
			title: '요청사항',
			dataIndex: 'comment',
			render: (value: string, record) => {
				return (
					<div className={record?.updatedAt ? 'text-blue-500' : ''}>
						{value}
					</div>
				);
			},
		},
		{
			title: '결제방법',
			dataIndex: 'paymentMethod',
			render: (value: string, record) => {
				return (
					<div className={record?.updatedAt ? 'text-blue-500' : ''}>
						{paymentMethodLabels[value]}
					</div>
				);
			},
		},
		{
			title: '결제상태',
			dataIndex: 'orderStatus',
			render: (value: string, record) => {
				return (
					<div
						className={
							record?.orderStatus === 'cancelled'
								? 'text-red-500'
								: record?.updatedAt
								? 'text-blue-500'
								: ''
						}>
						{orderStatusLabels[value]}
					</div>
				);
			},
		},
		{
			title: '스티커',
			dataIndex: 'stickerFile',
			render: (value: string, record) => {
				return (
					<div className={record?.updatedAt ? 'text-blue-500' : ''}>
						{value || record.stickerPhrase ? 'o' : 'x'}
					</div>
				);
			},
		},
		{
			title: '스티커 금액',
			dataIndex: 'stickerPrice',
			render: (value: number, record) => {
				return (
					<div className={record?.updatedAt ? 'text-blue-500' : ''}>
						{value?.toLocaleString()}원
					</div>
				);
			},
		},
		{
			title: '배송 금액',
			dataIndex: 'deliveryPrice',
			render: (value: number, record) => {
				return (
					<div className={record?.updatedAt ? 'text-blue-500' : ''}>
						{value?.toLocaleString()}원
					</div>
				);
			},
		},
		{
			title: '총 금액',
			dataIndex: 'price',
			render: (value, record) => {
				return (
					<div className={record?.updatedAt ? 'text-blue-500' : ''}>
						{value}원
					</div>
				);
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
						navigte(pathNames.paymentDetail);
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
				<Table<OrderData>
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
			where('deliveryDate', '>=', dayjsToTimestamp(deliveryStart))
		);
	}
	if (deliveryEnd) {
		queryConstraints.push(
			where('deliveryDate', '<=', dayjsToTimestamp(deliveryEnd))
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
	searchValue: string | undefined,
	searchField: string,
	startDocInfo: StartDocInfo | undefined,
	page: number,
	pageSize: number,
	orderStart: Dayjs | undefined,
	orderEnd: Dayjs | undefined,
	onlyEdit: boolean,
	setTotal: Dispatch<SetStateAction<number>>,
	setLoading: Dispatch<SetStateAction<boolean>>,
	setStartDocInfo: Dispatch<SetStateAction<StartDocInfo | undefined>>,
	setRowData: Dispatch<React.SetStateAction<OrderData[]>>,
	setQConstraints: Dispatch<SetStateAction<QueryConstraint[]>>
) => {
	const queryConstraints: QueryConstraint[] = [];

	const isCreatedAtOrder = orderStart || orderEnd ? true : false;

	if (orderStart || orderEnd) {
		setQConstraintsByDeliveryDate(
			queryConstraints,
			orderStart,
			orderEnd,
			undefined,
			undefined
		);
	}

	if (onlyEdit) {
		queryConstraints.push(where('updatedAt', '>', new Date(0)));
		queryConstraints.push(orderBy('updatedAt'));
	}

	//search
	if (searchValue) {
		queryConstraints.push(where(searchField, '>=', searchValue));
		queryConstraints.push(where(searchField, '<=', searchValue + '\uf8ff'));
		queryConstraints.push(orderBy(searchField));
	}

	// 4️⃣ 전체 개수 가져오기
	const totalCountQuery = query(
		collection(db, collNameOrders),
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
		collNameOrders,
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
