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
            config_path = os.path.normpath(config_path)
            
            logger.info(f"Initializing Guardrails from path: {config_path}")
            
            if not os.path.exists(config_path):
                 logger.error(f"Guardrails directory NOT found at {config_path}")
                 return

            config_file = os.path.join(config_path, "config.yml")
            # topics_file is verified implicitly by from_path but good to log

            if os.path.exists(config_file):
                logger.info(f"Found config.yml at {config_file}")
            else:
                logger.error(f"Missing config.yml at {config_file}")
                return

            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                logger.warning("OPENAI_API_KEY is not set. Guardrails might fail.")
            else:
                masked_key = api_key[:5] + "..." + api_key[-4:]
                logger.info(f"OPENAI_API_KEY found: {masked_key}")

            # 로딩 시도
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

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.error("Create FAIL: OPENAI_API_KEY is missing!")
        else:
            logger.info(f"Guardrails checking input... Key exists (len={len(api_key)})")

        try:
            # generate 호출 시 messages 포맷 사용
            messages = [{"role": "user", "content": prompt}]
            
            logger.info(f"Invoking rails with prompt: {prompt}")
            
            # NeMo Guardrails 실행
            response = await self._rails.generate_async(messages=messages)
            
            logger.info(f"Rails raw response: {response}")
            
            # 응답 분석
            if response and "영화 추천과 관련된 질문에만 답변할 수 있습니다" in response.get("content", ""):
                 logger.info("🚫 Blocked by Guardrails!")
                 return False, response["content"]
            
            logger.info("✅ Passed Guardrails")
            return True, None

        except Exception as e:
            logger.error(f"Guardrails check failed: {e}")
            # 가드레일 에러 시 비즈니스 로직 방해하지 않도록 통과 처리 (Fail-open)
            return True, None

guardrails_manager = GuardrailsManager()
