import { useEffect } from 'react';
import styles from './ExhibitionDecorate.module.css';
import type { CukeeStyle} from '../../types/cukee';

interface ExhibitionDecorateProps {
  onClose: () => void;
  ticketId: number; // ticket.id를 통해 캐릭터 폴더(c1, c2...) 식별
  cukeeStyle: CukeeStyle;
  onChangeCukeeStyle: (style: CukeeStyle) => void;

  // 큐키 ID 관련 props 추가
  // cukeeId: CukeeId;
  // onChangeCukeeId: (id: CukeeId) => void;

  // 액자 관련 Props 추가
  frameStyle: 'none' | 'basic';
  onChangeFrameStyle: (style: 'none' | 'basic') => void;

  // ✅ 배경 스타일 관련 Props 추가
  bgStyle: string; 
  onChangeBgStyle: (style: string) => void;
}

export const ExhibitionDecorate = ({ 
  onClose, 
  ticketId, // 부모로부터 받은 티켓 ID
  cukeeStyle, 
  onChangeCukeeStyle, 
  // cukeeId, 
  // onChangeCukeeId 
  frameStyle,
  onChangeFrameStyle,
  bgStyle,         
  onChangeBgStyle 
}: ExhibitionDecorateProps) => {
  // 액자 스타일
  // const [frameStyle, setFrameStyle] = useState('none');

  // bgStyle이 바뀔 때마다 body 배경 적용
  useEffect(() => {
    // console.log('bgStyle:', bgStyle);
    switch (bgStyle) {
      case 'none':
        document.body.style.backgroundColor = '#EDE6DD';
        document.body.style.backgroundImage = ''; // 색 비우기 
        break;
      case 'pink':
        document.body.style.backgroundColor = 'rgba(244, 224, 227, 1)';
        document.body.style.backgroundImage = '';
        break;
      case 'blue':
        document.body.style.backgroundColor = 'rgba(205, 221, 230, 1)';
        document.body.style.backgroundImage = '';
        break;
      case 'pattern':
        document.body.style.backgroundImage = '';
        document.body.style.backgroundImage = "url('/pattern1.png')";
        document.body.style.backgroundSize = 'cover';
        break;
    }

    // 페이지를 벗어나면 원래대로 복원
    return () => {
      document.body.style.backgroundColor = '#EDE6DD';
      document.body.style.backgroundImage = '';
    };
  }, [bgStyle]);

  // [추가] DB 저장 함수
  const handleSaveDesign = async () => {
    const designData = {
      ticket_id: ticketId,
      background_style: bgStyle,
      frame_style: frameStyle,
      cukee_style: cukeeStyle, // 'line', 'noline', 'unbalance'
    };

    try {
      // 실제 API 엔드포인트에 맞춰 수정하세요
      const response = await fetch('/api/tickets/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(designData),
      });

      if (response.ok) {
        alert('전시회 디자인이 저장되었습니다! 🎨');
        onClose(); // 저장 성공 시 창 닫기
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('저장 중 오류 발생:', error);
    }
  };

  return (
    <div className={`${styles.container} ${styles[bgStyle]}`}>
      <div className={styles.bubble}>
        {/* 상단 타이틀 */}
        <h3 className={styles.title}>♡ 전시회 꾸미기 ♡</h3>

        {/* 액자 스타일 */}
        <div className={styles.row}>
          <span className={styles.label}>♥ 액자 스타일</span>
          <div className={styles.options}>
            <button
              className={`${styles.optionButton} ${frameStyle === 'none' ? styles.active : ''}`}
              onClick={() => onChangeFrameStyle('none')}
            >
              none
            </button>
            <button
              className={`${styles.optionButton} ${frameStyle === 'basic' ? styles.active : ''}`}
              onClick={() => onChangeFrameStyle('basic')}
            >
              액자
            </button>
          </div>
        </div>

        {/* 배경 스타일 */}
        <div className={styles.row}>
          <span className={styles.label}>♥ 배경 스타일</span>
          <div className={styles.colorOptions}>
            {/* ✅ setBgStyle 대신 부모에서 온 onChangeBgStyle 사용 */}
            <button className={`${styles.optionButton} ${styles.bgNone} ${bgStyle === 'none' ? styles.active : ''}`} onClick={() => onChangeBgStyle('none')}> </button>
            <button className={`${styles.optionButton} ${styles.bgPink} ${bgStyle === 'pink' ? styles.active : ''}`} onClick={() => onChangeBgStyle('pink')}> </button>
            <button className={`${styles.optionButton} ${styles.bgBlue} ${bgStyle === 'blue' ? styles.active : ''}`} onClick={() => onChangeBgStyle('blue')}> </button>
            <button className={`${styles.optionButton} ${styles.bgPattern} ${bgStyle === 'pattern' ? styles.active : ''}`} onClick={() => onChangeBgStyle('pattern')}> </button>
          </div>
        </div>

        {/* 쿠키(캐릭터) 스타일 */}
        <div className={styles.row}>
          <span className={styles.label}>♥ 쿠키 스타일</span>
          <div className={styles.options}>
            <button
              className={`${styles.optionButton} ${styles.cukeeOption} ${cukeeStyle === 'line' ? styles.active : ''}`}
              onClick={() => onChangeCukeeStyle('line')}
            >
              선
            </button>

            <button
              className={`${styles.optionButton} ${styles.cukeeOption} ${cukeeStyle === 'noline' ? styles.active : ''}`}
              onClick={() => onChangeCukeeStyle('noline')}
            >
              선 X
            </button>

            <button
              className={`${styles.optionButton} ${styles.cukeeOption} ${cukeeStyle === 'unbalance' ? styles.active : ''}`}
              onClick={() => onChangeCukeeStyle('unbalance')}
            >
              언밸런스
            </button>
          </div>
        </div>

        {/* 완료 버튼 */}
        <button className={styles.confirmButton} 
        onClick={handleSaveDesign}>
          ✔
        </button>
      </div>
    </div>
  );
};