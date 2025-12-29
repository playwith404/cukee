import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home/Home';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { Exhibition } from './pages/exhibition/Exhibition';
import EmailVerifyPage from "./pages/auth/EmailVerifyPage";
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/auth/login" replace />} />

        {/* Public Routes */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />
        <Route path="/auth/email/verify" element={<EmailVerifyPage />} />

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