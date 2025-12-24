#!/bin/bash

# AI Server 로그/캐시 삭제 스크립트

echo "Stopping Cukee AI Model API Server..."
docker compose down

echo "✓ Server stopped"
echo ""
echo "To remove all data (logs, cache):"
echo "  docker-compose down -v"
echo "  rm -rf logs/"
