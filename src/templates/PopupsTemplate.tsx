import { useEffect, useState } from 'react';
import { CommonTemplate } from './CommonTemplate';
import {
	Button,
	Input,
	message,
	Modal,
	Pagination,
	Select,
	Table,
	UploadFile,
} from 'antd';
import { Timestamp } from 'firebase/firestore';
import {
	deleteData,
	fetchFileData,
	fetchSearchData,
	fetchTableData,
	fetchTotalCount,
	StartDocInfo,
} from 'utils/firebase';
import { PAGE_SIZE } from 'const/table';
import { useNavigate } from 'react-router-dom';
import { useDocIdStore } from 'stores/docIdStore';
import { ColumnsType } from 'antd/es/table';
import { pathNames } from 'const/pathNames';

const searchFieldOptions = [{ value: 'title', label: '제목' }];

export interface PopupData {
	[key: string]: any;
	id: string;
	title: string;
	imagePath: string;
	linkUrl?: string;
	startDate: Timestamp;
	endDate: Timestamp;
	createdAt: Timestamp
}

export const collNamePopups = 'popups';

export function PopupsTemplate() {
	const [total, setTotal] = useState(0);
	const [searchValue, setSearchValue] = useState<string>();
	const [startDocInfo, setStartDocInfo] = useState<StartDocInfo>();
	const [currentPage, setCurrentPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [rowData, setRowData] = useState<PopupData[]>([]);
	const [deleteItem, setDeleteItem] = useState<PopupData>();

	const { Search } = Input;

	const navigte = useNavigate();
	const setDocId = useDocIdStore((state) => state.setId);

	useEffect(() => {
		initFetchData();
	}, []);

	const initFetchData = async () => {
		const totalCnt = await fetchTotalCount(collNamePopups);

		if (totalCnt) {
			setTotal(totalCnt);
			const popupsData: PopupData[] | undefined = await fetchTableData(
				collNamePopups,
				startDocInfo,
				PAGE_SIZE,
				currentPage,
				total,
				setLoading,
				undefined,
				setStartDocInfo
			);
			
			if (popupsData) {
				setEnrichedRowData(popupsData);
			}
		}
	};

	const setEnrichedRowData = async (popupsData: PopupData[]) => {
		for (const popup of popupsData) {
			const files: UploadFile<any>[] = await fetchFileData([
				popup.imagePath,
			]);
			if (files.at(0)) {
				popup.imagePath = files.at(0)!.url!;
			}
		}

		setRowData(popupsData);
	};

	const onChangeSearchValue = async (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		setSearchValue(e.target.value);
		setStartDocInfo(undefined);
		setCurrentPage(1);

		const popupsData = await fetchSearchData(
			collNamePopups,
			undefined,
			PAGE_SIZE,
			1,
			undefined,
			{
				value: e.target.value,
				field: searchFieldOptions[0].value,
			},
			setLoading,
			undefined,
			setStartDocInfo,
			setTotal
		);
		if (popupsData) {
			setEnrichedRowData(popupsData);
		}
	};

	const handlePageChange = async (page: number) => {
		setCurrentPage(page);

		const popupsData = await fetchSearchData(
			collNamePopups,
			startDocInfo,
			PAGE_SIZE,
			page,
			undefined,
			{
				value: searchValue,
				field: searchFieldOptions[0].value,
			},
			setLoading,
			setRowData,
			setStartDocInfo,
			setTotal
		);

		if (popupsData) {
			setEnrichedRowData(popupsData);
		}
	};

	const onDelete = async () => {
		if (deleteItem) {
			setDeleteItem(undefined);
			const isSuccess = await deleteData(collNamePopups, deleteItem.id);
			if (isSuccess) {
				message.success('삭제를 완료하였습니다.');
				await initFetchData();
			} else {
				message.success('삭제를 실패하였습니다.');
			}
		}
	};

	const columns: ColumnsType<PopupData> = [
		{
			title: '제목',
			dataIndex: 'title',
		},
		{
			title: '이미지',
			dataIndex: 'imagePath',
			render: (value) => (
				<img
					style={{ maxHeight: 80 }}
					src={value}
				/>
			),
		},
		{
			title: '링크',
			dataIndex: 'linkUrl',
		},
		{
			title: '시작일',
			dataIndex: 'startDate',
			render: (value: Timestamp) =>
				new Date(
					value.seconds * 1000 + value.nanoseconds / 1000000
				).toLocaleString(),
		},
		{
			title: '종료일',
			dataIndex: 'endDate',
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
						navigte(pathNames.popupDetail);
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
			label={'팝업관리'}
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
						onClick={() => navigte(pathNames.popupDetail)}
						variant='outlined'
						color='orange'>
						팝업추가
					</Button>
				</div>
				<Table<PopupData>
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
