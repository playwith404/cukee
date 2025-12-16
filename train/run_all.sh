import os
import argparse
import torch
import gc
from unsloth import FastLanguageModel
from trl import SFTTrainer
from transformers import TrainingArguments
from datasets import load_dataset
import wandb

# ==========================================
# 0. 인자 받기 (Shell Script에서 넘겨줌)
# ==========================================
parser = argparse.ArgumentParser()
parser.add_argument("--curator_name", type=str, required=True, help="학습할 큐레이터 이름")
args = parser.parse_args()

CURATOR_NAME = args.curator_name

# ==========================================
# 1. 하이퍼파라미터 (RAM 7.5GB / T4 최적화)
# ==========================================
MODEL_ID = "sh2orc/Llama-3.1-Korean-8B-Instruct"
DATA_DIR = "./training_datasets"   # 셔플된 데이터 폴더 권장
OUTPUT_DIR = "./lora_adapters"

MAX_SEQ_LENGTH = 1024
LOAD_IN_4BIT = True
LORA_R = 64
LORA_ALPHA = 128
LORA_DROPOUT = 0  # Unsloth 최적화

# 실전용 학습 설정
EPOCHS = 2             # 스타일 확실히 입히기 위해 2바퀴
LEARNING_RATE = 2e-4
BATCH_SIZE = 2
GRAD_ACCUM = 8
WARMUP_STEPS = 10

# ==========================================
# 2. 모델 및 토크나이저 로드
# ==========================================
print(f"\n🚀 [{CURATOR_NAME}] 학습 프로세스 시작...")

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = MODEL_ID,
    max_seq_length = MAX_SEQ_LENGTH,
    dtype = None,
    load_in_4bit = LOAD_IN_4BIT,
)

model = FastLanguageModel.get_peft_model(
    model,
    r = LORA_R,
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                      "gate_proj", "up_proj", "down_proj"],
    lora_alpha = LORA_ALPHA,
    lora_dropout = LORA_DROPOUT,
    bias = "none",
    use_gradient_checkpointing = "unsloth",
    random_state = 3407,
)

# ==========================================
# 3. 데이터셋 로드 및 전처리 (Train/Eval 분리)
# ==========================================
data_file = os.path.join(DATA_DIR, f"{CURATOR_NAME}.jsonl")
if not os.path.exists(data_file):
    raise FileNotFoundError(f"파일이 없습니다: {data_file}")

# 데이터 로드
dataset = load_dataset("json", data_files=data_file, split="train")

# 셔플 및 Train(95%) / Test(5%) 분리
dataset = dataset.shuffle(seed=3407)
dataset_split = dataset.train_test_split(test_size=0.05)
train_dataset = dataset_split["train"]
eval_dataset = dataset_split["test"]

print(f"👉 학습 데이터: {len(train_dataset)}개 / 검증 데이터: {len(eval_dataset)}개")

# 포맷팅 함수
from unsloth.chat_templates import get_chat_template
tokenizer = get_chat_template(
    tokenizer,
    chat_template = "llama-3",
    mapping = {"role": "from", "content": "value", "user": "human", "assistant": "gpt"},
)

def formatting_prompts_func(examples):
    convos = examples["messages"]
    texts = [tokenizer.apply_chat_template(convo, tokenize=False, add_generation_prompt=False) for convo in convos]
    return { "text": texts }

print("🛠️ 데이터셋 포맷팅 변환 중...")
train_dataset = train_dataset.map(formatting_prompts_func, batched=True)
eval_dataset = eval_dataset.map(formatting_prompts_func, batched=True)

# ==========================================
# 4. WandB 및 Trainer 설정 (Best Model 저장)
# ==========================================
# WandB 프로젝트 설정
wandb.init(project="Movie-Curator-Production", name=f"Run-{CURATOR_NAME}", reinit=True)

trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = train_dataset,
    eval_dataset = eval_dataset,      # 검증 데이터 추가
    dataset_text_field = "text",
    max_seq_length = MAX_SEQ_LENGTH,
    dataset_num_proc = 2,
    packing = False,
    args = TrainingArguments(
        per_device_train_batch_size = BATCH_SIZE,
        gradient_accumulation_steps = GRAD_ACCUM,
        warmup_steps = WARMUP_STEPS,
        num_train_epochs = EPOCHS,    # 2 Epoch
        learning_rate = LEARNING_RATE,
        fp16 = True,
        bf16 = False,
        logging_steps = 1,
        optim = "adamw_8bit",
        weight_decay = 0.01,
        lr_scheduler_type = "linear",
        seed = 3407,
        output_dir = os.path.join("checkpoints", CURATOR_NAME), # 중간 체크포인트 저장소
        
        # [핵심] 평가 및 Best Model 저장 설정
        eval_strategy = "steps",      # 스텝마다 평가
        eval_steps = 20,              # 20스텝마다 시험 봄 (Loss 확인)
        save_strategy = "steps",
        save_steps = 20,              # 20스텝마다 저장 시도
        load_best_model_at_end = True, # 학습 끝나면 가장 좋았던 모델 다시 로드
        metric_for_best_model = "eval_loss", # 평가 손실이 가장 낮은 걸 선택
        greater_is_better = False,    # Loss는 낮을수록 좋음
        report_to = "wandb",
    ),
)

# ==========================================
# 5. 학습 실행 및 최종 저장
# ==========================================
trainer.train()

# Best Model 저장
final_save_path = os.path.join(OUTPUT_DIR, CURATOR_NAME)
print(f"💾 최종 Best Model 저장 중: {final_save_path}")
model.save_pretrained(final_save_path)
tokenizer.save_pretrained(final_save_path)

print(f"✅ [{CURATOR_NAME}] 학습 완료!")

# 메모리 정리
wandb.finish()
del model
del trainer
gc.collect()
torch.cuda.empty_cache()