import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import HomePage from './pages/Home/Home';
import { Exhibition } from './pages/exhibition/Exhibition';
import Login from './pages/auth/Login';

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/exhibition" element={<Exhibition />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;