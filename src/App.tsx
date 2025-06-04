import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { pathNames } from './const/pathNames';
import { useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from 'config/firebase';
import '@ant-design/v5-patch-for-react-19';
import { LoginTemplate } from 'templates/LoginTemplate';
import { UsersTemplate } from 'templates/UsersTemplate';
import { UserDetailTemplate } from 'templates/UserDetailTemplate';
import { MenusTemplate } from 'templates/MenusTemplate';
import { MenuDetailTemplate } from 'templates/MenuDetailTemplate';
import { OrdersTemplate } from 'templates/OrdersTemplate';
import { OrderDetailTemplate } from 'templates/OrderDetailTemplate';
import { PopupsTemplate } from 'templates/PopupsTemplate';
import { PopupDetailTemplate } from 'templates/PopupDetailTemplate';
import { FAQsTemplate } from 'templates/FAQsTemplate';
import { FAQDetailTemplate } from 'templates/FAQDetailTemplate';

function App() {
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		//test
		// addUsers100();
		// generateRandomOrderData();

		checkAuthority();
	}, []);

	const checkAuthority = async () => {
		const email = localStorage.getItem('email');
		const password = localStorage.getItem('password');

		try {
			if (email && password) {
				await signInWithEmailAndPassword(auth, email, password);

				//로그인 페이지로 들어온 경우 이미 로그인이 되어있으면 회원관리 페이지로
				if (location.pathname === pathNames.login) {
					navigate(pathNames.userManagement);
				}
			} else {
				navigate(pathNames.login);
			}
		} catch (error) {
			console.error(error);
			navigate(pathNames.login);
		}
	};

	return (
		<Routes>
			<Route
				path={pathNames.login}
				element={<LoginTemplate />}
			/>
			<Route
				path={pathNames.userManagement}
				element={<UsersTemplate />}
			/>
			<Route
				path={pathNames.userDetail}
				element={<UserDetailTemplate />}
			/>
			<Route
				path={pathNames.menusManagement}
				element={<MenusTemplate />}
			/>
			<Route
				path={pathNames.menuDetail}
				element={<MenuDetailTemplate />}
			/>
			<Route
				path={pathNames.ordersManagement}
				element={<OrdersTemplate />}
			/>
			<Route
				path={pathNames.orderDetail}
				element={<OrderDetailTemplate />}
			/>
			<Route
				path={pathNames.popupsManagement}
				element={<PopupsTemplate />}
			/>
			<Route
				path={pathNames.popupDetail}
				element={<PopupDetailTemplate />}
			/>
			<Route
				path={pathNames.FAQsManagement}
				element={<FAQsTemplate />}
			/>
			<Route
				path={pathNames.FAQDetail}
				element={<FAQDetailTemplate />}
			/>
		</Routes>
	);
}

export default App;
