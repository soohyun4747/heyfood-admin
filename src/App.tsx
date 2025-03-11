import { Route, Routes } from 'react-router-dom';
import { pathNames } from './const/pathNames';
import { LoginPage } from './pages/LoginPage';
import { UsersPage } from './pages/UsersPage';
import { useEffect } from 'react';
import { addUsers100 } from 'test/user';

function App() {
	useEffect(() => {
		//test
		// addUsers100();
	}, []);

	return (
		<Routes>
			<Route
				path={pathNames.login}
				element={<LoginPage />}
			/>
			<Route
				path={pathNames.userManagement}
				element={<UsersPage />}
			/>
		</Routes>
	);
}

export default App;
