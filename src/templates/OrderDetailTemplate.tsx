import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocIdStore } from 'stores/docIdStore';
import { CommonTemplate } from './CommonTemplate';
import { LabelValue } from 'components/LabelValue';
import {
	collNameGuests,
	collNameOrderItems,
	collNameOrders,
	OrderData,
	ordererType,
	OrderItemData,
	orderStatusLabels,
	paymentMethodLabels,
} from './OrdersTemplate';
import { formatTimestampToDate, formatTimestampToTime } from 'utils/time';
import { collNameUsers, IUser } from './UsersTemplate';
import { Button } from 'antd';
import { fetchDataWithDocId, fetchImageUrl } from 'utils/firebase';

export const bankCodes: {[key:string]: string} = {
	'001': '한국은행',
	'002': '산업은행',
	'003': '기업은행',
	'004': '국민은행',
	'005': '외환은행',
	'007': '수협중앙회',
	'008': '수출입은행',
	'011': '농협중앙회',
	'012': '농협회원조합',
	'020': '우리은행',
	'023': 'SC은행',
	'026': '서울은행',
	'027': '한국씨티은행',
	'031': '대구은행',
	'032': '부산은행',
	'034': '광주은행',
	'035': '제주은행',
	'037': '전북은행',
	'039': '경남은행',
	'045': '새마을금고연합회',
	'048': '신협중앙회',
	'050': '상호저축은행',
	'071': '우체국',
	'081': '하나은행',
	'088': '신한은행',
	'089': '케이뱅크',
	'090': '카카오뱅크',

};

