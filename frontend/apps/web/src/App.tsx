import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home/Home';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { Exhibition } from './pages/exhibition/Exhibition';
import EmailVerifyPage from "./pages/auth/EmailVerifyPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth/login" replace />} />
      <Route path="/home" element={<Home />} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/signup" element={<Signup />} />
      <Route path="/auth/email/verify" element={<EmailVerifyPage />} />
      <Route path="/exhibition" element={<Exhibition />} />
      <Route path="*" element={<div>Not Found</div>} />
    </Routes>
  );
}

export default App;