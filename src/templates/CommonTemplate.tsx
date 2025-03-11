import { Divider, Segmented } from 'antd';
import { JSX } from 'react';

export function CommonTemplate({
	content,
	label,
	allCnt,
}: {
	content: JSX.Element;
	label: string;
	allCnt: number;
}) {
	return (
		<div>
			<div className='w-full h-[40px] p-[12px] flex gap-[4px] items-center bg-[#f5f5f5]'>
				<img
					src='/logo2.png'
					width={80}
				/>
				<div className='text-xs text-gray'>
					관리자페이지
				</div>
			</div>
			<Segmented<string>
				block
				style={{ width: '100%' }}
				options={[
					'회원관리',
					'메뉴관리',
					'주문내역',
					'팝업관리',
					'배너관리',
					'배송지관리',
				]}
				onChange={(value) => {
					console.log(value); // string
				}}
			/>
			<div className='py-[10px]'>
				<div className='flex items-center justify-between border-b border-stone-100 pb-[8px]'>
					<div className='px-[18px] font-semibold text-gray-dark'>
						{label}
					</div>
					<div className='px-[18px] flex items-center text-xs gap-[6px]'>
						<div className='text-gray'>전체목록</div>
						<div>{allCnt}</div>
					</div>
				</div>
				<div className='px-[18px] py-[16px]'>{content}</div>
			</div>
		</div>
	);
}
