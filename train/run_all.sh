#!/bin/bash

# 큐레이터 리스트 (배열)
# 띄어쓰기가 있는 이름은 따옴표로 묶거나 언더바(_)로 처리된 파일명을 써야 합니다.
# (training_datasets 폴더 안의 파일명과 일치해야 함, .jsonl 제외)
CURATORS=(
    "폼_러버_MZ"
    "영화_덕후의_마이너"
    "잔잔한_힐링"
    "우울한_명작"
    "레전드_코미디"
    "액션_느와르"
    "세계관_과몰입"
    "팩트_체크"
    "역대급_호러"
    "설레는_로맨스"
    "2D_애니메이션"
)

# 로그 폴더 생성
mkdir -p logs

echo "=========================================="
echo "🎬 11인의 큐레이터 릴레이 학습 시작"
echo "=========================================="

for curator in "${CURATORS[@]}"; do
    echo ""
    echo "▶️  Starting Training for: $curator"
    
    # 파이썬 스크립트 실행 (로그는 개별 파일에도 저장)
    python train_single.py --curator_name "$curator" > "logs/${curator}.log" 2>&1
    
    # 종료 코드 확인
    if [ $? -eq 0 ]; then
        echo "✅ $curator 학습 성공!"
    else
        echo "❌ $curator 학습 실패! (logs/${curator}.log 확인 바람)"
        # 실패해도 멈추지 않고 다음으로 넘어갈지, 멈출지 결정 (여기선 일단 진행)
    fi
    
    # 잠시 휴식 (GPU 열 식히기 + 메모리 정리 확실히)
    sleep 5
done

echo ""
echo "=========================================="
echo "🎉 모든 학습 과정 종료!"
echo "=========================================="