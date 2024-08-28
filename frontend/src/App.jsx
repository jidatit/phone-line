import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import AuthLayout from './auth/Layout';
import UserSignup from './auth/UserSignup';
import UserLogin from './auth/UserLogin';
import AdminLogin from './auth/AdminLogin';

import UserLayout from './user_portal/Layout';
import UserActivateLine from './user_portal/pages/ActivateLine';
import UserReports from './user_portal/pages/Reports';
import UserBilling from './user_portal/pages/Billing';

import AdminLayout from './admin_portal/Layout';
import AdminAllUsers from './admin_portal/pages/AllUsers'
import AdminPayments from './admin_portal/pages/Payments'

function App() {

  return (
    <>
      <Router>
        <Routes>

          <Route path='/' element={<AuthLayout />}>
            <Route index element={<UserLogin />} />
            <Route path='signup' element={<UserSignup />} />
            <Route path='admin' element={<AdminLogin />} />
          </Route>

          <Route path='/user_portal' element={<UserLayout />}>
            <Route index element={<UserActivateLine />} />
            <Route path='reports' element={<UserReports/>} />
            <Route path='billing' element={<UserBilling/>} />
          </Route>

          <Route path='/admin_portal' element={<AdminLayout />}>
            <Route index element={<AdminAllUsers />} />
            <Route path='payments' element={<AdminPayments/>} />
          </Route>

        </Routes>
      </Router>
    </>
  )
}

export default App;