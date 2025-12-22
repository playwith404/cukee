#!/bin/bash

# ================================================
# Cukee Database Setup Script
# Version: 1.7
# Created: 2025-12-19
# ================================================

echo "================================================"
echo "Cukee Database Setup"
echo "Version: 1.7"
echo "================================================"
echo ""

# PostgreSQL 사용자 (필요시 수정)
POSTGRES_USER="doochul"

# 스크립트 디렉토리
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Step 1: Creating database..."
psql -U $POSTGRES_USER -d postgres -f "$SCRIPT_DIR/01_create_database.sql"

if [ $? -ne 0 ]; then
    echo "Error: Failed to create database"
    exit 1
fi

echo ""
echo "Step 2: Creating tables..."
psql -U $POSTGRES_USER -d cukee -f "$SCRIPT_DIR/02_create_tables.sql"

if [ $? -ne 0 ]; then
    echo "Error: Failed to create tables"
    exit 1
fi

echo ""
echo "Step 3: Creating indexes..."
psql -U $POSTGRES_USER -d cukee -f "$SCRIPT_DIR/03_create_indexes.sql"

if [ $? -ne 0 ]; then
    echo "Error: Failed to create indexes"
    exit 1
fi

echo ""
echo "Step 4: Inserting initial data..."
psql -U $POSTGRES_USER -d cukee -f "$SCRIPT_DIR/04_insert_initial_data.sql"

if [ $? -ne 0 ]; then
    echo "Error: Failed to insert initial data"
    exit 1
fi

echo ""
echo "================================================"
echo "Database setup completed successfully!"
echo "================================================"
echo ""
echo "Database: cukee"
echo "Tables created: 22"
echo "Initial tickets: 11"
echo "Initial genres: 19"
echo ""
echo "To connect to the database, run:"
echo "  psql -U $POSTGRES_USER -d cukee"
echo ""
