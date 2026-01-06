import os
import logging
from dotenv import load_dotenv
from nemoguardrails import LLMRails, RailsConfig

load_dotenv()

logger = logging.getLogger(__name__)

class GuardrailsManager:
    _instance = None
    _rails = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GuardrailsManager, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        """Guardrails 초기화"""
        try:
            # 설정 파일 경로 계산
            current_dir = os.path.dirname(os.path.abspath(__file__))
            # app/core -> app/guardrails
            config_path = os.path.join(current_dir, "..", "guardrails")
            
            if not os.path.exists(os.path.join(config_path, "config.yml")):
                logger.error(f"Guardrails config not found at {config_path}")
                return

            if not os.getenv("OPENAI_API_KEY"):
                logger.warning("OPENAI_API_KEY is not set. Guardrails might fail.")

            config = RailsConfig.from_path(config_path)
            self._rails = LLMRails(config)
            logger.info("NeMo Guardrails initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Guardrails: {e}", exc_info=True)
            self._rails = None

    async def check_input(self, prompt: str):
        """
        입력이 주제에 맞는지 검사
        Returns:
            (bool, str): (통과여부, 응답메시지)
            통과 시: (True, None)
            차단 시: (False, 거절메시지)
        """
        if not self._rails:
            logging.warning("Guardrails not initialized, skipping check")
            return True, None

        try:
            # generate 호출 시 messages 포맷 사용
            messages = [{"role": "user", "content": prompt}]
            
            # NeMo Guardrails 실행
            response = await self._rails.generate_async(messages=messages)
            
            # 응답 분석
            # 차단된 경우 bot refuse by topic에 정의된 메시지가 반환됨
            if response and "영화 추천과 관련된 질문에만 답변할 수 있습니다" in response.get("content", ""):
                 return False, response["content"]
            
            return True, None

        except Exception as e:
            logger.error(f"Guardrails check failed: {e}")
            # 가드레일 에러 시 비즈니스 로직 방해하지 않도록 통과 처리 (Fail-open)
            return True, None

guardrails_manager = GuardrailsManager()
