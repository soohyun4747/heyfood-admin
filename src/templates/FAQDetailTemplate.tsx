import { useDocIdStore } from 'stores/docIdStore';
import { CommonTemplate } from './CommonTemplate';
import { LabelDropdown, Option } from 'components/LabelDropdown';
import { useEffect, useState } from 'react';
import { collNameFAQCategories, collNameFAQs, FAQData } from './FAQsTemplate';
import {
	addData,
	fetchCollectionData,
	fetchDataWithDocId,
	updateData,
} from 'utils/firebase';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase/firestore';
import { LabelTextField } from 'components/LabelTexfield';
import { Button, message } from 'antd';
import { pathNames } from 'const/pathNames';
import { LabelTextArea } from 'components/LabelTextArea';

export function FAQDetailTemplate() {
	const [data, setData] = useState<FAQData>();
	const [FAQCategoryOptions, setFAQCategoryOptions] = useState<Option[]>();
	const [titleInput, setTitleInput] = useState<string>();
	const [contentInput, setContentInput] = useState<string>();

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
				setTitleInput(FAQData.title);
				setContentInput(FAQData.content);
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
			content: '',
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
		if (data && checkAllValuesFilled(data)) {
			const isSuccess = await updateData(collNameFAQs, data);
			if (isSuccess) {
				message.success(`수정이 완료되었습니다.`);
			} else {
				message.success(`수정을 실패하였습니다.`);
			}
			navigate(pathNames.FAQsManagement);
		} else {
			message.error('필수 항목을 채워주세요.');
		}
	};

	const onClickAdd = async () => {
		//필수 항목이 채워져있는지 확인
		if (data && checkAllValuesFilled(data)) {
			//데이터 저장
			if (await addData(collNameFAQs, data)) {
				message.success(`추가를 완료하였습니다.`);
			} else {
				message.error(`추가를 실패하였습니다.`);
			}
			navigate(pathNames.FAQsManagement);
		} else {
			message.error('필수 항목을 채워주세요.');
			return;
		}
	};

	const checkAllValuesFilled = (data: FAQData) => {
		const keys = Object.keys(data);
		let isAllFilled = true;

		for (let i = 0; i < keys.length; i++) {
			if (!data[keys[i]]) {
				isAllFilled = false;
				break;
			}
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
					<LabelTextArea
						label={'내용'}
						value={contentInput}
						onChange={(e) => {
							setContentInput(e.target.value);
						}}
						onBlur={(e) =>
							setData((prev) => {
								if (prev) {
									prev.content = e.target.value;
									return { ...prev };
								}
							})
						}
						inputStyle={{ width: 400, height: 150 }}
					/>
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
			</div>
		</CommonTemplate>
	);
}
