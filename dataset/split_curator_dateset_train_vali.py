import json
import random
import os

# ==========================================
# 설정
# ==========================================
INPUT_FILE = "cukee_lora_dataset_rich.jsonl"  # 생성된 원본 파일
TRAIN_FILE = "data_train.jsonl"               # 학습용 (90%)
VAL_FILE = "data_val.jsonl"                   # 검증용 (10%)
TEST_PROMPTS_FILE = "test_prompts.json"       # 나중에 사람이 눈으로 확인할 질문지

SPLIT_RATIO = 0.9  # 9:1 비율

def split_data():
    if not os.path.exists(INPUT_FILE):
        print(f"Error: {INPUT_FILE} 파일을 찾을 수 없습니다.")
        return

    # 1. 데이터 로드
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    data = [json.loads(line) for line in lines]
    total_count = len(data)
    
    # 2. 무작위 셔플 (랜덤하게 섞기)
    random.shuffle(data)
    
    # 3. 분할
    train_size = int(total_count * SPLIT_RATIO)
    train_data = data[:train_size]
    val_data = data[train_size:]
    
    print(f"📊 전체 데이터: {total_count}개")
    print(f"✅ 학습용(Train): {len(train_data)}개")
    print(f"✅ 검증용(Val): {len(val_data)}개")

    # 4. 파일 저장
    with open(TRAIN_FILE, 'w', encoding='utf-8') as f:
        for entry in train_data:
            json.dump(entry, f, ensure_ascii=False)
            f.write('\n')
            
    with open(VAL_FILE, 'w', encoding='utf-8') as f:
        for entry in val_data:
            json.dump(entry, f, ensure_ascii=False)
            f.write('\n')

    # 5. [중요] 검증용 데이터에서 '정답'을 빼고 '질문'만 따로 저장하기
    # 나중에 모델한테 이 질문을 던져보고, 실제 정답(Gemini가 쓴 것)과 비교해보기 위함
    test_prompts = []
    for entry in val_data:
        # User의 질문 내용 추출
        user_msg = next(msg for msg in entry['messages'] if msg['role'] == 'user')['content']
        # System Prompt 추출 (누구인지 알아야 하니까)
        system_msg = next(msg for msg in entry['messages'] if msg['role'] == 'system')['content']
        # 정답(Reference) 추출
        assistant_msg = next(msg for msg in entry['messages'] if msg['role'] == 'assistant')['content']
        
        test_prompts.append({
            "theme": entry['meta']['theme'],
            "movie_id": entry['meta']['movie_id'],
            "input_prompt": f"<|system|>\n{system_msg}\n<|user|>\n{user_msg}\n<|assistant|>\n", # Llama 포맷 예시
            "reference_answer": assistant_msg
        })

    with open(TEST_PROMPTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(test_prompts, f, ensure_ascii=False, indent=2)
        
    print(f"📝 테스트용 질문지 생성 완료: {TEST_PROMPTS_FILE}")

if __name__ == "__main__":
    split_data()