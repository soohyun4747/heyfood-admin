import { Input, message, Modal, Pagination, Select } from 'antd';
import Table, { ColumnsType } from 'antd/es/table';
import { pathNames } from 'const/pathNames';
import { PAGE_SIZE } from 'const/table';
import { Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocIdStore } from 'stores/docIdStore';
import {
	deleteData,
	fetchSearchData,
	fetchTableData,
	fetchTotalCount,
	StartDocInfo,
} from 'utils/firebase';
import { CommonTemplate } from './CommonTemplate';

export interface IReview {
	id: string;
	email: string;
	comment: string;
	imagePaths: string[];
	createdAt: Timestamp;
}

const searchFieldOptions = [{ value: 'email', label: '이메일' }];

const collNameReviews = 'reviews';

export function ReviewsTemplate() {
	const [rowData, setRowData] = useState<IReview[]>([]);
	const [loading, setLoading] = useState(true);
	const [startDocInfo, setStartDocInfo] = useState<StartDocInfo>();
	const [searchStartDocInfo, setSearchStartDocInfo] =
		useState<StartDocInfo>();

	const [total, setTotal] = useState(0); // Total documents count
	const [currentPage, setCurrentPage] = useState(1);
	const [searchField, setSearchField] = useState<string>(
		searchFieldOptions[0].value
	);
	const [searchValue, setSearchValue] = useState<string>();
	const [deleteItem, setDeleteItem] = useState<IReview>();

	const { Search } = Input;

	const setDocId = useDocIdStore((state) => state.setId);

	useEffect(() => {
		initFetchData();
	}, []);

	const initFetchData = async () => {
		const totalCnt = await fetchTotalCount(collNameReviews);

		if (totalCnt) {
			setTotal(totalCnt);
			fetchTableData(
				collNameReviews,
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
				collNameReviews,
				undefined,
				PAGE_SIZE,
				1,
				undefined,
				{
					value: e.target.value,
					field: searchField,
				},
				setLoading,
				setRowData,
				setSearchStartDocInfo,
				setTotal
			);
		} else {
			fetchTableData(
				collNameReviews,
				startDocInfo,
				PAGE_SIZE,
				1,
				total,
				setLoading,
				setRowData,
				setStartDocInfo
			);
			fetchTotalCount(collNameReviews);
		}
	};

	const onChangeSearchField = (value: string) => {
		setSearchValue(undefined);
		setSearchStartDocInfo(undefined);
		setCurrentPage(1);
		setSearchField(value);

		fetchTableData(
			collNameReviews,
			startDocInfo,
			PAGE_SIZE,
			1,
			total,
			setLoading,
			setRowData,
			setStartDocInfo
		);
		fetchTotalCount(collNameReviews);
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);

		if (searchValue) {
			fetchSearchData(
				collNameReviews,
				searchStartDocInfo,
				PAGE_SIZE,
				page,
				undefined,
				{
					value: searchValue,
					field: searchField,
				},
				setLoading,
				setRowData,
				setSearchStartDocInfo,
				setTotal
			);
		} else {
			fetchTableData(
				collNameReviews,
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

	const onDelete = async () => {
		if (deleteItem) {
			setDeleteItem(undefined);
			const isSuccess = await deleteData(collNameReviews, deleteItem.id);
			if (isSuccess) {
				message.success('삭제를 완료하였습니다.');
				await initFetchData();
			} else {
				message.success('삭제를 실패하였습니다.');
			}
		}
	};

	const columns: ColumnsType<IReview> = [
		{
			title: '리뷰 id',
			dataIndex: 'id',
		},
		{
			title: '이메일',
			dataIndex: 'email',
		},
		{
			title: '내용',
			dataIndex: 'comment',
		},
		{
			title: '작성일',
			dataIndex: 'createdAt',
			render: (value: Timestamp) => value.toDate().toLocaleDateString(),
		},
		{
			title: '',
			fixed: 'right',
			width: 40,
			render: (value, record) => (
				<div
					className='text-red-500 hover:cursor-pointer'
					onClick={() => setDeleteItem(record)}>
					삭제
				</div>
			),
		},
	];

	return (
		<CommonTemplate
			label={'팝업관리'}
			allCnt={total}>
			<div className='flex flex-col gap-[12px]'>
				<div className='flex items-center gap-[8px]'>
					<Select
						value={searchFieldOptions[0].value}
						style={{ width: 120 }}
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
				<Table<IReview>
					size={'small'}
					className={'hey-table'}
					columns={columns}
					rowKey={(record) => record.id}
					dataSource={rowData}
					loading={loading}
					pagination={false}
					scroll={{ y: 450 }} // Enables vertical scroll with 400px height
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
				<Modal
					centered
					open={deleteItem ? true : false}
					title='팝업 삭제'
					width={400}
					onOk={onDelete}
					okButtonProps={{
						style: { background: 'red' },
					}}
					okText={'삭제'}
					onCancel={() => setDeleteItem(undefined)}
					cancelText={'취소'}>
					<p>"{deleteItem?.id}" 리뷰를 삭제하시겠습니까?</p>
				</Modal>
			</div>
		</CommonTemplate>
	);
}
