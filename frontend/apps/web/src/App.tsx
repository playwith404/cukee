import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { PublicRoute } from './components/PublicRoute';
import Loading from './components/Loading/Loading';

// Lazy Load Pages
const Home = lazy(() => import('./pages/Home/Home'));
const Login = lazy(() => import('./pages/auth/Login').then(module => ({ default: module.Login })));
const Signup = lazy(() => import('./pages/auth/Signup').then(module => ({ default: module.Signup })));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const GoogleCallback = lazy(() => import('./pages/auth/GoogleCallback').then(module => ({ default: module.GoogleCallback })));
const KakaoCallback = lazy(() => import('./pages/auth/KakaoCallback').then(module => ({ default: module.KakaoCallback })));
const Exhibition = lazy(() => import('./pages/exhibition/Exhibition').then(module => ({ default: module.Exhibition })));
const EmailVerifyPage = lazy(() => import("./pages/auth/EmailVerifyPage"));

const ConsoleLogin = lazy(() => import('./pages/console/ConsoleLogin'));
const ConsoleDashboard = lazy(() => import('./pages/console/ConsoleDashboard'));

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<Loading text="페이지 이동 중..." characterCount={5} />}>
        <Routes>
          <Route path="/" element={<Navigate to="/auth/login" replace />} />
          
          <Route path="/console/login" element={<ConsoleLogin />} />
          <Route path="/console/dashboard" element={<ConsoleDashboard />} />

          {/* Public Routes (로그인 상태면 /home으로 리다이렉트) */}
          <Route element={<PublicRoute />}>
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          </Route>

          <Route path="/auth/email/verify" element={<EmailVerifyPage />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallback />} />

          {/* Private Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/home" element={<Home />} />
            <Route path="/exhibition" element={<Exhibition />} />
          </Route>

          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;