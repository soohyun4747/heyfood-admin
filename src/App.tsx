import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { pathNames } from './const/pathNames';
import { useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
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
import { ReviewsTemplate } from 'templates/ReviewsTemplate';
import { ReviewsDetailTemplate } from 'templates/ReviewsDetailTemplate';
import { PaymentsTemplate } from 'templates/PaymentsTemplate';
import { PaymentDetailTemplate } from 'templates/PaymentDetailTemplate';

function App() {
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const unsub = onAuthStateChanged(auth, (user) => {
			const isLoginPage = location.pathname === pathNames.login;			

			if (user) {
				// 이미 로그인된 상태
				if (isLoginPage)
					navigate(pathNames.userManagement, { replace: true });
				// 로그인 외 페이지면 그대로 둠
			} else {
				// 미로그인 상태
				if (!isLoginPage) navigate(pathNames.login, { replace: true });
			}
		});

		return () => unsub();
	}, [location.pathname, navigate]);

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
				path={pathNames.paymentsManagement}
				element={<PaymentsTemplate />}
			/>
			<Route
				path={pathNames.paymentDetail}
				element={<PaymentDetailTemplate />}
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
                        <Route
                                path={pathNames.reviewsManagement}
                                element={<ReviewsTemplate />}
                        />
                        <Route
                                path={pathNames.reviewsDetail}
                                element={<ReviewsDetailTemplate />}
                        />
                </Routes>
        );
}

export default App;
