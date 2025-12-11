import os
import torch
import json
from unsloth import FastLanguageModel
from trl import SFTTrainer
from transformers import TrainingArguments, TrainerCallback
from datasets import Dataset

# ==========================================
# ⚙️ 1. 설정 (환경 및 파라미터)
# ==========================================

# W&B 설정
os.environ["WANDB_API_KEY"] = ""
os.environ["WANDB_ENTITY"] = ""
os.environ["WANDB_PROJECT"] = ""

# 셔플된 데이터셋 경로
DATASET_FILE = "dataset/curator_dataset_shuffled.jsonl" 

# 모델 저장 폴더 이름 (v2)
MODEL_OUTPUT_DIR = "llama3_8b_curator_final_v2"

# 모델 설정
BASE_MODEL = "unsloth/llama-3-8b-Instruct-bnb-4bit"
MAX_SEQ_LENGTH = 2048
DTYPE = None
LOAD_IN_4BIT = True

# ★★★ [추가] 조기 종료를 위한 콜백 클래스 정의 ★★★
class LossStoppingCallback(TrainerCallback):
    def on_log(self, args, state, control, logs=None, **kwargs):
        # logs 딕셔너리에 'loss' 키가 있는지 확인
        if logs is not None and "loss" in logs:
            current_loss = logs["loss"]
            
            # 목표 Loss (0.9) 미만인지 체크
            if current_loss < 0.9:
                print(f"\n\n🎯 [목표 달성] 현재 Loss가 {current_loss:.4f}로 0.9 미만입니다.")
                print("🛑 과적합 방지를 위해 학습을 자동으로 조기 종료합니다.")
                
                # 학습 중단 신호
                control.should_training_stop = True

# ==========================================
# 2. 모델 및 토크나이저 로드
# ==========================================
print(f"🧠 모델 로드 중... ({BASE_MODEL})")

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = BASE_MODEL,
    max_seq_length = MAX_SEQ_LENGTH,
    dtype = DTYPE,
    load_in_4bit = LOAD_IN_4BIT,
    token = os.getenv("HF_TOKEN")
)

model = FastLanguageModel.get_peft_model(
    model,
    r = 16,
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                      "gate_proj", "up_proj", "down_proj",],
    lora_alpha = 16,
    lora_dropout = 0,
    bias = "none",
    use_gradient_checkpointing = "unsloth",
    random_state = 3407,
    use_rslora = False,
    loftq_config = None,
)

# ==========================================
# 3. 데이터셋 로드 및 포맷팅
# ==========================================
print(f"📂 데이터셋 로드 및 포맷팅: {DATASET_FILE}")

data_list = []
if not os.path.exists(DATASET_FILE):
    raise FileNotFoundError(f"❌ 오류: 데이터셋 파일이 없습니다 -> {DATASET_FILE}")

with open(DATASET_FILE, "r", encoding="utf-8") as f:
    for line in f:
        if line.strip():
            data_list.append(json.loads(line))

print(f"📊 총 학습 데이터 개수: {len(data_list)}개")
dataset = Dataset.from_list(data_list)

def formatting_prompts_func(examples):
    instructions = examples["instruction"]
    inputs       = examples["input"]
    outputs      = examples["output"]
    texts = []
    EOS_TOKEN = tokenizer.eos_token 
    
    for instruction, input_text, output_text in zip(instructions, inputs, outputs):
        text = (
            f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n"
            f"{instruction}<|eot_id|>"
            f"<|start_header_id|>user<|end_header_id|>\n\n"
            f"{input_text}<|eot_id|>"
            f"<|start_header_id|>assistant<|end_header_id|>\n\n"
            f"{output_text}{EOS_TOKEN}"
        )
        texts.append(text)
    return { "text" : texts }

dataset = dataset.map(formatting_prompts_func, batched = True)

# ==========================================
# ⚙️ 4. 학습 시작 (Trainer 설정)
# ==========================================
print("🚀 학습 준비 완료! 시작합니다...")

trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = dataset,
    dataset_text_field = "text",
    max_seq_length = MAX_SEQ_LENGTH,
    dataset_num_workers = 2,
    packing = False,
    
    # ★★★ [추가] 콜백 등록 ★★★
    callbacks=[LossStoppingCallback()],
    
    args = TrainingArguments(
        # T4 메모리 최적화 설정
        per_device_train_batch_size = 2,    
        gradient_accumulation_steps = 4,    
        
        warmup_steps = 10,
        output_dir = "outputs_v2", 
        
        save_strategy = "steps",
        save_steps = 500,        
        
        max_steps = -1,
        num_train_epochs = 1,
        
        learning_rate = 2e-4,    
        
        fp16 = not torch.cuda.is_bf16_supported(),
        bf16 = torch.cuda.is_bf16_supported(),
        logging_steps = 10,
        optim = "adamw_8bit",
        weight_decay = 0.01,
        lr_scheduler_type = "linear",
        seed = 3407,
        report_to = "wandb",
    ),
)

# Ctrl+C 감지 및 모델 저장 로직
try:
    trainer.train()
    
except KeyboardInterrupt:
    print("\n\n-----------------------------------------------------------")
    print("⚠️ 학습 중단 요청 감지 (Ctrl+C). 현재까지의 모델을 저장합니다.")
    print("-----------------------------------------------------------")
    
    INTERRUPTED_OUTPUT_DIR = MODEL_OUTPUT_DIR + "_INTERRUPTED"
    trainer.save_model(INTERRUPTED_OUTPUT_DIR)
    tokenizer.save_pretrained(INTERRUPTED_OUTPUT_DIR)
    
    print(f"💾 중단 모델 저장 완료: '{INTERRUPTED_OUTPUT_DIR}' 폴더 확인.")
    exit()

# ==========================================
# ⚙️ 5. 모델 저장 (정상 완료 or 조기 종료 시)
# ==========================================
# 콜백에 의해 조기 종료되어도 여기로 내려와서 정상 저장됩니다.
print(f"💾 학습 종료! 모델을 '{MODEL_OUTPUT_DIR}'에 저장합니다.")

model.save_pretrained(MODEL_OUTPUT_DIR)
tokenizer.save_pretrained(MODEL_OUTPUT_DIR)

print(f"🎉 모든 작업이 성공적으로 끝났습니다! 저장 경로: {MODEL_OUTPUT_DIR}")