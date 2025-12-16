import os
from pathlib import Path
from datetime import datetime

def count_and_save():
    # 경로 설정
    base_dir = Path.cwd()
    target_dir = base_dir / "naver_reviews_data"
    output_file = base_dir / "review_analysis_result.txt" # 결과가 저장될 파일명

    if not target_dir.exists():
        print("❌ 'naver_reviews_data' 폴더가 없습니다.")
        return

    print("📊 데이터 분석 중... (결과는 파일로도 저장됩니다)")

    # 통계 변수 초기화
    total_files = 0
    total_reviews = 0
    unique_movie_ids = set()
    
    # 연도별 통계 (딕셔너리)
    year_stats = {} 

    files = list(target_dir.rglob("*.jsonl"))
    
    for file_path in files:
        total_files += 1
        
        # 1. 연도 파악 (상위 폴더 이름)
        year = file_path.parent.name
        if year not in year_stats:
            year_stats[year] = 0
            
        # 2. 고유 영화 ID 추출
        try:
            file_name = file_path.stem
            movie_id = file_name.split('_')[-1]
            unique_movie_ids.add(movie_id)
        except:
            pass

        # 3. 리뷰 개수 카운트
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                line_count = sum(1 for _ in f)
                total_reviews += line_count
                year_stats[year] += line_count # 연도별 합계에 추가
        except Exception as e:
            print(f"⚠️ 읽기 실패: {file_path.name}")

        if total_files % 1000 == 0:
            print(f"   ... {total_files}개 파일 처리 완료")

    # --- 결과 리포트 내용 작성 ---
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    report_lines = []
    report_lines.append("=" * 40)
    report_lines.append(f"       🎬 네이버 영화 리뷰 데이터 분석 리포트")
    report_lines.append(f"       (분석 일시: {current_time})")
    report_lines.append("=" * 40)
    report_lines.append(f"")
    report_lines.append(f"📌 [전체 요약]")
    report_lines.append(f" - 총 파일(.jsonl) 수 : {total_files:,} 개")
    report_lines.append(f" - 수집된 영화 편수   : {len(unique_movie_ids):,} 편")
    report_lines.append(f" - 총 리뷰 데이터 수  : {total_reviews:,} 건")
    report_lines.append(f"")
    report_lines.append(f"📌 [연도별 리뷰 분포]")
    
    # 연도별로 정렬해서 출력
    for year in sorted(year_stats.keys()):
        count = year_stats[year]
        report_lines.append(f" - {year}년 : {count:,} 건")
        
    report_lines.append(f"")
    report_lines.append("=" * 40)

    # 리스트를 하나의 문자열로 합치기
    final_report = "\n".join(report_lines)

    # --- 1. 화면 출력 ---
    print("\n" + final_report)

    # --- 2. 파일 저장 ---
    try:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(final_report)
        print(f"\n✅ 분석 결과가 '{output_file.name}' 파일로 저장되었습니다.")
    except Exception as e:
        print(f"\n❌ 파일 저장 중 오류 발생: {e}")

if __name__ == "__main__":
    count_and_save()