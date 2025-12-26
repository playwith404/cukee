"""
설정 관리
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """AI 서버 설정"""
    
    # AI Model Settings
    BASE_MODEL: str = "unsloth/Meta-Llama-3.1-8B-Instruct-bnb-4bit"
    MODEL_PATH: str = "/app/model/Llama-3.1-8B-Instruct"
    MAX_LENGTH: int = 2048
    TEMPERATURE: float = 0.7
    TOP_P: float = 0.9
    TOP_K: int = 50
    
    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 5000
    WORKERS: int = 1
    LOG_LEVEL: str = "info"
    
    # VM1 Backend URL
    VM1_BACKEND_URL: str = "http://10.0.0.143:8000"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
