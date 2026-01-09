import { useState, useEffect } from 'react';
import styles from './ExhibitionDecorate.module.css';
import type { CukeeStyle, CukeeId } from '../../types/cukee';

interface ExhibitionDecorateProps {
  onClose: () => void;
  cukeeStyle: CukeeStyle;
  onChangeCukeeStyle: (style: CukeeStyle) => void;

  // 큐키 ID 관련 props 추가
  // cukeeId: CukeeId;
  // onChangeCukeeId: (id: CukeeId) => void;
}

export const ExhibitionDecorate = ({ 
  onClose, 
  cukeeStyle, 
  onChangeCukeeStyle, 
  // cukeeId, 
  // onChangeCukeeId 
}: ExhibitionDecorateProps) => {
  // 액자 스타일
  const [frameStyle, setFrameStyle] = useState('none');
  // 배경 스타일
  const [bgStyle, setBgStyle] = useState('white');

  // bgStyle이 바뀔 때마다 body 배경 적용
  useEffect(() => {
    // console.log('bgStyle:', bgStyle);
    switch (bgStyle) {
      case 'none':
        document.body.style.backgroundColor = '#EDE6DD';
        document.body.style.backgroundImage = ''; // 색 비우기 
        break;
      case 'pink':
        document.body.style.backgroundColor = 'rgba(254, 224, 229, 1)';
        document.body.style.backgroundImage = '';
        break;
      case 'blue':
        document.body.style.backgroundColor = 'rgba(199, 235, 255, 1)';
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
              className={`${styles.optionButton} ${styles.frameOption}`}
              onClick={() => setFrameStyle('none')}
            >
              none
            </button>
            <button
              className={`${styles.optionButton} ${styles.frameOption}`}
              onClick={() => setFrameStyle('액자')}
            >
              액자
            </button>
          </div>
        </div>

        {/* 배경 스타일 */}
        <div className={styles.row}>
          <span className={styles.label}>♥ 배경 스타일</span>
          <div className={styles.colorOptions}>
            <button className={`${styles.optionButton} ${styles.bgNone}`} onClick={() => setBgStyle('none')}> </button>
            <button className={`${styles.optionButton} ${styles.bgPink}`} onClick={() => setBgStyle('pink')}> </button>
            <button className={`${styles.optionButton} ${styles.bgBlue}`} onClick={() => setBgStyle('blue')}> </button>
            <button className={`${styles.optionButton} ${styles.bgPattern}`} onClick={() => setBgStyle('pattern')}> </button>
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
        onClick={() => {
            console.log('적용된 스타일:', { frameStyle, bgStyle, cukeeStyle });
            onClose(); // 닫기
          }}>
          ✔
        </button>
      </div>
    </div>
  );
};


