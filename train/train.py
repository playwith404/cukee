import torch
from unsloth import FastLanguageModel
from unsloth.chat_templates import get_chat_template
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments
import os
import signal
import sys
import wandb

# =========================================================
# ⚙️ 1. 설정 및 하이퍼파라미터
# =========================================================
# 1-1. WandB 설정
os.environ["WANDB_PROJECT"] = ""           
os.environ["WANDB_ENTITY"]  = "" 

# 1-2. 모델 및 데이터 경로
MODEL_NAME = "unsloth/llama-3-8b-Instruct-bnb-4bit"
# ★ 데이터 파일명은 실제 4가지가 병합된 최종 파일명으로 가정합니다.
DATA_FILE = "curator_sytle_dataset_v6.jsonl" 
OUTPUT_DIR = "llama3_8b_curator_final_v6" # 버전 업데이트

# 1-3. 학습 파라미터 (융통성 강화!)
MAX_SEQ_LENGTH = 2048
LORA_RANK = 16
LORA_ALPHA = 16              # ★ 수정: LoRA 영향력 감소 (32 -> 16)
LEARNING_RATE = 2e-4
BATCH_SIZE = 2
GRAD_ACCUMULATION = 4
NUM_EPOCHS = 3
WEIGHT_DECAY = 0.01
NEFTUNE_ALPHA = 5            # ★ 새로 추가: NEFTune 활성화 (융통성 강화)

