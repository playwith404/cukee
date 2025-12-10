import json
import re

INPUT_FILE = "tmdb_movie_list_full.jsonl"
OUTPUT_FILE = "tmdb_movie_list_full_v2.jsonl"

# 문제되는 유니코드 라인 구분 문자들
UNUSUAL_NEWLINES = re.compile(r'[\u2028\u2029\u0085]')

def clean_newlines_in_value(value):
    if isinstance(value, str):
        return UNUSUAL_NEWLINES.sub("\n", value)
    if isinstance(value, list):
        return [clean_newlines_in_value(v) for v in value]
    if isinstance(value, dict):
        return {k: clean_newlines_in_value(v) for k, v in value.items()}
    return value

with open(INPUT_FILE, "r", encoding="utf-8") as fin, \
     open(OUTPUT_FILE, "w", encoding="utf-8") as fout:

    for line in fin:
        record = json.loads(line)
        record = clean_newlines_in_value(record)
        fout.write(json.dumps(record, ensure_ascii=False) + "\n")

print("✅ 유니코드 줄바꿈 문자 정리 완료")
