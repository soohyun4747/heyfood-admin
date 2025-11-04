import { useEffect, useState } from 'react';
import { useDocIdStore } from 'stores/docIdStore';
import { CommonTemplate } from './CommonTemplate';
import { collNameReviews, IReview } from './ReviewsTemplate';
import {
        addData,
        fetchDataWithDocId,
        fetchFileData,
        updateData,
        uploadFileData,
} from 'utils/firebase';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase/firestore';
import { Button, message, Modal, Upload, UploadFile } from 'antd';
import { useNavigate } from 'react-router-dom';
import { pathNames } from 'const/pathNames';
import { LabelTextField } from 'components/LabelTexfield';
import { LabelTextArea } from 'components/LabelTextArea';
import { UploadButton } from 'components/UploadButton';

const htmlBreakRegex = /<br\s*\/?>(\r\n|\r|\n)?/gi;

const convertCommentForTextarea = (comment: string) =>
        comment.replace(htmlBreakRegex, '\n');

const convertCommentForStorage = (comment: string) =>
        comment.replace(/\r\n|\r|\n/g, '<br />');

export function ReviewsDetailTemplate() {
        const [data, setData] = useState<IReview>();
        const [titleInput, setTitleInput] = useState('');
        const [nameInput, setNameInput] = useState('');
        const [emailInput, setEmailInput] = useState('');
        const [commentInput, setCommentInput] = useState('');
        const [fileList, setFileList] = useState<UploadFile<any>[]>([]);
        const [previewVisible, setPreviewVisible] = useState(false);
        const [previewImage, setPreviewImage] = useState('');

        const docId = useDocIdStore((state) => state.id);
        const setDocId = useDocIdStore((state) => state.setId);
        const navigate = useNavigate();

        useEffect(() => {
                getSetInitData(docId);

                return () => {
                        setDocId(undefined);
                };
        }, [docId, setDocId]);

        const getSetInitData = async (id: string | undefined) => {
                if (id) {
                        const reviewData = (await fetchDataWithDocId(
                                collNameReviews,
                                id,
                                setData
                        )) as IReview | undefined;

                        if (reviewData) {
                                const commentForTextarea = convertCommentForTextarea(
                                        reviewData.comment ?? ''
                                );

                                setTitleInput(reviewData.title ?? '');
                                setNameInput(reviewData.name ?? '');
                                setEmailInput(reviewData.email ?? '');
                                setCommentInput(commentForTextarea);
                                setData({
                                        ...reviewData,
                                        comment: commentForTextarea,
                                });

                                if (reviewData.imagePaths?.length) {
                                        fetchFileData(reviewData.imagePaths, setFileList);
                                }
                        }
                } else {
                        const initData: IReview = {
                                id: uuidv4(),
                                name: '',
                                email: '',
                                comment: '',
                                title: '',
                                imagePaths: [],
                                createdAt: Timestamp.now(),
                        };

                        setData(initData);
                        setTitleInput('');
                        setNameInput('');
                        setEmailInput('');
                        setCommentInput('');
                        setFileList([]);
                }
        };

        const handlePreview = (file: UploadFile) => {
                if (!file.url && file.originFileObj) {
                        const url = URL.createObjectURL(file.originFileObj as File);
                        setPreviewImage(url);
                } else if (typeof file.url === 'string') {
                        setPreviewImage(file.url);
                }
                setPreviewVisible(true);
        };

        const onClickSubmit = async () => {
                if (!data) return;

                const uploadingData: IReview = {
                        ...data,
                        title: titleInput.trim(),
                        name: nameInput.trim(),
                        email: emailInput.trim(),
                        comment: convertCommentForStorage(commentInput),
                };

                if (
                        !uploadingData.title ||
                        !uploadingData.name ||
                        !uploadingData.email ||
                        !uploadingData.comment
                ) {
                        message.error('필수 항목을 입력해주세요.');
                        return;
                }

                if (fileList.length === 0) {
                        message.error('리뷰 이미지를 업로드해주세요.');
                        return;
                }

                const newImagePaths: string[] = [];
                let idx = 1;
                for (const file of fileList) {
                        if (file.originFileObj) {
                                const path = `reviews/${uploadingData.id}_${idx++}`;
                                await uploadFileData(file, path);
                                newImagePaths.push(path);
                        } else {
                                newImagePaths.push(file.uid);
                        }
                }
                uploadingData.imagePaths = newImagePaths;

                if (!docId) {
                        uploadingData.createdAt = Timestamp.now();
                }

                const isSuccess = docId
                        ? await updateData(collNameReviews, uploadingData)
                        : await addData(collNameReviews, uploadingData);

                if (isSuccess) {
                        message.success(docId ? '수정을 완료하였습니다.' : '추가를 완료하였습니다.');
                        navigate(pathNames.reviewsManagement);
                } else {
                        message.error(docId ? '수정을 실패하였습니다.' : '추가를 실패하였습니다.');
                }
        };

        return (
                <CommonTemplate label={docId ? '리뷰정보' : '리뷰추가'}>
                        <div className='flex flex-col gap-[18px]'>
                                <div className='flex flex-col gap-[18px] border-b border-stone-100 pb-[24px]'>
                                        <LabelTextField
                                                label='제목'
                                                value={titleInput}
                                                onChange={(e) => {
                                                        const value = e.target.value;
                                                        setTitleInput(value);
                                                        setData((prev) =>
                                                                prev
                                                                        ? {
                                                                                  ...prev,
                                                                                  title: value,
                                                                          }
                                                                        : prev
                                                        );
                                                }}
                                        />
                                        <LabelTextField
                                                label='이름'
                                                value={nameInput}
                                                onChange={(e) => {
                                                        const value = e.target.value;
                                                        setNameInput(value);
                                                        setData((prev) =>
                                                                prev
                                                                        ? {
                                                                                  ...prev,
                                                                                  name: value,
                                                                          }
                                                                        : prev
                                                        );
                                                }}
                                        />
                                        <LabelTextField
                                                label='이메일'
                                                value={emailInput}
                                                onChange={(e) => {
                                                        const value = e.target.value;
                                                        setEmailInput(value);
                                                        setData((prev) =>
                                                                prev
                                                                        ? {
                                                                                  ...prev,
                                                                                  email: value,
                                                                          }
                                                                        : prev
                                                        );
                                                }}
                                        />
                                        <LabelTextArea
                                                label='내용'
                                                value={commentInput}
                                                onChange={(e) => {
                                                        const value = e.target.value;
                                                        setCommentInput(value);
                                                        setData((prev) =>
                                                                prev
                                                                        ? {
                                                                                  ...prev,
                                                                                  comment: value,
                                                                          }
                                                                        : prev
                                                        );
                                                }}
                                                inputStyle={{ width: 400, height: 150 }}
                                        />
                                        <div className='flex items-center gap-[12px]'>
                                                <div className='text-xs text-gray w-[90px]'>사진</div>
                                                <Upload
                                                        listType='picture-card'
                                                        fileList={fileList}
                                                        onChange={(info) => setFileList(info.fileList)}
                                                        onPreview={handlePreview}
                                                        customRequest={({ file, onSuccess }) => {
                                                                onSuccess?.({}, file);
                                                        }}
                                                        multiple
                                                        accept='image/*'>
                                                        <UploadButton />
                                                </Upload>
                                        </div>
                                </div>
                                <div className='flex items-center gap-[8px] self-end'>
                                        <Button
                                                onClick={onClickSubmit}
                                                variant='solid'
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
