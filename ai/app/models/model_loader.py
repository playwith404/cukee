AI Model Loader - Single Model (Qwen) with System Prompting
"""
import os
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

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
                bnb_4bit_compute_dtype=torch.float16
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
                dtype=torch.float16
            )
            
            logger.info("✓ Model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise
    
    def generate(
        self,
        prompt: str | list, # str 또는 list[dict] 지원
        theme: str = None, 
        max_length: Optional[int] = None,
        max_new_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None
    ) -> str:
        """텍스트 생성 (Chat Template 적용)"""
        if self.model is None:
            raise RuntimeError("Model is not initialized")
            
        # 기본값 설정
        max_length = max_length or settings.MAX_LENGTH
        temperature = temperature if temperature is not None else settings.TEMPERATURE
        top_p = top_p if top_p is not None else settings.TOP_P
        top_k = top_k if top_k is not None else settings.TOP_K
        
        try:
            # 1. ChatML 템플릿 적용
            if isinstance(prompt, str):
                # 구형 호환: 문자열로 들어오면 유저 메시지로 포장
                messages = [{"role": "user", "content": prompt}]
            else:
                messages = prompt
                
            # 토크나이징 (apply_chat_template 사용)
            # add_generation_prompt=True ensures model generates 'assistant' response
            model_inputs = self.tokenizer.apply_chat_template(
                messages, 
                tokenize=True, 
                add_generation_prompt=True, 
                return_tensors="pt",
                return_dict=True
            ).to(self.device)
            
            # 2. 생성 파라미터 구성
            gen_kwargs = {
                "max_new_tokens": max_new_tokens if max_new_tokens else 512,
                "temperature": temperature,
                "top_p": top_p,
                "top_k": top_k,
                "do_sample": True,
                "pad_token_id": self.tokenizer.pad_token_id,
                "eos_token_id": self.tokenizer.eos_token_id,
                "repetition_penalty": 1.1,
            }
            
            # 3. 생성
            with torch.no_grad():
                outputs = self.model.generate(
                    model_inputs.input_ids,
                    attention_mask=model_inputs.attention_mask,
                    **gen_kwargs
                )
            
            # 4. 디코딩 (입력 토큰 이후부터 디코딩)
            # outputs[0] contains [input_ids + generated_ids]
            new_tokens = outputs[0][model_inputs.input_ids.shape[1]:]
            generated_text = self.tokenizer.decode(new_tokens, skip_special_tokens=True)
            
            # 5. Qwen 특화 후처리 (<think> 등 제거)
            generated_text = generated_text.replace("<|im_start|>", "").replace("<|im_end|>", "")
            
            # 강력한 <think> 태그 제거 (정규식)
            import re
            # <think> 내용 </think> 제거
            generated_text = re.sub(r'<think>.*?</think>', '', generated_text, flags=re.DOTALL)
            # 닫히지 않은 <think>가 있을 경우 (끝까지 제거)
            if "<think>" in generated_text:
                 generated_text = generated_text.split("<think>")[0]
            # 닫는 태그만 남은 경우 (앞부분이 잘린 경우)
            if "</think>" in generated_text:
                generated_text = generated_text.split("</think>")[-1]
            
            return generated_text.strip()
            
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
