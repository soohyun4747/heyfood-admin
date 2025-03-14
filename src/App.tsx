import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { pathNames } from './const/pathNames';
import { useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from 'config/firebase';
import '@ant-design/v5-patch-for-react-19';
import { LoginTemplate } from 'templates/LoginTemplate';
import { UsersTemplate } from 'templates/UsersTemplate';
import { UserDetailTemplate } from 'templates/UserDetailTemplate';
import { MenusTemplate } from 'templates/menusTemplate';
import { MenuDetailTemplate } from 'templates/menuDetailTemplate';

function App() {
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		//test
		// addUsers100();

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
		</Routes>
	);
}

export default App;
