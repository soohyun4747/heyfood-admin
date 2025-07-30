import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocIdStore } from 'stores/docIdStore';
import { CommonTemplate } from './CommonTemplate';
import { LabelValue } from 'components/LabelValue';
import {
	collNameGuests,
	collNameOrders,
	OrderData,
	ordererType,
	orderStatusLabels,
	paymentMethodLabels,
} from './OrdersTemplate';
import { formatTimestampToDate, formatTimestampToTime } from 'utils/time';
import { collNameUsers, IUser } from './UsersTemplate';
import { Button } from 'antd';
import { fetchDataWithDocId } from 'utils/firebase';
import { bankCodes } from './OrderDetailTemplate';

export function PaymentDetailTemplate() {
	const [orderData, setOrderData] = useState<OrderData>();
	// const [orderItemData, setOrderItemData] = useState<OrderItemData>();
	const [ordererData, setOrdererData] = useState<IUser>();
	// const [menuData, setMenuData] = useState<MenuData>();
	// const [downloadUrl, setDownloadUrl] = useState<string>('');

	const docId = useDocIdStore((state) => state.id);
	const navigate = useNavigate();

	useEffect(() => {
		getSetInitData(docId);
	}, [docId]);

	const getSetInitData = async (docId: string | undefined) => {
		if (docId) {
			const order: OrderData = await fetchDataWithDocId(
				collNameOrders,
				docId
			);

			const orderer: IUser = await fetchDataWithDocId(
				order.ordererType === ordererType.guest
					? collNameGuests
					: collNameUsers,
				order.ordererId
			);
			setOrderData(order);
			setOrdererData(orderer);
		}
	};
	return (
		<CommonTemplate
			label={'결제정보'}
			rightElement={
				<Button
					onClick={() => navigate(-1)}
					style={{ width: 'fit-content', alignSelf: 'end' }}>
					목록
				</Button>
			}>
			<div className='flex flex-col gap-[18px]'>
				<div className='flex flex-col gap-[18px] border-b border-stone-100 pb-[24px]'>
					<div className='text-sm'>회원정보</div>
					<LabelValue
						label={'회원ID'}
						value={ordererData?.id}
					/>
					<LabelValue
						label={'회원/비회원'}
						value={
							orderData?.ordererType === 'guest'
								? '비회원'
								: '회원'
						}
					/>
					<LabelValue
						label={'이메일'}
						value={ordererData?.email}
					/>
					<LabelValue
						label={'이름'}
						value={ordererData?.name}
					/>
					<LabelValue
						label={'연락처'}
						value={ordererData?.phone}
					/>
				</div>
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
						label={'회사/업체명'}
						value={orderData?.companyName}
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
						label={'요구사항'}
						value={orderData?.comment}
					/>
					<LabelValue
						label={'스티커'}
						value={orderData?.stickerFile ? 'o' : 'x'}
					/>
					<LabelValue
						label={'스티커 금액'}
						value={
							orderData?.stickerPrice !== undefined
								? `${orderData?.stickerPrice?.toLocaleString()}원`
								: ''
						}
					/>
					<LabelValue
						label={'배송 금액'}
						value={
							orderData?.stickerPrice !== undefined
								? `${orderData?.deliveryPrice?.toLocaleString()}원`
								: ''
						}
					/>
					<LabelValue
						label={'총 금액'}
						value={`${orderData?.price.toLocaleString()}원`}
					/>
					<LabelValue
						label={'수정일'}
						value={
							orderData?.updatedAt
								? new Date(
										orderData.updatedAt.seconds * 1000 +
											orderData.updatedAt.nanoseconds /
												1000000
								  ).toLocaleString()
								: undefined
						}
					/>
				</div>

				<div className='flex flex-col gap-[18px] border-b border-stone-100 pb-[24px]'>
					<div className='text-sm'>환불정보</div>
					<LabelValue
						label={'은행명'}
						value={
							orderData?.refundBankCode &&
							bankCodes[orderData.refundBankCode]
						}
					/>
					<LabelValue
						label={'계좌번호'}
						value={orderData?.refundAccount}
					/>
					<LabelValue
						label={'예금주'}
						value={orderData?.refundHolder}
					/>
				</div>
			</div>
		</CommonTemplate>
	);
}
