import { useEffect, useState } from 'react';
import { CommonTemplate } from './CommonTemplate';
import {
	fetchTableData,
	fetchSearchData,
	fetchTotalCount,
	StartDocInfo,
	fetchCollectionData,
	deleteData,
} from 'utils/firebase';
import { PAGE_SIZE } from 'const/table';
import { Timestamp } from 'firebase/firestore';
import {
	Button,
	Input,
	Modal,
	Pagination,
	Radio,
	RadioChangeEvent,
	Select,
	Table,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { useDocIdStore } from 'stores/docIdStore';
import { ColumnsType } from 'antd/es/table';
import { pathNames } from 'const/pathNames';

export interface MenuCategory {
	id: string;
	name: string;
}

export interface MenuData {
	[key: string]: any;
	id: string;
	name: string;
	categoryId: string;
	description: string;
	price: number;
	imagePaths: string[];
	createdAt: Timestamp;
	updatedAt?: Timestamp;
}

const searchFieldOptions = [{ value: 'name', label: '메뉴명' }];

export const collNameMenus = 'menus';
export const collNameMenuCategories = 'menuCategories';

const categoryAllValue = 'all';

export function MenusTemplate() {
	const [total, setTotal] = useState(0);
	const [startDocInfo, setStartDocInfo] = useState<StartDocInfo>();
	const [currentPage, setCurrentPage] = useState(1);
	const [loading, setLoading] = useState(false);
	const [rowData, setRowData] = useState<MenuData[]>([]);
	const [searchValue, setSearchValue] = useState<string>();
	const [searchStartDocInfo, setSearchStartDocInfo] =
		useState<StartDocInfo>();
	const [menuCategories, setMenuCategories] = useState<MenuCategory[]>();
	const [selectedMenuCategory, setSelectedMenuCategory] =
		useState<string>(categoryAllValue);
	const [deleteMenu, setDeleteMenu] = useState<MenuData>();

	const { Search } = Input;

	const navigte = useNavigate();
	const setDocId = useDocIdStore((state) => state.setId);

	useEffect(() => {
		initFetchData();
	}, []);

	const initFetchData = async () => {
		const totalCnt = await fetchTotalCount(collNameMenus);

		if (totalCnt) {
			setTotal(totalCnt);
			fetchTableData(
				collNameMenus,
				startDocInfo,
				PAGE_SIZE,
				currentPage,
				totalCnt,
				setLoading,
				setRowData,
				setStartDocInfo
			);
		}

		fetchCollectionData(collNameMenuCategories, setMenuCategories);
	};

	const onChangeSearchValue = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchValue(e.target.value);
		setSearchStartDocInfo(undefined);
		setCurrentPage(1);
		
		fetchSearchData(
			collNameMenus,
			undefined,
			PAGE_SIZE,
			1,
			selectedMenuCategory === categoryAllValue
				? undefined
				: { value: selectedMenuCategory, field: 'categoryId' },
			{
				value: e.target.value,
				field: searchFieldOptions[0].value,
			},
			total,
			setLoading,
			setRowData,
			setSearchStartDocInfo,
			setTotal
		);
	};

	const onSelectMenuCategory = (e: RadioChangeEvent) => {
		const selectedCategory = e.target.value;
		setSelectedMenuCategory(selectedCategory);

		fetchSearchData(
			collNameMenus,
			undefined,
			PAGE_SIZE,
			1,
			selectedCategory === categoryAllValue
				? undefined
				: { value: selectedCategory, field: 'categoryId' },
			{
				value: searchValue,
				field: searchFieldOptions[0].value,
			},
			total,
			setLoading,
			setRowData,
			setSearchStartDocInfo,
			setTotal
		);
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);

		if (searchValue) {
			fetchSearchData(
				collNameMenus,
				searchStartDocInfo,
				PAGE_SIZE,
				page,
				selectedMenuCategory === categoryAllValue
					? undefined
					: { value: selectedMenuCategory, field: 'categoryId' },
				{
					value: searchValue,
					field: searchFieldOptions[0].value,
				},
				total,
				setLoading,
				setRowData,
				setSearchStartDocInfo,
				setTotal
			);
		} else {
			fetchTableData(
				collNameMenus,
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

	const onDelete = () => {
		if (deleteMenu) {
			deleteData(collNameMenus, deleteMenu?.id);
			setDeleteMenu(undefined);
			initFetchData();
		}
	};

	const columns: ColumnsType<MenuData> = [
		{
			title: '종류',
			dataIndex: 'categoryId',
			width: 100,
			render: (value) => {
				const menuCategory = menuCategories?.find(
					(category) => category.id === value
				);

				return menuCategory?.name;
			},
		},
		{
			title: '메뉴명',
			dataIndex: 'name',
		},
		{
			title: '금액',
			dataIndex: 'price',
			render: (value) => `${value.toLocaleString('en-US')}원`,
		},
		{
			title: '등록일',
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
						navigte(pathNames.menuDetail);
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
					onClick={() => setDeleteMenu(record)}>
					삭제
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
						onClick={() => navigte(pathNames.menuDetail)}
						variant='outlined'
						color='orange'>
						메뉴추가
					</Button>
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
				<Table<MenuData>
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
				<Modal
					centered
					open={deleteMenu ? true : false}
					title='메뉴 삭제'
					width={400}
					onOk={onDelete}
					okButtonProps={{
						style: { background: 'red' },
					}}
					okText={'삭제'}
					onCancel={() => setDeleteMenu(undefined)}
					cancelText={'취소'}>
					<p>{deleteMenu?.name}을 삭제하시겠습니까?</p>
				</Modal>
			</div>
		</CommonTemplate>
	);
}
