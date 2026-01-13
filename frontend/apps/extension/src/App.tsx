import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext'; // 👈 추가
import HomePage from './pages/Home/Home';
import { Exhibition } from './pages/exhibition/Exhibition';

function App() {
  return (
    <AuthProvider> {/* 👈 여기서 감싸주면 앱 전체에서 user 정보 사용 가능 */}
      <HashRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            {/* 필요한 다른 라우트들... */}
            <Route path="/exhibition" element={<Exhibition />} />
          </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;