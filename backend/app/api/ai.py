"""
AI 관련 API 엔드포인트 - VM2 AI 서버 연동
"""
import httpx
import logging
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session as DBSession

from app.core.database import get_db
from app.core.exceptions import BadRequestException, InternalServerErrorException
from app.schemas.ai import AIGenerateRequest, AIGenerateResponse
from app.utils.dependencies import get_current_user
from app.models import User
from app.models.ticket import TicketGroup

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai", tags=["AI"])

# VM2 AI 서버 설정
AI_SERVER_URL = "http://10.0.19.117:5000"

# ticketId -> AI 서버 테마 매핑
TICKET_TO_THEME = {
    1: "숏폼 러버 MZ 스타일",
    2: "영화덕후의 최애 마이너영화",
    3: "편안하고 잔잔한 감성 추구",
    4: "찝찝한 여운의 우울한 명작들",
    5: "뇌 빼고도 볼 수 있는 레전드 코미디 ",
    6: "심장 터질 것 같은 액션 범죄 영화",
    7: "세계관 과몰입 판타지러버",
    8: "이거 실화야? 실화야. ",
    9: "여름에 찰떡인 역대급 호러 ",
    10: "설레고 싶은 날의 로맨스 ",
    11: "3D 보단 2D ",
}


@router.post("/generate", response_model=AIGenerateResponse, status_code=status.HTTP_200_OK)
async def generate_exhibition(
    request_data: AIGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    """
    AI 전시회 생성
    - HttpOnly Cookie 필요
    - VM2 AI 서버와 연동하여 영화 추천 생성
    """
    if not request_data.prompt:
        raise BadRequestException(
            message="프롬프트를 입력해주세요.",
            details="프롬프트는 필수 항목입니다."
        )

    # ticketId로 테마 찾기
    theme = TICKET_TO_THEME.get(request_data.ticketId)
    if not theme:
        raise BadRequestException(
            message="유효하지 않은 티켓입니다.",
            details=f"ticketId {request_data.ticketId}에 해당하는 테마를 찾을 수 없습니다."
        )

    try:
        # VM2 AI 서버 호출
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{AI_SERVER_URL}/api/v1/generate",
                json={
                    "prompt": request_data.prompt,
                    "theme": theme,
                    "ticketId": request_data.ticketId,
                    "pinnedMovieIds": request_data.pinnedMovieIds,
                    "max_length": 2048,
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "top_k": 50
                }
            )

            if response.status_code != 200:
                logger.error(f"AI Server error: {response.status_code} - {response.text}")
                raise InternalServerErrorException(
                    message="AI 서버 오류가 발생했습니다.",
                    details=f"Status: {response.status_code}"
                )

            ai_response = response.json()
            logger.info(f"AI Server response received for theme: {theme}")

            return AIGenerateResponse(resultJson=ai_response.get("result_json", ai_response.get("resultJson", {})))

    except httpx.TimeoutException:
        logger.error("AI Server timeout")
        raise InternalServerErrorException(
            message="AI 서버 응답 시간이 초과되었습니다.",
            details="잠시 후 다시 시도해주세요."
        )
    except httpx.RequestError as e:
        logger.error(f"AI Server connection error: {e}")
        raise InternalServerErrorException(
            message="AI 서버에 연결할 수 없습니다.",
            details=str(e)
        )


@router.post("/curate-movies", status_code=status.HTTP_200_OK)
async def curate_movies(
    request_data: dict,
    db: DBSession = Depends(get_db)
):
    """
    티켓 ID로 영화 목록 조회 (빠른 조회)
    - ticket_group_movies 테이블에서 직접 조회
    - 인증 불필요
    """
    from sqlalchemy import text
    import random

    ticket_id = request_data.get("ticketId")
    limit = request_data.get("limit", 5)

    if not ticket_id:
        raise BadRequestException(
            message="ticketId가 필요합니다.",
            details="ticketId는 필수 항목입니다."
        )

    try:
        # ticket_group_movies와 movies 테이블 조인하여 영화 조회
        query = text("""
            SELECT m.id as movie_id, m.title_ko as title, m.poster_path as poster_url
            FROM ticket_group_movies tgm
            JOIN movies m ON tgm.movie_id = m.id
            WHERE tgm.ticket_group_id = :ticket_id
            ORDER BY RANDOM()
            LIMIT :limit
        """)
        
        result = db.execute(query, {"ticket_id": ticket_id, "limit": limit})
        movies = result.fetchall()

        movie_list = [
            {
                "movieId": row.movie_id,
                "title": row.title,
                "posterUrl": row.poster_url or ""
            }
            for row in movies
        ]

        logger.info(f"Curated {len(movie_list)} movies for ticket {ticket_id}")

        return {
            "ticketId": ticket_id,
            "movies": movie_list
        }

    except Exception as e:
        logger.error(f"영화 조회 오류: {e}")
        raise InternalServerErrorException(
            message="영화 조회 중 오류가 발생했습니다.",
            details=str(e)
        )


@router.post("/movie-detail", status_code=status.HTTP_200_OK)
async def get_movie_detail(request_data: dict):
    """
    영화 상세 정보 조회 (AI 서버 프록시)
    - 인증 불필요
    """
    movie_id = request_data.get("movieId")
    ticket_id = request_data.get("ticketId")
    
    if not movie_id:
        raise BadRequestException(
            message="영화 ID를 입력해주세요.",
            details="movieId는 필수 항목입니다."
        )
    
    # ticketId로 테마 찾기 (큐레이션과 동일한 LORA 사용)
    theme = TICKET_TO_THEME.get(ticket_id, "편안하고 잔잔한 감성 추구")  # 기본값
    
    try:
        # VM2 AI 서버 호출
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{AI_SERVER_URL}/api/v1/movie-detail",
                json={
                    "movieId": movie_id,
                    "theme": theme
                }
            )
            
            if response.status_code != 200:
                logger.error(f"AI Server error: {response.status_code} - {response.text}")
                raise InternalServerErrorException(
                    message="영화 정보를 가져오는데 실패했습니다.",
                    details=f"AI Server returned {response.status_code}"
                )
            
            return response.json()
            
    except httpx.RequestError as e:
        logger.error(f"AI server connection failed: {e}")
        raise InternalServerErrorException(
            message="AI 서버에 연결할 수 없습니다.",
            details=str(e)
        )
