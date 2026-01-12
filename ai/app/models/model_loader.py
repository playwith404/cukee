"""
AI Model Loader - vLLM Backend (High Performance)
"""
import os
import logging
from typing import Dict, Optional, List, Union
from app.core.config import settings

# vLLM 임포트 (Linux/WSL 환경 필수)
try:
    from vllm import LLM, SamplingParams
except ImportError:
    # 윈도우 로컬 개발 시 에러 방지용 더미 (실제 실행 시엔 에러남)
    LLM = None
    SamplingParams = None

logger = logging.getLogger(__name__)

class ModelManager:
    """Qwen-14B vLLM 관리 클래스 (고성능 추론)"""
    
    def __init__(self):
        self.llm = None
        self.tokenizer = None
        
    def initialize(self):
        """vLLM 엔진 초기화"""
        try:
            logger.info(f"Loading model with vLLM: {settings.BASE_MODEL}")
            
            if LLM is None:
                raise ImportError("vLLM module not found. Please install vllm (Linux only).")

            # vLLM 엔진 로드
            # gpu_memory_utilization=0.90: VRAM 90%까지만 사용 (OOM 방지 안전장치)
            # quantization="bitsandbytes": 4bit 양자화 모델 로드 (메모리 절약)
            self.llm = LLM(
                model=settings.BASE_MODEL,
                dtype="float16",
                gpu_memory_utilization=0.90, 
                trust_remote_code=True,
                quantization="bitsandbytes", # Qwen 14B 원본 모델일 경우 4bit 로드 필요
                load_format="bitsandbytes",
                enforce_eager=True # 메모리 절약을 위해 Eager 모드 권장 (선택사항)
            )
            
            # 토크나이저는 vLLM 내부에서 가져옴
            self.tokenizer = self.llm.get_tokenizer()
            
            logger.info("✓ vLLM engine loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load vLLM: {e}")
            raise
    
    def generate(
        self,
        prompt: Union[str, List[Dict]], 
        theme: str = None, 
        max_length: Optional[int] = None,
        max_new_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None
    ) -> str:
        """vLLM 기반 고속 텍스트 생성"""
        if self.llm is None:
            raise RuntimeError("vLLM Model is not initialized")
            
        # 기본값 설정
        max_new_tokens = max_new_tokens or 512
        temperature = temperature if temperature is not None else settings.TEMPERATURE
        top_p = top_p if top_p is not None else settings.TOP_P
        top_k = top_k if top_k is not None else settings.TOP_K
        
        try:
            # 1. Chat Template 적용 (Token ID로 변환)
            if isinstance(prompt, str):
                messages = [{"role": "user", "content": prompt}]
            else:
                messages = prompt
                
            prompt_token_ids = self.tokenizer.apply_chat_template(
                messages, 
                tokenize=True, 
                add_generation_prompt=True
            )
            
            # 2. Sampling Params 설정
            sampling_params = SamplingParams(
                temperature=temperature,
                top_p=top_p,
                top_k=top_k,
                max_tokens=max_new_tokens,
                stop=["<|im_end|>", "<|endoftext|>"], # Qwen 종료 토큰 명시
                repetition_penalty=1.1
            )
            
            # 3. 비동기 생성 (vLLM은 기본적으로 배치 처리에 강하지만 여기선 단일 요청 처리)
            # vLLM의 LLM 클래스는 동기 함수처럼 호출 가능
            outputs = self.llm.generate(
                prompt_token_ids=[prompt_token_ids],
                sampling_params=sampling_params,
                use_tqdm=False
            )
            
            # 4. 결과 추출
            generated_text = outputs[0].outputs[0].text
            
            # 5. 후처리 (<think> 제거 등)
            import re
            generated_text = re.sub(r'<think>.*?</think>', '', generated_text, flags=re.DOTALL)
            
            # 잔여 태그 정리
            if "<think>" in generated_text:
                 generated_text = generated_text.split("<think>")[0]
            if "</think>" in generated_text:
                generated_text = generated_text.split("</think>")[-1]
            
            return generated_text.strip()
            
        except Exception as e:
            logger.error(f"vLLM Generation failed: {e}")
            raise
    
    def get_loaded_themes(self) -> list:
        return ModelManager.THEMES
    
    def is_ready(self) -> bool:
        return self.llm is not None

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
