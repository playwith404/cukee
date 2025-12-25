import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { Exhibition } from './pages/exhibition/Exhibition'; // 👈 import 추가
import EmailVerifyPage from "./pages/auth/EmailVerifyPage"; 

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/signup" element={<Signup />} />
      
      <Route path="/auth/email/verify" element={<EmailVerifyPage />} />

      {/* 👈 전시회 페이지 라우트 추가 */}
      <Route path="/exhibition" element={<Exhibition />} /> 
      
      <Route path="*" element={<div>Not Found</div>} />
    </Routes>
  );
}

export default App;