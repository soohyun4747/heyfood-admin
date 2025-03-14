import { useEffect, useState } from 'react';
import {
	collNameMenuCategories,
	collNameMenus,
	MenuCategory,
	MenuData,
} from './menusTemplate';
import { useDocIdStore } from 'stores/docIdStore';
import { useNavigate } from 'react-router-dom';
import {
	addData,
	fetchCollectionData,
	fetchDataWithDocId,
	fetchFileData,
	updateData,
	uploadFileData,
} from 'utils/firebase';
import { CommonTemplate } from './CommonTemplate';
import { Button, Modal, Upload, UploadFile } from 'antd';
import { LabelTextField } from 'components/LabelTexfield';
import { LabelDropdown, Option } from 'components/LabelDropdown';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase/firestore';
import { UploadButton } from 'components/UploadButton';

export function MenuDetailTemplate() {
	const [data, setData] = useState<MenuData>();
	const [menuCategoryOptions, setMenuCategoryOptions] = useState<Option[]>();
	const [nameInput, setNameInput] = useState<string>('');
	const [priceInput, setPriceInput] = useState<number | string>(0);
	const [descInput, setDescInput] = useState<string>('');
	const [fileList, setFileList] = useState<UploadFile[]>([]);
	const [previewVisible, setPreviewVisible] = useState(false); // 미리보기 모달 표시 여부
	const [previewImage, setPreviewImage] = useState<string>(''); // 미리보기 이미지 URL
	const docId = useDocIdStore((state) => state.id);
	const navigate = useNavigate();

	useEffect(() => {
		getSetInitData(docId);
	}, [docId]);

	const getSetInitData = async (docId: string | undefined) => {
		const categoryOptions = await getSetMenuCategoryOptions();
		if (docId) {
			const menuData = (await fetchDataWithDocId(
				collNameMenus,
				docId,
				setData
			)) as MenuData | undefined;
			if (menuData) {
				fetchFileData(menuData.imagePaths, setFileList);

				setNameInput(menuData.name);
				setPriceInput(menuData.price);
				setDescInput(menuData.description);
			}
		} else {
			if (categoryOptions) {
				createSetInitMenuData(categoryOptions);
			}
		}
	};

	const createSetInitMenuData = (menuCategoryOptions: Option[]) => {
		const initMenuData = {
			id: uuidv4(),
			name: '',
			categoryId: menuCategoryOptions[0].value as string,
			description: '',
			price: 0,
			imagePaths: [],
			createdAt: Timestamp.now(),
		};

		setData(initMenuData);
	};

	const getSetMenuCategoryOptions = async () => {
		const menuCategories = (await fetchCollectionData(
			collNameMenuCategories
		)) as MenuCategory[] | undefined;

		if (menuCategories) {
			const transformedData = menuCategories.map((category) => ({
				value: category.id,
				label: category.name,
			}));
			setMenuCategoryOptions(transformedData);

			return transformedData;
		}
	};

	const onBlurPrice = (e: React.FocusEvent<HTMLInputElement, Element>) => {
		const numVal = Number(e.target.value);

		if (isNaN(numVal)) {
			if (data) {
				setPriceInput(data.price);
			} else {
				setPriceInput(0);
			}
		} else {
			setData((prev) => {
				if (prev) {
					prev.price = numVal;
					return { ...prev };
				}
			});
		}
	};

	// 미리보기 클릭 핸들러
	const handlePreview = (file: any) => {
		setPreviewImage(file.url || URL.createObjectURL(file.originFileObj));
		setPreviewVisible(true); // 모달 표시
	};

	const onClickAdd = () => {
		if (data) {
			const uploadingData = { ...data };

			fileList.map((file, idx) => {
				const path = `${uploadingData.categoryId}_${idx + 1}`;
				uploadingData.imagePaths.push(path);
				uploadFileData(file, path);
			});

			addData(collNameMenus, uploadingData);
		}
		navigate(-1);
	};

	const onClickEdit = () => {
		if (data) {
			const uploadingData = { ...data };
			uploadingData.imagePaths = [];
			uploadingData.updatedAt = Timestamp.now();

			fileList.map((file, idx) => {
				const path = `${uploadingData.categoryId}_${idx + 1}`;
				uploadingData.imagePaths.push(path);
				uploadFileData(file, path);
			});
			updateData(collNameMenus, uploadingData);
		}
		navigate(-1);
	};

	return (
		<CommonTemplate label={docId ? '메뉴정보' : '메뉴추가'}>
			<div className='flex flex-col gap-[18px]'>
				<div className='flex flex-col gap-[18px] border-b border-stone-100 pb-[24px]'>
					<LabelDropdown
						label={'종류'}
						options={menuCategoryOptions}
						value={
							menuCategoryOptions?.find(
								(opt) => opt.value === data?.categoryId
							)?.value
						}
						onChange={(value) =>
							setData((prev) => {
								if (prev) {
									prev.categoryId = value;
									return { ...prev };
								}
							})
						}
					/>
					<LabelTextField
						label={'메뉴명'}
						value={nameInput}
						onChange={(e) => setNameInput(e.target.value)}
						onBlur={(e) =>
							setData((prev) => {
								if (prev) {
									prev.name = e.target.value;
									return { ...prev };
								}
							})
						}
					/>
					<LabelTextField
						label={'금액'}
						value={priceInput}
						onChange={(e) => setPriceInput(e.target.value)}
						onBlur={onBlurPrice}
						inputLabel='원'
					/>
					<LabelTextField
						label={'메뉴 설명'}
						value={descInput}
						onChange={(e) => {
							setDescInput(e.target.value);
						}}
						onBlur={(e) =>
							setData((prev) => {
								if (prev) {
									prev.description = e.target.value;
									return { ...prev };
								}
							})
						}
						inputStyle={{ width: 400, height: 150 }}
					/>
					<div className='flex items-center gap-[12px]'>
						<div className='text-xs text-gray w-[90px]'>
							메뉴 이미지
						</div>
						<Upload
							listType='picture-card'
							fileList={fileList}
							onChange={(info) => setFileList(info.fileList)}
							customRequest={({ file, onSuccess }) => {
								onSuccess?.({}, file); // 업로드 성공을 시뮬레이트
							}}
							onPreview={handlePreview} // 미리보기 핸들러 설정
							accept='image/*'>
							<UploadButton />
						</Upload>
					</div>
				</div>
				<div className='flex items-center gap-[8px] self-end'>
					<Button
						onClick={() => {
							docId ? onClickEdit() : onClickAdd();
						}}
						variant={'solid'}
						color='orange'
						style={{ width: 'fit-content' }}>
						{docId ? '수정' : '추가'}
					</Button>
					<Button
						onClick={() => navigate(-1)}
						style={{ width: 'fit-content' }}>
						목록
					</Button>
				</div>
				<Modal
					open={previewVisible}
					footer={null}
					onCancel={() => setPreviewVisible(false)}>
					<img
						alt='preview'
						style={{ width: '100%' }}
						src={previewImage}
					/>
				</Modal>
			</div>
		</CommonTemplate>
	);
}
