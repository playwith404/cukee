import styles from './TopControls.module.css';

interface TopControlsProps {
  onSave?: () => void;
  onDecorate?: () => void;
}

export const TopControls = ({ onSave, onDecorate }: TopControlsProps) => {
  return (
    <div className={styles.container}>
      <button className={styles.button} onClick={onSave}>전시회 저장하기</button>
      <button className={styles.button} onClick={onDecorate}>전시회 꾸미기</button>
    </div>
  );
};