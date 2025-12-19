/**
 * API 타입 정의
 */

// ===== Auth =====

export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface SignupResponse {
  userId: number;
  email: string;
  nickname: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: number;
  email: string;
  nickname: string;
}

export interface User {
  userId: number;
  email: string;
  nickname: string;
  createdAt: string;
}

// ===== Error =====

export interface ErrorResponse {
  detail: string;
}

// ===== Exhibition =====

export interface Exhibition {
  id: number;
  userId: number;
  title: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===== Ticket =====

export interface Ticket {
  id: number;
  ticketCode: string;
  name: string;
  curatorName: string;
  curatorMessage: string;
  tags: string[];
  color: string;
  imageUrl?: string;
}
