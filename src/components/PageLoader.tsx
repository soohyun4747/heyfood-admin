import { Spin } from 'antd';

export const FullPageLoader = () => {
	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				width: '100vw',
				height: '100vh',
				backgroundColor: 'rgba(255, 255, 255, 0.5)',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				zIndex: 9999,
			}}>
			<Spin
				tip='잠시만 기다려주세요...'
				size='large'
			/>
		</div>
	);
};

export default FullPageLoader;
