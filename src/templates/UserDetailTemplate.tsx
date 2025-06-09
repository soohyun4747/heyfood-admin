import { LabelTextField } from 'components/LabelTexfield';
import { CommonTemplate } from './CommonTemplate';
import { ChangeEvent, useEffect, useState } from 'react';
import { useDocIdStore } from 'stores/docIdStore';
import { collNameUsers, IUser } from './UsersTemplate';
import { Button } from 'antd';
import { LabelValue } from 'components/LabelValue';
import { useNavigate } from 'react-router-dom';
import { fetchDataWithDocId } from 'utils/firebase';

export function UserDetailTemplate() {
	const [data, setData] = useState<IUser>();

	const docId = useDocIdStore((state) => state.id);
	const navigate = useNavigate();

	useEffect(() => {
		if (docId) {
			fetchDataWithDocId(collNameUsers, docId, setData);
		}
	}, [docId]);

	return (
		<CommonTemplate label={'회원정보'}>
			<div className='flex flex-col gap-[18px]'>
				<div className='flex flex-col gap-[18px] border-b border-stone-100 pb-[24px]'>
					<LabelValue
						label={'이름'}
						value={data?.name}
					/>
					<LabelValue
						label={'이메일'}
						value={data?.email}
					/>
					<LabelValue
						label={'전화번호'}
						value={data?.phone}
					/>
					<LabelValue
						label={'주소'}
						value={data?.address}
					/>
					<LabelValue
						label={'상세주소'}
						value={data?.addressDetail}
					/>
					<LabelValue
						label={'가입일'}
						value={
							data
								? new Date(
										data.createdAt.seconds * 1000 +
											data.createdAt.nanoseconds / 1000000
								  ).toLocaleString()
								: undefined
						}
					/>
					<LabelValue
						label={'마케팅동의'}
						value={data?.marketingAgree ? 'o' : 'x'}
					/>
					<LabelValue
						label={'수정일'}
						value={
							data?.updatedAt
								? new Date(
										data.updatedAt.seconds * 1000 +
											data.updatedAt.nanoseconds / 1000000
								  ).toLocaleString()
								: undefined
						}
					/>
				</div>
				<Button
					onClick={() => navigate(-1)}
					style={{ width: 'fit-content', alignSelf: 'end' }}>
					목록
				</Button>
			</div>
		</CommonTemplate>
	);
}
