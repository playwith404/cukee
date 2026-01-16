import axios from 'axios';

export const client = axios.create({
  baseURL: 'https://cukee.world', // 또는 개발 서버 주소
  withCredentials: true, // 쿠키를 주고받기 위해 필수!
});