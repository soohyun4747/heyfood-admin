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
} from './OrdersTemplate';
import {
	formatTimestampToDate,
	formatTimestampToDateTime,
	formatTimestampToTime,
} from 'utils/time';
import { collNameUsers, UserData } from './UsersTemplate';
import { collNameMenus, MenuData } from './MenusTemplate';
import { Button } from 'antd';
import { fetchDataWithDocId } from 'utils/firebase';

export function OrderDetailTemplate() {
	const [orderData, setOrderData] = useState<OrderData>();
	const [orderItemData, setOrderItemData] = useState<OrderItemData>();
	const [ordererData, setOrdererData] = useState<UserData>();
	const [menuData, setMenuData] = useState<MenuData>();

	const docId = useDocIdStore((state) => state.id);
	const navigate = useNavigate();

	useEffect(() => {
		getSetInitData(docId);
	}, [docId]);

	const getSetInitData = async (docId: string | undefined) => {
		if (docId) {
			const orderItem: OrderItemData = await fetchDataWithDocId(
				collNameOrderItems,
				docId
			);
			const menu: MenuData = await fetchDataWithDocId(
				collNameMenus,
				orderItem.menuId
			);
			const order: OrderData = await fetchDataWithDocId(
				collNameOrders,
				orderItem.orderId
			);
			const orderer: UserData = await fetchDataWithDocId(
				order.ordererType === ordererType.guest
					? collNameGuests
					: collNameUsers,
				order.ordererId
			);
			setOrderItemData(orderItem);
			setOrderData(order);
			setOrdererData(orderer);
			setMenuData(menu);
		}
	};

	return (
		<CommonTemplate label={'회원정보'}>
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
						value={orderItemData?.menuId}
					/>
					<LabelValue
						label={'수량'}
						value={orderItemData?.quantity}
					/>
					<LabelValue
						label={'금액'}
						value={
							orderItemData && menuData
								? `${(
										orderItemData.quantity * menuData.price
								  ).toLocaleString('en-US')}원`
								: undefined
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
						value={
							orderData?.address + ' ' + orderData?.addressDetail
						}
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
