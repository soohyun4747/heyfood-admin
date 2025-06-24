import { useDocIdStore } from 'stores/docIdStore';
import { CommonTemplate } from './CommonTemplate';
import { LabelDropdown, Option } from 'components/LabelDropdown';
import { useEffect, useState } from 'react';
import { collNameFAQCategories, collNameFAQs, FAQData } from './FAQsTemplate';
import {
	addData,
	deleteData,
	fetchCollectionData,
	fetchDataWithDocId,
	fetchFileData,
	updateData,
	uploadFileData,
} from 'utils/firebase';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase/firestore';
import { LabelTextField } from 'components/LabelTexfield';
import { Button, message, Upload, UploadFile } from 'antd';
import { pathNames } from 'const/pathNames';
import { LabelTextArea } from 'components/LabelTextArea';
import { UploadButton } from 'components/UploadButton';

export function FAQDetailTemplate() {
	const [data, setData] = useState<FAQData>();
	const [FAQCategoryOptions, setFAQCategoryOptions] = useState<Option[]>();
	const [titleInput, setTitleInput] = useState<string>();
	// const [contentInput, setContentInput] = useState<string>();
	const [fileList, setFileList] = useState<UploadFile[]>([]);
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
		const categoryOptions = await getSetFAQCategoryOptions();
		if (docId) {
			const FAQData = (await fetchDataWithDocId(
				collNameFAQs,
				docId,
				setData
			)) as FAQData | undefined;
			if (FAQData) {
				fetchFileData([FAQData.imagePath], setFileList);
				setTitleInput(FAQData.title);
			}
		} else {
			if (categoryOptions) {
				createSetInitFAQData(categoryOptions);
			}
		}
	};

	const createSetInitFAQData = (categoryOptions: Option[]) => {
		const initFAQData: FAQData = {
			id: uuidv4(),
			categoryId: categoryOptions[0].value as string,
			title: '',
			imagePath: '',
			createdAt: Timestamp.now(),
		};

		setData(initFAQData);
	};

	const getSetFAQCategoryOptions = async () => {
		const FAQCategories = (await fetchCollectionData(
			collNameFAQCategories
		)) as FAQData[] | undefined;

		if (FAQCategories) {
			const transformedData = FAQCategories.map((category) => ({
				value: category.id,
				label: category.name,
			}));
			setFAQCategoryOptions(transformedData);

			return transformedData;
		}
	};

	const onClickEdit = async () => {
		if (data) {
			//기존 데이터 삭제
			await deleteData(collNameFAQs, data.id);
			await onClickAdd('수정을');
		}
		// if (data && checkAllValuesFilled(data, fileList)) {
		// 	const isSuccess = await updateData(collNameFAQs, data);
		// 	if (isSuccess) {
		// 		message.success(`수정이 완료되었습니다.`);
		// 	} else {
		// 		message.success(`수정을 실패하였습니다.`);
		// 	}
		// 	navigate(pathNames.FAQsManagement);
		// } else {
		// 	message.error('필수 항목을 채워주세요.');
		// }
	};

	const onClickAdd = async (messageObj: string) => {
		if (data) {
			const uploadingData = { ...data };
			//필수 항목이 채워져있는지 확인
			if (checkAllValuesFilled(uploadingData, fileList)) {
				//사진 파일 저장

				if (
					fileList[0] &&
					uploadingData.imagePath !== fileList[0].name
				) {
					const path = `menus/${uploadingData.id}_detail`;
					await uploadFileData(fileList[0], path);
					uploadingData.imagePath = path;
				} else {
					uploadingData.imagePath = '';
				}

				//데이터 저장
				if (await addData(collNameFAQs, uploadingData)) {
					message.success(`${messageObj} 완료하였습니다.`);
				} else {
					message.error(`${messageObj} 실패하였습니다.`);
				}
				navigate(pathNames.FAQsManagement);
			} else {
				message.error('필수 항목을 채워주세요.');
				return;
			}
		}
	};

	// 미리보기 클릭 핸들러
	const handlePreview = (file: any) => {
		setPreviewImage(file.url || URL.createObjectURL(file.originFileObj));
		setPreviewVisible(true); // 모달 표시
	};

	const checkAllValuesFilled = (
		data: FAQData,
		fileList: UploadFile<any>[]
	) => {
		const keys = Object.keys(data).filter((item) => item !== 'imagePath');
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

	return (
		<CommonTemplate label={docId ? 'FAQ정보' : 'FAQ추가'}>
			<div className='flex flex-col gap-[18px]'>
				<div className='flex flex-col gap-[18px] border-b border-stone-100 pb-[24px]'>
					<LabelDropdown
						label={'종류'}
						options={FAQCategoryOptions}
						value={
							FAQCategoryOptions?.find(
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
						label={'제목'}
						value={titleInput}
						onChange={(e) => setTitleInput(e.target.value)}
						onBlur={(e) =>
							setData((prev) => {
								if (prev) {
									prev.title = e.target.value;
									return { ...prev };
								}
							})
						}
					/>
					<div className='flex items-center gap-[12px]'>
						<div className='text-xs text-gray w-[90px]'>내용</div>
						<Upload
							listType='picture-card'
							maxCount={1}
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
			</div>
		</CommonTemplate>
	);
}
