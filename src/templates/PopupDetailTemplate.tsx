import { useDocIdStore } from 'stores/docIdStore';
import { useEffect, useState } from 'react';
import { collNamePopups, PopupData } from './PopupsTemplate';
import { Button, DatePicker, message, Modal, Upload, UploadFile } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
	addData,
	fetchDataWithDocId,
	fetchFileData,
	updateData,
	uploadFileData,
} from 'utils/firebase';
import { CommonTemplate } from './CommonTemplate';
import { LabelTextField } from 'components/LabelTexfield';
import { UploadButton } from 'components/UploadButton';
import { pathNames } from 'const/pathNames';
import {
	dayjsToTimestamp,
	getTimestampEndofDay,
	getTimestampStartofDay,
	timestampToDayjs,
} from 'utils/time';
import dayjs, { Dayjs } from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase/firestore';

export function PopupDetailTemplate() {
	const [data, setData] = useState<PopupData>();
	const [titleInput, setTitleInput] = useState<string>();
	const [urlInput, setUrlInput] = useState<string>();
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
		if (docId) {
			const popupData = (await fetchDataWithDocId(
				collNamePopups,
				docId,
				setData
			)) as PopupData | undefined;
			if (popupData) {
				fetchFileData([popupData.imagePath], setFileList);
				setTitleInput(popupData.title);
			}
		} else {
			createSetInitMenuData();
		}
	};

	const createSetInitMenuData = () => {
		const initMenuData: PopupData = {
			id: uuidv4(),
			title: '',
			imagePath: '',
			startDate: getTimestampStartofDay(dayjs()),
			endDate: getTimestampEndofDay(dayjs().add(7, 'day')),
			createdAt: Timestamp.now(),
		};

		setData(initMenuData);
	};

	// 미리보기 클릭 핸들러
	const handlePreview = (file: any) => {
		setPreviewImage(file.url || URL.createObjectURL(file.originFileObj));
		setPreviewVisible(true); // 모달 표시
	};

	const uploadFileUpdateData = async (data: PopupData) => {
		const path = `popups/${data.id}`;
		await uploadFileData(fileList[0], path);

		data.imagePath = path;
	};

	const onClickEdit = async () => {
		if (data && checkAllValuesFilled(data, fileList)) {
			const uploadingData = { ...data };
			//사진 파일 저장
			await uploadFileUpdateData(uploadingData);

			const isSuccess = await updateData(collNamePopups, uploadingData);
			if (isSuccess) {
				message.success(`수정이 완료되었습니다.`);
			} else {
				message.success(`수정을 실패하였습니다.`);
			}
			navigate(pathNames.popupsManagement);
		} else {
			message.error('필수 항목을 채워주세요.');
		}
	};

	const onClickAdd = async () => {
		//필수 항목이 채워져있는지 확인
		if (data && checkAllValuesFilled(data, fileList)) {
			const uploadingData = { ...data };
			//사진 파일 저장
			await uploadFileUpdateData(uploadingData);

			//데이터 저장
			if (await addData(collNamePopups, uploadingData)) {
				message.success(`추가를 완료하였습니다.`);
			} else {
				message.error(`추가를 실패하였습니다.`);
			}
			navigate(pathNames.popupsManagement);
		} else {
			message.error('필수 항목을 채워주세요.');
			return;
		}
	};

	const checkAllValuesFilled = (
		data: PopupData,
		fileList: UploadFile<any>[]
	) => {
		let keys = Object.keys(data);
		keys = keys.filter((key) => key !== 'linkUrl' && key !== 'imagePath');
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

	const onChangeStartDate = (date: Dayjs) => {
		if (date) {
			setData((prev) => {
				if (prev) {
					if (date > timestampToDayjs(prev.endDate)) {
						prev.endDate = getTimestampEndofDay(date.add(7, 'day'));
					}
					prev.startDate = getTimestampStartofDay(date);
					return { ...prev };
				}
			});
		} else {
			setData((prev) => {
				if (prev) {
					return { ...prev };
				}
			});
		}
	};

	const onChangeEndDate = (date: Dayjs) => {
		if (date) {
			setData((prev) => {
				if (prev) {
					if (date < timestampToDayjs(prev.startDate)) {
						prev.startDate = getTimestampEndofDay(
							date.subtract(7, 'day')
						);
					}
					prev.endDate = getTimestampStartofDay(date);
					return { ...prev };
				}
			});
		} else {
			setData((prev) => {
				if (prev) {
					return { ...prev };
				}
			});
		}
	};

	return (
		<CommonTemplate label={docId ? '팝업정보' : '팝업추가'}>
			<div className='flex flex-col gap-[18px]'>
				<div className='flex flex-col gap-[18px] border-b border-stone-100 pb-[24px]'>
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
					<LabelTextField
						label={'링크 (선택)'}
						value={urlInput}
						onChange={(e) => setUrlInput(e.target.value)}
						onBlur={(e) =>
							setData((prev) => {
								if (prev) {
									prev.linkUrl = e.target.value;
									return { ...prev };
								}
							})
						}
					/>
					<div className='flex items-center gap-[12px]'>
						<div className='text-xs text-gray w-[90px]'>이미지</div>
						<Upload
							listType='picture-card'
							fileList={fileList}
							maxCount={1}
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
						<div className='text-xs text-gray w-[90px]'>시작일</div>
						<DatePicker
							value={
								data ? timestampToDayjs(data.startDate) : null
							}
							onChange={onChangeStartDate}
						/>
					</div>
					<div className='flex items-center gap-[12px]'>
						<div className='text-xs text-gray w-[90px]'>종료일</div>
						<DatePicker
							value={data ? timestampToDayjs(data.endDate) : null}
							onChange={onChangeEndDate}
						/>
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
