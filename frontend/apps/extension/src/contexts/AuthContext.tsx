import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkAuth, login as apiLogin, logout as apiLogout } from '../apis/auth';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'; // 환경변수 확인

const MOCK_USER = {
    userId: 999,
    email: 'mock@cukee.com',
    nickname: '개발용',
};

const GUEST_CREDENTIALS = {
    email: 'ywcho1118@naver.com',
    password: 'Howareyou!1'
};

interface User {
    userId: number;
    email: string;
    nickname: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    setAuthUser: (user: User) => void;
    updateNickname: (newNickname: string) => Promise<void>;
    withdraw: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                // 1. 먼저 현재 유효한 세션(쿠키)이 있는지 확인
                const userData = await checkAuth();
                console.log("✅ 기존 로그인 정보 확인됨:", userData.nickname);
                setUser(userData);
            } catch (error) {
                // 2. 로그인이 안 되어 있다면? -> '공용 게스트 계정'으로 자동 로그인 시도!
                console.log("🚀 로그인 정보 없음. 게스트 자동 로그인 시도 중...");
                
                try {
                    // 백엔드에 로그인 요청 -> 성공 시 쿠키가 브라우저에 심어짐
                    const guestUser = await apiLogin(GUEST_CREDENTIALS.email, GUEST_CREDENTIALS.password);
                    console.log("🎉 게스트 로그인 성공!");
                    setUser(guestUser);
                } catch (loginError) {
                    console.error("❌ 게스트 로그인 실패 (백엔드 확인 필요):", loginError);
                    setUser(null);
                }
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);
    
    const login = async (email: string, password: string) => {
        // [1] Mock 모드면 API 호출 아예 안 함 (바로 성공 처리)
        if (USE_MOCK) {
            console.log(`🛠️ [Mock Mode] 로그인 성공 (입력값: ${email})`);
            setUser(MOCK_USER);
            return; // 여기서 함수 종료!
        }

        // [2] Real 모드면 여기서 API 호출
        // 에러가 나면 Login.tsx의 catch 블록으로 던져짐
        const userData = await apiLogin(email, password);
        setUser(userData);
    };
    // ✅ 추가: 이미 로그인 된 유저 정보(회원가입 직후 등)를 상태에 반영
    const setAuthUser = (userData: User) => {
        console.log("✅ [Auth] 사용자 상태 직접 업데이트 (회원가입 후)");
        setUser(userData);
    };

    // [신규] 닉네임 변경
    const updateNickname = async (newNickname: string) => {
        if (USE_MOCK) {
            if (user) setUser({ ...user, nickname: newNickname });
            return;
        }

        // 실제 API 호출 (apis/auth.ts에 updateProfile 추가 필요)
        const { updateProfile } = await import('../apis/auth');
        await updateProfile({ nickname: newNickname });

        // 상태 업데이트 (화면 즉시 반영 - 응답값 의존 X, 요청값 사용)
        setUser((prev) => prev ? { ...prev, nickname: newNickname } : null);
    };

    const logout = async () => {
        if (USE_MOCK) {
            console.log("[Mock Mode] 로그아웃");
            setUser(null);
            return;
        }
        try {
            await apiLogout();
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            setUser(null);
            // Optional: Redirect handling here or in component
        }
    };

    // [신규] 회원 탈퇴
    const withdraw = async (password: string) => {
        if (USE_MOCK) {
            console.log(`[Mock Mode] 회원 탈퇴 처리됨 (비밀번호: ${password})`);
            setUser(null);
            return;
        }

        // 1. API 호출 (비밀번호 전달)
        const { withdrawUser } = await import('../apis/auth');
        await withdrawUser(password);

        // 2. 로그아웃 처리 (로컬 상태 초기화)
        // 백엔드에서 이미 쿠키를 삭제했으므로 클라이언트 상태만 비우면 됨.
        // 안전을 위해 logout() 호출하여 확실히 처리
        await logout();
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            logout,
            setAuthUser,
            updateNickname,
            withdraw
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
