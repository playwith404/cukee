import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home/Home';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { GoogleCallback } from './pages/auth/GoogleCallback';
import { Exhibition } from './pages/exhibition/Exhibition';
import EmailVerifyPage from "./pages/auth/EmailVerifyPage";
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';

import { PublicRoute } from './components/PublicRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/auth/login" replace />} />

        {/* Public Routes (로그인 상태면 /home으로 리다이렉트) */}
        <Route element={<PublicRoute />}>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
        </Route>

        <Route path="/auth/email/verify" element={<EmailVerifyPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />

        {/* Private Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/exhibition" element={<Exhibition />} />
        </Route>

        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;