export function OrderDetailTemplate() {
	const [orderData, setOrderData] = useState<OrderData>();
	const [orderItemData, setOrderItemData] = useState<OrderItemData>();
	const [ordererData, setOrdererData] = useState<IUser>();
	// const [menuData, setMenuData] = useState<MenuData>();
	const [downloadUrl, setDownloadUrl] = useState<string>('');

	const docId = useDocIdStore((state) => state.id);
	const navigate = useNavigate();

	const imagePath = orderData?.stickerFile
		? `stickers/${orderData?.id}`
		: undefined;

	useEffect(() => {
		if (imagePath) {
			getSetImageUrl(imagePath);
		}
	}, [imagePath]);

	const getSetImageUrl = async (path: string) => {
		const url = await fetchImageUrl(path);
		if (url) {
			setDownloadUrl(url);
		}
	};

	useEffect(() => {
		getSetInitData(docId);
	}, [docId]);

	const getSetInitData = async (docId: string | undefined) => {
		if (docId) {
			const orderItem: OrderItemData = await fetchDataWithDocId(
				collNameOrderItems,
				docId
			);
			// const menu: MenuData = await fetchDataWithDocId(
			// 	collNameMenus,
			// 	orderItem.menuId
			// );
			const order: OrderData = await fetchDataWithDocId(
				collNameOrders,
				orderItem.orderId
			);
			const orderer: IUser = await fetchDataWithDocId(
				order.ordererType === ordererType.guest
					? collNameGuests
					: collNameUsers,
				order.ordererId
			);
			setOrderItemData(orderItem);
			setOrderData(order);
			setOrdererData(orderer);
			// setMenuData(menu);
		}
	};

	const handleDownload = async () => {
		if (!downloadUrl || !imagePath) return;
		try {
			const res = await fetch(downloadUrl);
			const blob = await res.blob();
			const blobUrl = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = blobUrl;
			// 파일명 추출
			const filename = imagePath.split('/').pop() ?? 'download';
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(blobUrl);
		} catch (e) {
			console.error(e);
			alert('다운로드 중 오류가 발생했습니다.');
		}
	};
	return (
		<CommonTemplate
			label={'주문정보'}
			rightElement={
				<Button
					onClick={() => navigate(-1)}
					style={{ width: 'fit-content', alignSelf: 'end' }}>
					목록
				</Button>
			}>
			<div className='flex flex-col gap-[18px]'>
				<div className='flex flex-col gap-[18px] border-b border-stone-100 pb-[24px]'>
					<div className='text-sm'>주문정보</div>
					<LabelValue
						label={'주문번호'}
						value={orderData?.id}
					/>
					<LabelValue
						label={'주문날짜'}
						value={
							orderData
								? formatTimestampToDate(orderData.createdAt)
								: undefined
						}
					/>
					<LabelValue
						label={'주문시간'}
						value={
							orderData
								? formatTimestampToTime(orderData?.createdAt)
								: undefined
						}
					/>
					<LabelValue
						label={'이메일'}
						value={ordererData?.email}
					/>
					<LabelValue
						label={'도시락 종류'}
						value={orderItemData?.categoryId}
					/>
					<LabelValue
						label={'메뉴명'}
						value={orderItemData?.menuName}
					/>
					<LabelValue
						label={'수량'}
						value={orderItemData?.quantity}
					/>
					<LabelValue
						label={'금액'}
						value={
							orderItemData
								? `${(
										orderItemData.quantity *
										orderItemData.menuPrice
								  ).toLocaleString('en-US')}원`
								: undefined
						}
					/>
					<LabelValue
						label={'결제방법'}
						value={
							orderData &&
							paymentMethodLabels[orderData?.paymentMethod]
						}
					/>
					<LabelValue
						label={'결제상태'}
						value={
							orderData &&
							orderStatusLabels[orderData?.orderStatus]
						}
					/>
					<LabelValue
						label={'수정일'}
						value={
							orderItemData?.updatedAt
								? new Date(
										orderItemData.updatedAt.seconds * 1000 +
											orderItemData.updatedAt
												.nanoseconds /
												1000000
								  ).toLocaleString()
								: undefined
						}
					/>
				</div>
				<div className='flex flex-col gap-[18px] border-b border-stone-100 pb-[24px]'>
					<div className='text-sm'>배송정보</div>
					<LabelValue
						label={'주소'}
						value={orderItemData?.address}
					/>
					<LabelValue
						label={'상세주소'}
						value={orderItemData?.addressDetail}
					/>
					<LabelValue
						label={'이름'}
						value={ordererData?.name}
					/>
					<LabelValue
						label={'연락처'}
						value={ordererData?.phone}
					/>
					<LabelValue
						label={'배달날짜'}
						value={
							orderItemData
								? formatTimestampToDate(
										orderItemData?.deliveryDate
								  )
								: undefined
						}
					/>
					<LabelValue
						label={'배달시간'}
						value={
							orderItemData
								? formatTimestampToTime(
										orderItemData?.deliveryDate
								  )
								: undefined
						}
					/>
					<LabelValue
						label={'요구사항'}
						value={orderData?.comment}
					/>
					<LabelValue
						label={'덮밥 발열'}
						value={
							typeof orderData?.heating === 'boolean'
								? orderData?.heating
									? 'o'
									: 'x'
								: ''
						}
					/>
					<LabelValue
						label={'스티커 문구'}
						value={orderData?.stickerPhrase}
					/>
					<div className='flex items-center gap-[12px]'>
						<div className='text-xs text-gray w-[90px]'>
							스티커 사진
						</div>
						<div className='flex flex-col gap-[8px]'>
							<div className='flex items-center justify-center h-[120px] min-w-[120px] border-2 border-dashed border-neutral-300 rounded-lg '>
								{orderData?.stickerFile && (
									<img
										src={downloadUrl}
										alt='Preview'
										className='object-contain w-full h-full'
									/>
								)}
							</div>
							<Button
								style={{ width: '100%' }}
								onClick={handleDownload}
								disabled={
									orderData?.stickerFile ? false : true
								}>
								다운로드
							</Button>
						</div>
					</div>
				</div>
			</div>
		</CommonTemplate>
	);
}
