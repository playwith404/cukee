// apps/web/app/components/exhibition/CuratorGuide.tsx
'use client';

interface CuratorGuideProps {
  likeCount?: number;
  message?: React.ReactNode;
  cookieStyle?: string; // [추가] 큐키 스타일 프롭
}

export const CuratorGuide = ({
  likeCount = 103,
  message = <>안녕, 길초! MZ 큐레이터 김엠지 예요.<br />짧고 도파민 터지는 맛도리 영화만 추천해줄게요.</>,
  cookieStyle = 'default'
}: CuratorGuideProps) => {
  return (
    <div className="middle-interaction-area">
      {/* [확실한 해결책] 검은색 선(#000000)만 투명하게 날려버리는 정밀 SVG 필터 정의 */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="remove-outline">
            {/* 검은색 계열(R,G,B가 모두 낮은 값)을 투명하게 만드는 컬러 매트릭스 */}
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      -1 -1 -1 1 0"
            />
          </filter>

          <filter id="unbalance-style">
            {/* 언밸런스: 이미지를 복사해서 선 부분만 어긋나게 오프셋 배치 */}
            <feOffset in="SourceAlpha" dx="15" dy="10" result="offsetShadow" />
            <feColorMatrix in="offsetShadow" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.15 0" result="shadowColor" />
            <feMerge>
              <feMergeNode in="shadowColor" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <div className="character-wrapper">
        <img
          src="/cara/c1.png"
          alt="MZ Curator"
          // [수정] 큐키 스타일 클래스 적용
          className={`character-img cookie-style-${cookieStyle}`}
        />
      </div>

      <div className="bubble-wrapper">
        <p className="like-info">♥ {likeCount} 명의 유저가 이 쿠키를 좋아해요.</p>
        <div className="curator-speech-bubble">
          {message}
        </div>
      </div>
    </div>
  );
};