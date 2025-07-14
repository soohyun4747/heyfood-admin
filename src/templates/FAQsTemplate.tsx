import { useEffect, useState } from 'react';
import { CommonTemplate } from './CommonTemplate';
import {
	Button,
	Input,
	message,
	Modal,
	Pagination,
	Radio,
	RadioChangeEvent,
	Select,
	Table,
} from 'antd';
import { Timestamp } from 'firebase/firestore';
import {
	deleteData,
	deleteFile,
	fetchCollectionData,
	fetchSearchData,
	fetchTableData,
	fetchTotalCount,
	StartDocInfo,
} from 'utils/firebase';
import { pathNames } from 'const/pathNames';
import { useNavigate } from 'react-router-dom';
import { useDocIdStore } from 'stores/docIdStore';
import { PAGE_SIZE } from 'const/table';
import { categoryAllValue, CategoryData } from './MenusTemplate';
import { ColumnsType } from 'antd/es/table';

const searchFieldOptions = [{ value: 'title', label: '제목' }];

export interface FAQData {
	[key: string]: any;
	id: string;
	title: string;
	// content: string;
	imagePath: string;
	categoryId: string;
	createdAt: Timestamp;
}

export const collNameFAQs = 'FAQs';
export const collNameFAQCategories = 'FAQCategories';

export function FAQsTemplate() {
	const [total, setTotal] = useState(0);
	const [searchValue, setSearchValue] = useState<string>();
	const [startDocInfo, setStartDocInfo] = useState<StartDocInfo>();
	const [currentPage, setCurrentPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [rowData, setRowData] = useState<FAQData[]>([]);
	const [deleteItem, setDeleteItem] = useState<FAQData>();
	const [selectedFAQCategory, setSelectedFAQCategory] =
		useState<string>(categoryAllValue);
	const [FAQCategories, setFAQCategories] = useState<CategoryData[]>();

	const { Search } = Input;
	const navigte = useNavigate();
	const setDocId = useDocIdStore((state) => state.setId);

	useEffect(() => {
		initFetchData();
	}, []);

	const initFetchData = async () => {
		const totalCnt = await fetchTotalCount(collNameFAQs);

		if (totalCnt) {
			setTotal(totalCnt);
			await fetchTableData(
				collNameFAQs,
				startDocInfo,
				PAGE_SIZE,
				currentPage,
				totalCnt,
				setLoading,
				setRowData,
				setStartDocInfo
			);
		}

		fetchCollectionData(collNameFAQCategories, setFAQCategories);
	};

	const onChangeSearchValue = async (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		setSearchValue(e.target.value);
		setStartDocInfo(undefined);
		setCurrentPage(1);

		await fetchSearchData(
			collNameFAQs,
			undefined,
			PAGE_SIZE,
			1,
			selectedFAQCategory === categoryAllValue
				? undefined
				: { value: selectedFAQCategory, field: 'categoryId' },
			{
				value: e.target.value,
				field: searchFieldOptions[0].value,
			},
			setLoading,
			setRowData,
			setStartDocInfo,
			setTotal
		);
	};

	const onSelectMenuCategory = (e: RadioChangeEvent) => {
		setSelectedFAQCategory(e.target.value);
		setStartDocInfo(undefined);
		setCurrentPage(1);

		fetchSearchData(
			collNameFAQs,
			undefined,
			PAGE_SIZE,
			1,
			e.target.value === categoryAllValue
				? undefined
				: { value: e.target.value, field: 'categoryId' },
			{
				value: searchValue,
				field: searchFieldOptions[0].value,
			},
			setLoading,
			setRowData,
			setStartDocInfo,
			setTotal
		);
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);

		fetchSearchData(
			collNameFAQs,
			startDocInfo,
			PAGE_SIZE,
			page,
			selectedFAQCategory === categoryAllValue
				? undefined
				: { value: selectedFAQCategory, field: 'categoryId' },
			{
				value: searchValue,
				field: searchFieldOptions[0].value,
			},
			setLoading,
			setRowData,
			setStartDocInfo,
			setTotal
		);
	};

	const onDelete = async () => {
		if (deleteItem) {
			setDeleteItem(undefined);
			const isSuccess = await deleteData(collNameFAQs, deleteItem.id);
			await deleteFile(deleteItem.imagePath);
			if (isSuccess) {
				message.success('삭제를 완료하였습니다.');
				await initFetchData();
			} else {
				message.success('삭제를 실패하였습니다.');
			}
		}
	};

	const columns: ColumnsType<FAQData> = [
		{
			title: '종류',
			dataIndex: 'categoryId',
			width: 100,
			render: (value) => {
				const FAQCategory = FAQCategories?.find(
					(category) => category.id === value
				);

				return FAQCategory?.name;
			},
		},
		{
			title: '제목',
			dataIndex: 'title',
		},
		{
			title: '등록일/수정일',
			dataIndex: 'createdAt',
			render: (value: Timestamp) =>
				new Date(
					value.seconds * 1000 + value.nanoseconds / 1000000
				).toLocaleString(),
		},
		{
			title: '',
			fixed: 'right',
			width: 70,
			render: (value, record) => (
				<div
					className='text-blue-600 hover:cursor-pointer'
					onClick={() => {
						setDocId(record.id);
						navigte(pathNames.FAQDetail);
					}}>
					보기/수정
				</div>
			),
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
			label={'FAQ관리'}
			allCnt={total}>
			<div className='flex flex-col gap-[12px]'>
				<div className='flex items-center justify-between'>
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
					<Button
						onClick={() => navigte(pathNames.FAQDetail)}
						variant='outlined'
						color='orange'>
						FAQ추가
					</Button>
				</div>
				<Radio.Group
					value={selectedFAQCategory}
					onChange={onSelectMenuCategory}>
					<Radio.Button value={categoryAllValue}>전체</Radio.Button>
					{FAQCategories?.map((category) => (
						<Radio.Button
							key={category.id}
							value={category.id}>
							{category.name}
						</Radio.Button>
					))}
				</Radio.Group>
				<Table<FAQData>
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
					<p>"{deleteItem?.title}" 팝업을 삭제하시겠습니까?</p>
				</Modal>
			</div>
		</CommonTemplate>
	);
}
