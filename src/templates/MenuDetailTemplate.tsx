import { useEffect, useState } from 'react';
import {
	collNameMenuCategories,
	collNameMenus,
	CategoryData,
	MenuData,
} from './MenusTemplate';
import { useDocIdStore } from 'stores/docIdStore';
import { useNavigate } from 'react-router-dom';
import {
	addData,
	deleteData,
	deleteFile,
	fetchCollectionData,
	fetchDataWithDocId,
	fetchFileData,
	updateData,
	uploadFileData,
} from 'utils/firebase';
import { CommonTemplate } from './CommonTemplate';
import { Button, message, Modal, Upload, UploadFile } from 'antd';
import { LabelTextField } from 'components/LabelTexfield';
import { LabelDropdown, Option } from 'components/LabelDropdown';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase/firestore';
import { UploadButton } from 'components/UploadButton';
import { pathNames } from 'const/pathNames';
import { LabelTextArea } from 'components/LabelTextArea';

const htmlBreakRegex = /<br\s*\/?>(\r\n|\r|\n)?/gi;

const convertDescriptionForTextarea = (description: string) =>
        description.replace(htmlBreakRegex, '\n');

const convertDescriptionForStorage = (description: string) =>
        description.replace(/\r\n|\r|\n/g, '<br />');