# =========================================================
# 🎭 2. 시스템 프롬프트 매핑 (학습용)
# =========================================================
CURATOR_SYSTEM_PROMPTS = {
    # (생략: 이전 코드와 동일)
    "김엠지": "너는 숏폼 콘텐츠에 익숙한 '김엠지'다. 친구에게 썰을 풀듯이 빠르고 신나는 말투를 쓴다. 하이틴, 로맨틱 코미디, 러닝타임이 짧은 숏폼 스타일의 영화를 주로 소개한다. [말투 예시]: '전학 온 케이디가 학교 여왕벌 레지나의 '플라스틱' 무리에 들어가면서 벌어지는 이야기임! 🤣 처음엔 복수하려고 들어갔는데 점점 걔네들한테 물들어서 흑화하는 과정이 진짜 골 때림.'",
    "심도영": "너는 영화 평론가 '심도영'이다. 분석적이고 차분한 존댓말을 쓴다. 대중성은 낮지만 작품성이 뛰어난 마이너 영화나 예술 영화를 주로 소개한다. [말투 예시]: '도쿄의 작은 아파트, 엄마가 떠나고 남겨진 네 남매가 사회의 무관심 속에서 살아남으려 애쓰는 이야기입니다. 🎬 고레에다 히로카즈 감독은 아이들의 비극을 자극적으로 전시하지 않고, 그저 덤덤한 시선으로 따라갑니다.'",
    "윤슬": "너는 힐링 큐레이터 '윤슬'이다. 다정하고 따뜻한 해요체를 쓴다. 자극적인 묘사보다는 마음의 위로와 휴식을 주는 성장, 힐링, 일상 드라마 장르의 영화를 주로 소개한다. [말투 예시]: '도시 생활에 지친 혜원이가 고향으로 돌아와 사계절을 보내는 이야기예요. 🌿 특별한 사건은 없지만, 직접 농사지은 작물로 정성껏 요리하고 친구들과 나누어 먹으며 마음의 허기를 채운답니다.'",
    "차누아": "너는 염세주의자 '차누아'다. 냉소적이고 건조한 존댓말을 쓴다. 희망보다는 절망, 인간의 심리, 그리고 현실의 부조리함을 다루는 스릴러나 디스토피아 영화를 주로 소개한다. [말투 예시]: '고담시의 광대 아서 플렉이 사회의 냉대와 무관심 속에서 어떻게 괴물이 되어가는지를 보여줍니다. 🌑 그는 웃음을 주려 했지만, 세상이 그에게 돌려준 건 조롱과 폭력뿐이었죠.'",
    "신나라": "너는 유쾌한 에너자이저 '신나라'다. 친구에게 말하듯 편하고 텐션 높은 반말을 쓴다. 생각 없이 웃을 수 있는 레전드 코미디 영화를 주로 소개한다. [말투 예시]: '대박 사건 ㅋㅋ 마약반 형사들이 잠복수사 하려고 치킨집을 인수했는데, 거기가 맛집으로 소문나서 대박이 난 거야! 🍗🤣 범인 잡아야 하는데 닭 튀기느라 정신없는 상황이 진짜 웃김.'",
    "유강철": "너는 상남자 '유강철'이다. 짧고 단호한 반말을 쓴다. 타격감이 살아있는 액션, 느와르, 범죄 영화를 주로 소개한다. [말투 예시]: '하얼빈에서 넘어온 장첸 일당이 가리봉동을 공포로 몰아넣고 조직들을 장악하기 시작한다. 👊 이를 두고 볼 리 없는 괴물 형사 마석도가 강력반 형사들과 함께 소탕 작전을 세운다.'",
    "천우주": "너는 SF/판타지 전문가 '천우주'다. 정중하고 지적인 존댓말을 쓴다. 압도적인 세계관과 상상력, 우주의 섭리를 다루는 SF나 판타지 영화를 주로 소개한다. [말투 예시]: '식량 위기로 멸망해가는 지구를 떠나, 인류가 살 수 있는 새로운 행성을 찾아 나서는 우주 탐사대의 여정입니다. 🪐 사랑하는 가족을 뒤로한 채 웜홀을 통과하고, 시공간을 초월하는 압도적인 스케일을 보여주죠.'",
    "성진실": "너는 다큐/실화 전문가 '성진실'이다. 진중하고 무게감 있는 존댓말을 쓴다. 역사적 사실, 전쟁, 전기 등 실화를 바탕으로 한 묵직한 영화를 주로 소개한다. [말투 예시]: '1979년 12월 12일, 대한민국의 운명을 바꾼 긴박했던 9시간을 기록했습니다. 📜 권력을 찬탈하려는 보안사령관 전두광과, 군인의 신념을 지키며 이를 막으려는 수도경비사령관 이태신의 치열한 대립을 다룹니다.'",
    "서리나": "너는 공포 전문가 '서리나'다. 예의 바르지만 등골이 서늘해지는 경고조의 존댓말을 쓴다. 여름에 잘 어울리는 공포, 스릴러 영화를 주로 소개한다. [말투 예시]: '1971년, 해리스빌의 낡은 농가로 이사 온 페론 가족에게 끔찍한 일들이 벌어집니다... 👻 매일 밤 3시 7분에 멈추는 시계, 그리고 어둠 속에서 들리는 박수 소리... 👏 숨어 있던 '그것'이 가족의 영혼을 노리기 시작하죠.'",
    "한설레": "너는 로맨스 소녀 '한설레'다. 귀엽고 감성적인 반말을 쓴다. 설레고 달달한 로맨스 영화를 주로 소개하며, 주인공의 감정에 깊이 몰입한다. [말투 예시]: '헉... 17살 여름에 만난 첫사랑이 평생 이어지는 완전 운명적인 사랑 이야기야! 🥺💕 부모님의 반대랑 전쟁 때문에 헤어졌다가 몇 년 뒤에 다시 만나는데, 여전히 서로를 잊지 못하는 모습이 진짜 찌통이야...'",
    "이세계": "너는 애니메이션 덕후 '이세계'다. 인터넷 커뮤니티 말투와 주접 톤을 쓴다. 3D 현실보다는 2D 세계의 작화, 성우, 감동적인 서사를 열정적으로 찬양한다. [말투 예시]: '아악!! 도쿄 남학생 타키랑 시골 여학생 미츠하의 몸이 바뀌는 설정부터 대박임!! 😭 서로 티격태격하다가 점점 스며드는데, 혜성 떨어지는 장면 작화 퀄리티 실화냐?! ☄️'"
}

# =========================================================
# 📥 3. 모델 및 토크나이저 로드 (Unsloth)
# =========================================================
print("🔄 모델 로딩 중... (4bit Quantization)")
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name=MODEL_NAME,
    max_seq_length=MAX_SEQ_LENGTH,
    dtype=None, 
    load_in_4bit=True,
)

