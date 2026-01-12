"""
AI Model Loader - 11개 테마의 LoRA 어댑터를 로드
"""
import os
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import PeftModel
import logging
from typing import Dict, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class ModelManager:
    """Qwen-14B 단일 모델 관리 클래스 (시스템 프롬프팅 전용)"""
    
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {self.device}")
        
    def initialize(self):
        """모델 및 토크나이저 로드"""
        try:
            logger.info(f"Loading model: {settings.BASE_MODEL}")
            
            # 4-bit 양자화 설정 (메모리 절약)
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=torch.bfloat16
            )
            
            # 토크나이저 로드
            self.tokenizer = AutoTokenizer.from_pretrained(
                settings.BASE_MODEL,
                trust_remote_code=True
            )
            
            # 패딩 토큰 설정
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            # 모델 로드
            self.model = AutoModelForCausalLM.from_pretrained(
                settings.BASE_MODEL,
                quantization_config=bnb_config,
                device_map="auto",
                trust_remote_code=True,
                torch_dtype=torch.bfloat16
            )
            
            logger.info("✓ Model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise
    
    def generate(
        self,
        prompt: str,
        theme: str = None, # 하위 호환성을 위해 남겨둠 (실제로는 프롬프트에 녹임)
        max_length: Optional[int] = None,
        max_new_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None
    ) -> str:
        """텍스트 생성"""
        if self.model is None:
            raise RuntimeError("Model is not initialized")
            
        # 기본값 설정
        max_length = max_length or settings.MAX_LENGTH
        temperature = temperature if temperature is not None else settings.TEMPERATURE
        top_p = top_p if top_p is not None else settings.TOP_P
        top_k = top_k if top_k is not None else settings.TOP_K
        
        try:
            # Chat 템플릿 적용 (Qwen 등 최신 모델은 apply_chat_template 권장)
            # 입력된 prompt가 이미 시스템 프롬프트를 포함한 전체 텍스트라고 가정하지 않고,
            # 역할별 메시지 구조로 변환하는 것이 이상적이나, 
            # 현재는 기존 호출부에서 prompt를 완성해서 넘겨주고 있으므로 raw text 생성을 유지하되
            # 필요한 경우 여기서 템플릿 처리를 추가할 수 있음.
            # Qwen은 ChatML 형식을 선호하므로, 토크나이저의 템플릿 기능을 활용하면 좋음.
            
            # 토크나이징
            inputs = self.tokenizer(
                prompt,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=max_length
            ).to(self.device)
            
            # 생성 파라미터
            gen_kwargs = {
                "temperature": temperature,
                "top_p": top_p,
                "top_k": top_k,
                "do_sample": True,
                "pad_token_id": self.tokenizer.pad_token_id,
                "eos_token_id": self.tokenizer.eos_token_id,
                "repetition_penalty": 1.1, # 반복 방지 추가
            }
            
            if max_new_tokens is not None:
                gen_kwargs["max_new_tokens"] = max_new_tokens
            else:
                gen_kwargs["max_length"] = max_length
            
            # 생성
            with torch.no_grad():
                outputs = self.model.generate(**inputs, **gen_kwargs)
            
            # 디코딩
            generated_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # 프롬프트 부분 제거 (간단한 처리)
            # Chat 템플릿을 쓰면 이 부분이 더 깔끔해지지만, raw prompt를 쓰는 경우 수동 제거 필요
            if generated_text.startswith(prompt):
                generated_text = generated_text[len(prompt):].strip()
            
            # Qwen 특성상 <|im_start|>, <|im_end|> 등의 태그가 남을 수 있으므로 정리
            generated_text = generated_text.replace("<|im_start|>", "").replace("<|im_end|>", "").strip()
            
            return generated_text
            
        except Exception as e:
            logger.error(f"Generation failed: {e}")
            raise
    
    def get_loaded_themes(self) -> list:
        """하위 호환성: 모든 테마 지원 가능"""
        return ModelManager.THEMES
    
    def is_ready(self) -> bool:
        return self.model is not None

    # 테마 목록 유지 (유효성 검사용)
    THEMES = [
        "3D 보단 2D ",
        "뇌 빼고도 볼 수 있는 레전드 코미디 ",
        "설레고 싶은 날의 로맨스 ",
        "세계관 과몰입 판타지러버",
        "숏폼 러버 MZ 스타일",
        "심장 터질 것 같은 액션 범죄 영화",
        "여름에 찰떡인 역대급 호러 ",
        "영화덕후의 최애 마이너영화",
        "이거 실화야? 실화야. ",
        "찝찝한 여운의 우울한 명작들",
        "편안하고 잔잔한 감성 추구"
    ]

model_manager = ModelManager()