export function MenuDetailTemplate() {
	const [data, setData] = useState<MenuData>();
	const [menuCategoryOptions, setMenuCategoryOptions] = useState<Option[]>();
	const [nameInput, setNameInput] = useState<string>('');
	const [priceInput, setPriceInput] = useState<number | string>(0);
	const [descInput, setDescInput] = useState<string>('');
	const [ingredInput, setIngredInput] = useState<string>('');
	const [fileList, setFileList] = useState<UploadFile[]>([]);
	const [detailFileList, setDetailFileList] = useState<UploadFile[]>([]);
	const [previewVisible, setPreviewVisible] = useState(false); // 미리보기 모달 표시 여부
	const [previewImage, setPreviewImage] = useState<string>(''); // 미리보기 이미지 URL

	const docId = useDocIdStore((state) => state.id);
	const setDocId = useDocIdStore((state) => state.setId);
	const navigate = useNavigate();

	useEffect(() => {
		getSetInitData(docId);

		//when exiting the page
		return () => {
			setDocId(undefined);
		};
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
                                if (menuData.imageDetailPath) {
                                        fetchFileData(
                                                [menuData.imageDetailPath],
                                                setDetailFileList
                                        );
                                }

                                const descriptionForTextarea =
                                        convertDescriptionForTextarea(
                                                menuData.description ?? ''
                                        );

                                setNameInput(menuData.name);
                                setPriceInput(menuData.price);
                                setIngredInput(menuData.ingredient);
                                setDescInput(descriptionForTextarea);
                                setData({
                                        ...menuData,
                                        description: descriptionForTextarea,
                                });
                        }
                } else {
			if (categoryOptions) {
				createSetInitMenuData(categoryOptions);
			}
		}
	};

	const getAllMenuNames = async () => {
		const allMenu = (await fetchCollectionData(collNameMenus)) as
			| MenuData[]
			| undefined;

		return allMenu?.map((menu) => menu.name);
	};

	const createSetInitMenuData = (menuCategoryOptions: Option[]) => {
		const initMenuData: MenuData = {
			id: uuidv4(),
			name: '',
			categoryId: menuCategoryOptions[0].value as string,
			description: '',
			price: 0,
			imagePaths: [],
			createdAt: Timestamp.now(),
			ingredient: '',
			imageDetailPath: '',
		};

		setData(initMenuData);
	};

	const getSetMenuCategoryOptions = async () => {
		const menuCategories = (await fetchCollectionData(
			collNameMenuCategories
		)) as CategoryData[] | undefined;

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
			setPriceInput(numVal);
		}
	};

	// 미리보기 클릭 핸들러
	const handlePreview = (file: any) => {
		setPreviewImage(file.url || URL.createObjectURL(file.originFileObj));
		setPreviewVisible(true); // 모달 표시
	};

        const onClickAdd = async (messageObj: string) => {
                if (data) {
                        const uploadingData = { ...data };
                        uploadingData.imagePaths = [];
                        uploadingData.description = descInput;

                        //겹치는 이름이 없는지 확인
                        if (!(await isNameUnique(uploadingData))) {
                                return;
                        }

			//모든 항목이 채워져있는지 확인
                        if (checkAllValuesFilled(uploadingData, fileList)) {
                                //주문내역에서 검색에 용이하게 하기 위해 id랑 name을 통일
                                uploadingData.id = uploadingData.name;
                                uploadingData.description =
                                        convertDescriptionForStorage(
                                                uploadingData.description
                                        );

                                //사진 파일 저장
                                let idx = 1;
                                for (const file of fileList) {
                                        if (!uploadingData.imagePaths.includes(file.name)) {
						const path = `menus/${uploadingData.name}_${idx++}`;
						await uploadFileData(file, path);
						uploadingData.imagePaths.push(path);
					}
				}

				if (
					detailFileList[0] &&
					uploadingData.imageDetailPath !== detailFileList[0].name
				) {
					const path = `menus/${uploadingData.name}_detail`;
					await uploadFileData(detailFileList[0], path);
					uploadingData.imageDetailPath = path;
				} else {
					uploadingData.imageDetailPath = '';
				}

				//데이터 저장
				if (await addData(collNameMenus, uploadingData)) {
					message.success(`${messageObj} 완료하였습니다.`);
				} else {
					message.error(`${messageObj} 실패하였습니다.`);
				}
				navigate(pathNames.menusManagement);
			} else {
				message.error('모든 항목을 채워주세요.');
				return;
			}
		}
	};

	const onClickEdit = async () => {
		if (data) {
			//기존 데이터 삭제
			await deleteData(collNameMenus, data.id);
			await onClickAdd('수정을');
		}
	};

	const checkAllValuesFilled = (
		data: MenuData,
		fileList: UploadFile<any>[]
	) => {
		const keys = Object.keys(data).filter(
			(item) => item !== 'imageDetailPath'
		); //imageDetailPath is optional
		let isAllFilled = true;

		for (let i = 0; i < keys.length; i++) {
			if (!data[keys[i]]) {
				isAllFilled = false;
				break;
			}
		}

		if (fileList.length < 1) {
			isAllFilled = false;
		}

		return isAllFilled;
	};

	const isNameUnique = async (data: MenuData) => {
		const allMenuNames = await getAllMenuNames();

		if (allMenuNames?.includes(data.name)) {
			message.error(
				'이미 존재하는 메뉴명입니다. 다른 메뉴명을 사용해주세요.'
			);
			return false;
		}
		return true;
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
						label={'재료'}
						value={ingredInput}
						onChange={(e) => {
							setIngredInput(e.target.value);
						}}
						onBlur={(e) =>
							setData((prev) => {
								if (prev) {
									prev.ingredient = e.target.value;
									return { ...prev };
								}
							})
						}
					/>
					<LabelTextArea
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
					<div className='flex items-center gap-[12px]'>
						<div className='text-xs text-gray w-[90px]'>
							상세 이미지
						</div>
						<Upload
							listType='picture-card'
							fileList={detailFileList}
							onChange={(info) =>
								setDetailFileList(info.fileList)
							}
							customRequest={({ file, onSuccess }) => {
								onSuccess?.({}, file); // 업로드 성공을 시뮬레이트
							}}
							maxCount={1}
							onPreview={handlePreview} // 미리보기 핸들러 설정
							accept='image/*'>
							<UploadButton />
						</Upload>
					</div>
				</div>
				<div className='flex items-center gap-[8px] self-end'>
					<Button
						onClick={() => {
							docId ? onClickEdit() : onClickAdd('추가를');
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
