FROM redis:7.2-alpine

# Redis 설정 파일 복사 (필요시)
# COPY redis.conf /usr/local/etc/redis/redis.conf

# 기본 포트 노출
EXPOSE 6379

# Redis 서버 실행
CMD ["redis-server", "--appendonly", "yes"]
