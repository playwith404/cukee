"""영화 큐레이션 엔드포인트"""
import logging
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.schemas.curation import CurateMoviesRequest, CurateMoviesResponse, CuratedMovie
from app.api.dependencies import get_db_session

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/curate-movies", response_model=CurateMoviesResponse)
async def curate_movies_by_ticket(request: CurateMoviesRequest, db: Session = Depends(get_db_session)):
    """티켓에 속한 영화 중 랜덤으로 큐레이션"""
    try:
        logger.info(f"Curating movies for ticket {request.ticketId}, limit: {request.limit}")
        
        query = text("""
            SELECT m.id as movie_id, m.title_ko, m.poster_path
            FROM ticket_group_movies tgm
            JOIN movies m ON tgm.movie_id = m.id
            WHERE tgm.ticket_group_id = :ticket_id
            AND (:adult_exclude = false OR m.certification IN ('ALL', '12', '15', 'G', 'PG', 'PG-13'))
            ORDER BY RANDOM()
            LIMIT :limit
        """)
        
        result = db.execute(query, {
            "ticket_id": request.ticketId, 
            "limit": request.limit,
            "adult_exclude": request.adultExclude
        })
        rows = result.fetchall()
        
        if not rows:
            logger.warning(f"No movies found for ticket {request.ticketId}")
            raise HTTPException(status_code=404, detail=f"No movies found for ticket {request.ticketId}")
        
        curated_movies = [
            CuratedMovie(movieId=row.movie_id, title=row.title_ko, posterUrl=row.poster_path or "")
            for row in rows
        ]
        
        logger.info(f"Successfully curated {len(curated_movies)} movies")
        return CurateMoviesResponse(ticketId=request.ticketId, movies=curated_movies)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Curation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
