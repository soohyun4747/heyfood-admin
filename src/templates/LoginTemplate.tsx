import { Button, Checkbox, Form, FormProps, Input } from 'antd';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { pathNames } from '../const/pathNames';

type FieldType = {
	email?: string;
	password?: string;
};

export function LoginTemplate() {
	const navigate = useNavigate();

	const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
		console.log('Success:', values);
		if (values.email && values.password) {
			try {
				await signInWithEmailAndPassword(
					auth,
					values.email,
					values.password
				);
				navigate(pathNames.userManagement);
			} catch (error) {
				console.log(error);
			}
		}
	};

	const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (
		errorInfo
	) => {
		console.log('Failed:', errorInfo);
	};

	return (
		<div className='h-[100vh] w-[100vw] flex items-center justify-center'>
			<div className='flex flex-col gap-[8px] items-center'>
				<img
					src='/logo.png'
					width={36}
				/>
				<div className='text-xl font-semibold w-full text-center text-hey-orange mb-[12px]'>
					헤이푸드 관리자페이지 로그인
				</div>
				<Form
					name='basic'
					labelCol={{ span: 8 }}
					wrapperCol={{ span: 16 }}
					style={{ marginTop: 18 }}
					initialValues={{ remember: true }}
					onFinish={onFinish}
					onFinishFailed={onFinishFailed}
					autoComplete='off'>
					<Form.Item<FieldType>
						label='이메일'
						name='email'
						rules={[
							{
								required: true,
								message: '이메일을 입력하세요',
							},
						]}>
						<Input />
					</Form.Item>
					<Form.Item<FieldType>
						label='비밀번호'
						name='password'
						rules={[
							{
								required: true,
								message: '비밀번호를 입력하세요',
							},
						]}>
						<Input.Password />
					</Form.Item>
					<Form.Item label={null}>
						<Button
							style={{ background: '#EE7800', marginTop: 24 }}
							type='primary'
							htmlType='submit'>
							로그인
						</Button>
					</Form.Item>
				</Form>
			</div>
		</div>
	);
}
