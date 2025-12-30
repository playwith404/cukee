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
    """11개 테마의 LoRA 어댑터를 관리하는 클래스"""
    
    # 11개 테마 목록
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
    
    def __init__(self):
        self.base_model = None
        self.tokenizer = None
        self.lora_adapters: Dict[str, PeftModel] = {}
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {self.device}")
        
    def load_base_model(self):
        """베이스 모델을 양자화하여 로드 (HuggingFace에서)"""
        try:
            logger.info(f"Loading base model from HuggingFace: {settings.BASE_MODEL}")
            
            # 4-bit 양자화 설정
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
            
            # 베이스 모델 로드 (양자화)
            self.base_model = AutoModelForCausalLM.from_pretrained(
                settings.BASE_MODEL,
                quantization_config=bnb_config,
                device_map="auto",
                trust_remote_code=True,
                torch_dtype=torch.bfloat16
            )
            
            logger.info("Base model loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load base model: {e}")
            raise
    
    def load_lora_adapters(self):
        """11개 테마의 LoRA 어댑터를 모두 로드"""
        try:
            logger.info(f"Loading LoRA adapters from: {settings.MODEL_PATH}")
            
            loaded_count = 0
            for theme in self.THEMES:
                adapter_path = os.path.join(settings.MODEL_PATH, theme)
                
                if not os.path.exists(adapter_path):
                    logger.warning(f"Adapter not found: {adapter_path}")
                    continue
                
                try:
                    # LoRA 어댑터 로드
                    logger.info(f"Loading adapter for theme: {theme}")
                    model_with_adapter = PeftModel.from_pretrained(
                        self.base_model,
                        adapter_path,
                        is_trainable=False
                    )
                    
                    # 추론 모드로 설정
                    model_with_adapter.eval()
                    
                    # 어댑터 저장
                    self.lora_adapters[theme] = model_with_adapter
                    loaded_count += 1
                    logger.info(f"✓ Successfully loaded: {theme}")
                    
                except Exception as e:
                    logger.error(f"Failed to load adapter for '{theme}': {e}")
                    continue
            
            logger.info(f"Loaded {loaded_count}/{len(self.THEMES)} LoRA adapters")
            
            if loaded_count == 0:
                raise RuntimeError("No LoRA adapters loaded")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to load LoRA adapters: {e}")
            raise
    
    def initialize(self):
        """모델 초기화 - 베이스 모델과 모든 LoRA 어댑터 로드"""
        logger.info("Initializing Model Manager...")
        
        # 1. 베이스 모델 로드
        self.load_base_model()
        
        # 2. LoRA 어댑터들 로드
        self.load_lora_adapters()
        
        logger.info("Model Manager initialized successfully")
        logger.info(f"Available themes: {list(self.lora_adapters.keys())}")
    
    def generate(
        self,
        prompt: str,
        theme: str,
        max_length: Optional[int] = None,
        max_new_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None
    ) -> str:
        """
        특정 테마의 LoRA 어댑터를 사용하여 텍스트 생성
        
        Args:
            prompt: 입력 프롬프트
            theme: 사용할 테마
            max_length: 최대 생성 길이
            temperature: Temperature 값
            top_p: Top-p 샘플링 값
            top_k: Top-k 샘플링 값
            
        Returns:
            생성된 텍스트
        """
        if theme not in self.lora_adapters:
            raise ValueError(f"Theme '{theme}' not found. Available themes: {list(self.lora_adapters.keys())}")
        
        # 기본값 설정
        max_length = max_length or settings.MAX_LENGTH
        temperature = temperature if temperature is not None else settings.TEMPERATURE
        top_p = top_p if top_p is not None else settings.TOP_P
        top_k = top_k if top_k is not None else settings.TOP_K
        
        try:
            # 해당 테마의 모델 선택
            model = self.lora_adapters[theme]
            
            # 입력 토큰화
            inputs = self.tokenizer(
                prompt,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=max_length
            ).to(self.device)
            
            # 생성 파라미터 설정
            gen_kwargs = {
                "temperature": temperature,
                "top_p": top_p,
                "top_k": top_k,
                "do_sample": True,
                "pad_token_id": self.tokenizer.pad_token_id,
                "eos_token_id": self.tokenizer.eos_token_id,
            }
            
            # max_new_tokens 우선, 없으면 max_length 사용
            if max_new_tokens is not None:
                gen_kwargs["max_new_tokens"] = max_new_tokens
            else:
                gen_kwargs["max_length"] = max_length
            
            # 텍스트 생성
            with torch.no_grad():
                outputs = model.generate(**inputs, **gen_kwargs)
            
            # 디코딩
            generated_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # 프롬프트 제거하고 생성된 부분만 반환
            if generated_text.startswith(prompt):
                generated_text = generated_text[len(prompt):].strip()
            
            return generated_text
            
        except Exception as e:
            logger.error(f"Generation failed for theme '{theme}': {e}")
            raise
    
    def get_loaded_themes(self) -> list:
        """로드된 테마 목록 반환"""
        return list(self.lora_adapters.keys())
    
    def is_ready(self) -> bool:
        """모델이 준비되었는지 확인"""
        return (
            self.base_model is not None 
            and self.tokenizer is not None 
            and len(self.lora_adapters) > 0
        )


# 전역 모델 매니저 인스턴스
model_manager = ModelManager()
