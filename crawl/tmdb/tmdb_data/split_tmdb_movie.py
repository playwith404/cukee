import os

INPUT_FILE = "tmdb_movie_list_full_v2.jsonl"  # 전처리 완료된 파일
OUTPUT_DIR = "split_tmdb"
NUM_SPLITS = 10  # 쪼갤 파일 개수

def split_jsonl(input_path, output_dir, num_splits):
    # 출력 디렉토리 생성
    os.makedirs(output_dir, exist_ok=True)

    # 1차 패스: 총 라인 수 세기
    total_lines = 0
    with open(input_path, "r", encoding="utf-8") as f:
        for _ in f:
            total_lines += 1

    if total_lines == 0:
        print("입력 파일에 데이터가 없습니다.")
        return

    print(f"총 라인 수: {total_lines}")

    # 각 파일에 들어갈 최소 라인 수와 나머지
    base_lines_per_file = total_lines // num_splits
    remainder = total_lines % num_splits  # 앞에서부터 1개씩 +1 해서 분배

    print(f"파일당 기본 라인 수: {base_lines_per_file}, 여분(앞에서 +1): {remainder}")

    # 2차 패스: 실제로 분할해서 쓰기
    current_file_index = 0
    current_line_in_file = 0

    # 첫 번째 파일 열기
    lines_in_this_file = base_lines_per_file + (1 if current_file_index < remainder else 0)
    output_path = os.path.join(output_dir, f"tmdb_part_{current_file_index+1:02d}.jsonl")
    fout = open(output_path, "w", encoding="utf-8")
    print(f"[OPEN] {output_path} (최대 {lines_in_this_file} 라인)")

    with open(input_path, "r", encoding="utf-8") as fin:
        for line_idx, line in enumerate(fin):
            # 현재 파일에 라인 쓰기
            fout.write(line)
            current_line_in_file += 1

            # 현재 파일의 목표 라인 수에 도달했으면 파일 교체
            if current_line_in_file >= lines_in_this_file and current_file_index < num_splits - 1:
                fout.close()
                current_file_index += 1
                current_line_in_file = 0

                lines_in_this_file = base_lines_per_file + (1 if current_file_index < remainder else 0)
                output_path = os.path.join(output_dir, f"tmdb_part_{current_file_index+1:02d}.jsonl")
                fout = open(output_path, "w", encoding="utf-8")
                print(f"[OPEN] {output_path} (최대 {lines_in_this_file} 라인)")

    fout.close()
    print("✅ 분할 완료!")


if __name__ == "__main__":
    split_jsonl(INPUT_FILE, OUTPUT_DIR, NUM_SPLITS)
