/**
 * useAuth Hook
 * 회원가입, 로그인, 로그아웃 관리
 */
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { SignupRequest, SignupResponse, LoginRequest, LoginResponse, User } from '@/types/api';

// 회원가입
export const useSignup = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SignupRequest): Promise<SignupResponse> => {
      const response = await api.post('/auth/signup', data);
      return response.data;
    },
    onSuccess: () => {
      // 회원가입 성공 시 자동으로 로그인 상태 (HttpOnly Cookie 발급됨)
      queryClient.invalidateQueries({ queryKey: ['user'] });
      router.push('/'); // 홈으로 이동
    },
  });
};

// 로그인
export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoginRequest): Promise<LoginResponse> => {
      const response = await api.post('/auth/login', data);
      return response.data;
    },
    onSuccess: () => {
      // 로그인 성공 시
      queryClient.invalidateQueries({ queryKey: ['user'] });
      router.push('/'); // 홈으로 이동
    },
  });
};

// 로그아웃
export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      await api.post('/auth/logout');
    },
    onSuccess: () => {
      // 로그아웃 성공 시
      queryClient.setQueryData(['user'], null);
      router.push('/auth/login');
    },
  });
};

// 현재 사용자 정보 조회
export const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: async (): Promise<User | null> => {
      try {
        const response = await api.get('/users/me');
        return response.data;
      } catch (error) {
        return null;
      }
    },
    retry: false,
  });
};
