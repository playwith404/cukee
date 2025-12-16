import os
import shutil
from pathlib import Path

def merge_review_folders():
    # 현재 작업 경로 (이 스크립트가 있는 위치)
    base_dir = Path.cwd()
    
    # 결과물이 모일 폴더 이름
    target_dir_name = "naver_reviews_data"
    target_dir = base_dir / target_dir_name
    
    # 결과 폴더 생성 (이미 있으면 무시)
    target_dir.mkdir(exist_ok=True)
    print(f"📂 목표 폴더 생성 완료: {target_dir}")

    # 처리할 폴더 범위 (1 ~ 10)
    for i in range(1, 11):
        source_folder_name = f"naver_reviews_data{i}"
        source_folder = base_dir / source_folder_name

        # 소스 폴더가 실제로 존재하는지 확인
        if not source_folder.exists():
            print(f"⚠️ 폴더를 찾을 수 없음: {source_folder_name} (건너뜀)")
            continue
            
        print(f"--- {source_folder_name} 작업 시작 ---")

        # 해당 폴더 내의 모든 jsonl 파일 탐색 (rglob은 하위 폴더까지 검색)
        file_count = 0
        for file_path in source_folder.rglob("*.jsonl"):
            # 파일의 부모 폴더 이름 (연도) 추출 (예: '2023')
            year_folder_name = file_path.parent.name
            
            # 목표 경로 내에 연도 폴더 경로 설정 (예: naver_reviews_data/2023)
            dest_year_dir = target_dir / year_folder_name
            dest_year_dir.mkdir(exist_ok=True)
            
            # 최종 파일 경로 설정
            dest_file_path = dest_year_dir / file_path.name
            
            try:
                # 파일 이동 (복사를 원하면 shutil.move 대신 shutil.copy2 사용)
                # shutil.move(file_path, dest_file_path) # 원본 삭제 후 이동
                shutil.copy2(file_path, dest_file_path) # 원본 유지 후 복사
                file_count += 1
            except Exception as e:
                print(f"❌ 오류 발생: {file_path.name} - {e}")

        print(f"✅ {source_folder_name} 완료: {file_count}개 파일 처리됨")

    print("\n🎉 모든 폴더 병합이 완료되었습니다!")

if __name__ == "__main__":
    merge_review_folders()