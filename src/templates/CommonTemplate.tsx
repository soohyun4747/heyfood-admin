import { Segmented } from 'antd';
import { pathNames } from 'const/pathNames';
import { JSX } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const tabMenuUrls: { [key: string]: string } = {
	회원관리: pathNames.userManagement,
	메뉴관리: pathNames.menusManagement,
	주문관리: pathNames.ordersManagement,
	팝업관리: pathNames.popupsManagement,
	FAQ관리: pathNames.FAQsManagement,
};

const getTabValue = (pathName: string) => {
	const initPath = pathName.split('/').at(1);

	switch (`/${initPath}`) {
		case pathNames.userManagement:
			return '회원관리';
		case pathNames.menusManagement:
			return '메뉴관리';
		case pathNames.ordersManagement:
			return '주문관리';
		case pathNames.popupsManagement:
			return '팝업관리';
		case pathNames.FAQsManagement:
			return 'FAQ관리';
	}
};

export function CommonTemplate({
	children,
	label,
	rightElement,
	allCnt,
}: {
	children: JSX.Element;
	label: string;
	rightElement?: JSX.Element;
	allCnt?: number;
}) {
	const navigate = useNavigate();
	const location = useLocation();

	const onLogOut = () => {
		localStorage.clear();
		navigate(pathNames.login);
	};

	return (
		<div>
			<div className='w-full h-[40px] p-[12px] flex items-center justify-between bg-[#f5f5f5]'>
				<div className='flex gap-[4px] items-center'>
					<img
						src='/logo2.png'
						width={120}
					/>
					<div className='text-gray-light'>관리자페이지</div>
				</div>
				<div
					className='text-xs text-gray-light hover:cursor-pointer'
					onClick={onLogOut}>
					로그아웃
				</div>
			</div>
			<Segmented<string>
				block
				style={{ width: '100%' }}
				options={Object.keys(tabMenuUrls)}
				onChange={(value) => {
					navigate(tabMenuUrls[value]);
				}}
				value={getTabValue(location.pathname)}
			/>
			<div className='py-[10px] h-[calc(100vh-72px)] overflow-y-auto'>
				<div className='flex items-center justify-between border-b border-stone-100 pb-[8px] px-[18px]'>
					<div className='font-semibold text-gray-dark'>
						{label}
					</div>
					{allCnt !== undefined && (
						<div className='flex items-center text-xs gap-[6px]'>
							<div className='text-gray'>전체목록</div>
							<div>{allCnt}</div>
						</div>
					)}
					{rightElement}
				</div>
				<div className='px-[18px] py-[16px]'>{children}</div>
			</div>
		</div>
	);
}
