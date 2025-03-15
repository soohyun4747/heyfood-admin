import { Input, Pagination, Select, Table } from 'antd';
import { CommonTemplate } from './CommonTemplate';
import { ColumnsType } from 'antd/es/table/interface';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pathNames } from 'const/pathNames';
import { useDocIdStore } from 'stores/docIdStore';
import {
	fetchTableData,
	fetchSearchData,
	fetchTotalCount,
	StartDocInfo,
} from 'utils/firebase';
import { Timestamp } from 'firebase/firestore';
import { PAGE_SIZE } from 'const/table';

export interface UserData {
	id: string;
	name: string;
	email: string;
	phone: string;
	address: string;
	addressDetail: string;
	createdAt: Timestamp;
	updatedAt?: Timestamp;
}

const searchFieldOptions = [
	{ value: 'name', label: '이름' },
	{ value: 'email', label: '이메일' },
	{ value: 'address', label: '주소' },
	{ value: 'phone', label: '전화번호' },
];

export const collNameUsers = 'users';

export function UsersTemplate() {
	const [rowData, setRowData] = useState<UserData[]>([]);
	const [loading, setLoading] = useState(false);
	const [startDocInfo, setStartDocInfo] = useState<StartDocInfo>();
	const [searchStartDocInfo, setSearchStartDocInfo] =
		useState<StartDocInfo>();

	const [total, setTotal] = useState(0); // Total documents count
	const [currentPage, setCurrentPage] = useState(1);
	const [searchField, setSearchField] = useState<string>(
		searchFieldOptions[0].value
	);
	const [searchValue, setSearchValue] = useState<string>();

	const { Search } = Input;

	const navigte = useNavigate();
	const setDocId = useDocIdStore((state) => state.setId);

	useEffect(() => {
		initFetchData();
	}, []);

	const initFetchData = async () => {
		const totalCnt = await fetchTotalCount(collNameUsers);

		if (totalCnt) {
			setTotal(totalCnt);
			fetchTableData(
				collNameUsers,
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

	const onChangeSearchValue = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchValue(e.target.value);
		setSearchStartDocInfo(undefined);
		setCurrentPage(1);

		if (e.target.value) {
			fetchSearchData(
				collNameUsers,
				undefined,
				PAGE_SIZE,
				1,
				undefined,
				{
					value: e.target.value,
					field: searchField,
				},
				total,
				setLoading,
				setRowData,
				setSearchStartDocInfo,
				setTotal
			);
		} else {
			fetchTableData(
				collNameUsers,
				startDocInfo,
				PAGE_SIZE,
				1,
				total,
				setLoading,
				setRowData,
				setStartDocInfo
			);
			fetchTotalCount(collNameUsers);
		}
	};

	const onChageSearchField = (value: string) => {
		setSearchValue(undefined);
		setSearchStartDocInfo(undefined);
		setCurrentPage(1);
		setSearchField(value);

		fetchTableData(
			collNameUsers,
			startDocInfo,
			PAGE_SIZE,
			1,
			total,
			setLoading,
			setRowData,
			setStartDocInfo
		);
		fetchTotalCount(collNameUsers);
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);

		if (searchValue) {
			fetchSearchData(
				collNameUsers,
				searchStartDocInfo,
				PAGE_SIZE,
				page,
				undefined,
				{
					value: searchValue,
					field: searchField,
				},
				total,
				setLoading,
				setRowData,
				setSearchStartDocInfo,
				setTotal
			);
		} else {
			fetchTableData(
				collNameUsers,
				startDocInfo,
				PAGE_SIZE,
				page,
				total,
				setLoading,
				setRowData,
				setStartDocInfo
			);
		}
	};

	const columns: ColumnsType<UserData> = [
		{
			title: '이름',
			dataIndex: 'name',
			width: 60,
		},
		{
			title: '이메일',
			dataIndex: 'email',
		},
		{
			title: '연락처',
			dataIndex: 'phone',
		},
		{
			title: '주소',
			dataIndex: 'address',
		},
		{
			title: '상세주소',
			dataIndex: 'addressDetail',
		},
		{
			title: '가입일',
			dataIndex: 'createdAt',
			render: (value: Timestamp) =>
				new Date(
					value.seconds * 1000 + value.nanoseconds / 1000000
				).toLocaleString(),
		},
		{
			title: '',
			fixed: 'right',
			width: 40,
			render: (value, record) => (
				<div
					className='text-blue-600 hover:cursor-pointer'
					onClick={() => {
						setDocId(record.id);
						navigte(pathNames.userDetail);
					}}>
					보기
				</div>
			),
		},
	];

	return (
		<CommonTemplate
			label={'회원관리'}
			allCnt={total}>
			<div className='flex flex-col gap-[12px]'>
				<div className='flex items-center gap-[8px]'>
					<Select
						value={searchField}
						style={{ width: 120 }}
						onChange={onChageSearchField}
						options={searchFieldOptions}
					/>
					<Search
						value={searchValue}
						placeholder='input search text'
						allowClear
						style={{ width: 200 }}
						onChange={onChangeSearchValue}
					/>
				</div>
				<Table<UserData>
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
