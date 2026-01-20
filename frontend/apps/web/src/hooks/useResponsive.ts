/**
 * useResponsive.ts
 *
 * 반응형 디바이스 타입 감지 커스텀 훅
 *
 * 브레이크포인트:
 * - Mobile: ~767px (767px 이하)
 * - Tablet: 768px ~ 1199px
 * - Desktop: 1200px 이상
 *
 * 사용법:
 * ```tsx
 * const { deviceType, isMobile, isTablet, isDesktop } = useResponsive();
 *
 * // 조건부 스타일 적용
 * const styles = isMobile ? mobileStyles : desktopStyles;
 *
 * // 조건부 렌더링
 * {isMobile && <MobileComponent />}
 * ```
 */

import { useState, useEffect } from 'react';

/**
 * 디바이스 타입 정의
 * - 'desktop': 데스크톱 (1200px 이상)
 * - 'tablet': 태블릿 (768px ~ 1199px)
 * - 'mobile': 모바일 (767px 이하)
 */
export type DeviceType = 'desktop' | 'tablet' | 'mobile';

/**
 * useResponsive 훅의 반환 타입
 */
interface UseResponsiveReturn {
  /** 현재 디바이스 타입 ('desktop' | 'tablet' | 'mobile') */
  deviceType: DeviceType;
  /** 모바일 여부 (767px 이하) */
  isMobile: boolean;
  /** 태블릿 여부 (768px ~ 1199px) */
  isTablet: boolean;
  /** 데스크톱 여부 (1200px 이상) */
  isDesktop: boolean;
}

/**
 * 브레이크포인트 상수
 * - mobile: 767px 이하
 * - tablet: 768px ~ 1199px
 * - desktop: 1200px 이상 (암시적)
 */
const BREAKPOINTS = {
  mobile: 767,
  tablet: 1199,
};

/**
 * 반응형 디바이스 타입을 감지하는 커스텀 훅
 *
 * 윈도우 리사이즈 이벤트를 감지하여 현재 디바이스 타입을 반환합니다.
 * SSR 환경에서는 기본값으로 'desktop'을 사용합니다.
 *
 * @returns {UseResponsiveReturn} 디바이스 타입 및 boolean 플래그들
 */
export function useResponsive(): UseResponsiveReturn {
  // 기본값은 desktop (SSR 대응)
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  useEffect(() => {
    /**
     * 현재 윈도우 너비를 기준으로 디바이스 타입을 결정
     */
    const checkDevice = () => {
      const width = window.innerWidth;

      if (width <= BREAKPOINTS.mobile) {
        // 767px 이하: 모바일
        setDeviceType('mobile');
      } else if (width <= BREAKPOINTS.tablet) {
        // 768px ~ 1199px: 태블릿
        setDeviceType('tablet');
      } else {
        // 1200px 이상: 데스크톱
        setDeviceType('desktop');
      }
    };

    // 컴포넌트 마운트 시 초기 디바이스 타입 체크
    checkDevice();

    // 윈도우 리사이즈 이벤트 리스너 등록
    window.addEventListener('resize', checkDevice);

    // 클린업: 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return {
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
  };
}