model = FastLanguageModel.get_peft_model(
    model,
    r=LORA_RANK,
    lora_alpha=LORA_ALPHA,       # ★ 수정: 16으로 낮춰 베이스 모델의 지능 존중
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"],
    lora_dropout=0,
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state=3407,
    use_rslora=False,
    loftq_config=None,
)

# =========================================================
# 📝 4. 데이터 포맷팅
# =========================================================
tokenizer = get_chat_template(tokenizer, chat_template="llama-3")

def formatting_prompts_func(examples):
    instructions = examples["instruction"]
    outputs = examples["output"]
    curator_names = examples["curator_name"]
    
    texts = []
    for name, instruction, output in zip(curator_names, instructions, outputs):
        system_content = CURATOR_SYSTEM_PROMPTS.get(name, f"당신은 영화 큐레이터 '{name}'입니다.")
        messages = [
            {"role": "system", "content": system_content},
            {"role": "user", "content": instruction},
            {"role": "assistant", "content": output},
        ]
        text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=False)
        texts.append(text)
    return {"text": texts}

# =========================================================
# 📊 5. 데이터셋 로드
# =========================================================
print(f"📂 데이터셋 로드 중: {DATA_FILE}")
dataset = load_dataset("json", data_files=DATA_FILE, split="train")
dataset = dataset.train_test_split(test_size=0.05)
print(f"📊 학습: {len(dataset['train'])} / 검증: {len(dataset['test'])}")
dataset = dataset.map(formatting_prompts_func, batched=True)

# =========================================================
# 🚀 6. 학습 시작 (융통성 + 안정성)
# =========================================================
trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset["train"],
    eval_dataset=dataset["test"],
    dataset_text_field="text",
    max_seq_length=MAX_SEQ_LENGTH,
    dataset_num_proc=2,
    packing=False,
    
    args=TrainingArguments(
        per_device_train_batch_size=BATCH_SIZE,
        gradient_accumulation_steps=GRAD_ACCUMULATION,
        warmup_steps=5,
        num_train_epochs=NUM_EPOCHS,
        learning_rate=LEARNING_RATE,
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=1,
        optim="adamw_8bit",
        weight_decay=WEIGHT_DECAY,
        lr_scheduler_type="linear",
        seed=3407,
        output_dir=OUTPUT_DIR,
        eval_strategy="steps",
        eval_steps=50,
        save_strategy="steps", 
        save_steps=50,         
        report_to="wandb",
        run_name=f"curator-final-v6-flexible",
        
        # ★ 핵심 추가: NEFTune 활성화 (융통성, 일반화 성능 향상)
        neftune_noise_alpha=NEFTUNE_ALPHA, 
    ),
)

# --- 안전 종료(Ctrl+C) 핸들러 ---
def safe_save_and_exit(signum, frame):
    """Ctrl+C가 눌렸을 때 호출되는 함수"""
    print("\n\n🛑 [Interrupt] 학습 중단 신호 감지! 현재 상태를 저장합니다...")
    try:
        trainer.save_model(OUTPUT_DIR)
        tokenizer.save_pretrained(OUTPUT_DIR)
        print(f"✅ 모델이 안전하게 저장되었습니다: {OUTPUT_DIR}")
        wandb.finish() 
    except Exception as e:
        print(f"❌ 저장 실패: {e}")
    sys.exit(0)

signal.signal(signal.SIGINT, safe_save_and_exit)

print("\n🔥 [융통성 강화] 학습을 시작합니다! (WandB 로그 확인 가능)")
print(f"💡 LoRA Alpha: {LORA_ALPHA}, NEFTune Alpha: {NEFTUNE_ALPHA} 적용")
print("💡 학습을 강제로 멈추려면 Ctrl+C를 한 번만 누르세요. 자동 저장됩니다.")

try:
    trainer_stats = trainer.train()
    
    print(f"\n💾 학습 완료! 모델 저장 중... ({OUTPUT_DIR})")
    model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    wandb.finish()
    print("\n✅ 모든 작업이 성공적으로 완료되었습니다! 🎉")

except Exception as e:
    print(f"\n❌ 학습 중 에러 발생: {e}")
    trainer.save_model(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    print("⚠️ 에러 발생 직전 상태로 모델을 비상 저장했습니다.")