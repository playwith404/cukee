import { useEffect } from 'react';
import styles from './ExhibitionDecorate.module.css';
import type { CukeeStyle} from '../../types/cukee';

interface ExhibitionDecorateProps {
  exhibitionId: number | null;    // ✅ 추가
  exhibitionTitle: string; // ✅ 추가
  onClose: () => void;
  ticketId: number; // ticket.id를 통해 캐릭터 폴더(c1, c2...) 식별
  cukeeStyle: CukeeStyle;
  onChangeCukeeStyle: (style: CukeeStyle) => void;

  // 액자 관련 Props 추가
  frameStyle: 'none' | 'basic' | 'frame2';
  onChangeFrameStyle: (style: 'none' | 'basic' | 'frame2') => void;

  // ✅ 배경 스타일 관련 Props 추가
  background: string; 
  onChangeBackground: (style: string) => void;

  onSaveClick: () => void; // 저장(체크) 버튼 클릭 시 호출되는 함수(모달)
}

export const ExhibitionDecorate = ({ 
  // exhibitionTitle, 
  // onClose, 
  // ticketId, // 부모로부터 받은 티켓 ID
  cukeeStyle, 
  onChangeCukeeStyle,
  frameStyle,
  onChangeFrameStyle,
  background,         
  onChangeBackground,
  onSaveClick, // ✅ 추가
}: ExhibitionDecorateProps) => {

  // background이 바뀔 때마다 body 배경 적용
  useEffect(() => {
    // console.log('background:', background);
    switch (background) {
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
  }, [background]);

  // [추가] DB 저장 함수
  // const handleSaveDesign = async () => {
  //   const designData = {
  //     title: exhibitionTitle, // 기존 제목 유지
  //     ticket_id: ticketId,
  //     design: {
  //       frame_style: frameStyle,
  //       background: background,
  //       cukee_style: cukeeStyle, // 'line', 'noline', 'unbalance'
  //     }
  //   };

  //   try {
  //     // PUT 요청으로 기존 전시회 ID의 디자인을 수정
  //     const response = await fetch(`/api/exhibitions/${exhibitionId}`, {
  //       method: 'PUT',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(designData),
  //     });

  //     if (response.ok) {
  //       alert('디자인이 저장되었습니다! 🎨');
  //       onClose(); // 저장 성공 시 창 닫기
  //     } else {
  //       alert('디자인 저장에 실패했습니다.');
  //     }
  //   } catch (error) {
  //     console.error('저장 중 오류 발생:', error);
  //   }
  // };

  return (
    <div className={`${styles.container} ${styles[background]}`}>
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
              나무
            </button>
            <button
              className={`${styles.optionButton} ${frameStyle === 'frame2' ? styles.active : ''}`}
              onClick={() => onChangeFrameStyle('frame2')}
            >
              구름
            </button>
          </div>
        </div>

        {/* 배경 스타일 */}
        <div className={styles.row}>
          <span className={styles.label}>♥ 배경 스타일</span>
          <div className={styles.colorOptions}>
            {/* ✅ setBackground 대신 부모에서 온 onChangeBackground 사용 */}
            <button className={`${styles.optionButton} ${styles.bgNone} ${background === 'none' ? styles.active : ''}`} onClick={() => onChangeBackground('none')}> </button>
            <button className={`${styles.optionButton} ${styles.bgPink} ${background === 'pink' ? styles.active : ''}`} onClick={() => onChangeBackground('pink')}> </button>
            <button className={`${styles.optionButton} ${styles.bgBlue} ${background === 'blue' ? styles.active : ''}`} onClick={() => onChangeBackground('blue')}> </button>
            <button className={`${styles.optionButton} ${styles.bgPattern} ${background === 'pattern' ? styles.active : ''}`} onClick={() => onChangeBackground('pattern')}> </button>
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
        onClick={onSaveClick}>
          ✔
        </button>
      </div>
    </div>
  );
};