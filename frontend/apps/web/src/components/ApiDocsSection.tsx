import './ApiDocsSection.css';

const ApiDocsSection = () => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="api-docs-container fade-in">
      <h2 className="docs-title">외부 API 명세서</h2>
      <p className="docs-meta">작성일: 2026년 1월 21일 | 작성자: 강민성</p>

      {/* 1. 기본 컨벤션 및 환경 설정 */}
      <section className="docs-section">
        <h3 className="section-heading">1. 기본 컨벤션 및 환경 설정</h3>

        <div className="docs-card">
          <h4 className="card-label">Base URL</h4>
          <div className="code-block">
            <code>https://cukee.world/api/cuk/et</code>
            <button
              className="copy-btn"
              onClick={() => copyToClipboard('https://cukee.world/api/cuk/et')}
            >
              Copy
            </button>
          </div>
        </div>

        <div className="docs-card">
          <h4 className="card-label">인증 방식: Bearer API Key</h4>
          <ul className="docs-list">
            <li><strong>Content-Type:</strong> application/json</li>
            <li><strong>Authentication:</strong> Authorization: Bearer &lt;API_KEY&gt;</li>
            <li><strong>토큰 저장:</strong> 클라이언트 보관 (서버 쿠키 사용 안 함)</li>
          </ul>
        </div>

        <div className="docs-card">
          <h4 className="card-label">모델 식별자</h4>
          <ul className="docs-list">
            <li><strong>고정 모델명:</strong> <code className="inline-code">Cukee-1.5-it</code></li>
            <li>다른 모델 이름은 허용하지 않음</li>
          </ul>
        </div>

        <div className="docs-card">
          <h4 className="card-label">공통 에러 응답</h4>
          <pre className="code-block-multi">
{`{
  "error": {
    "message": "string",
    "type": "string",
    "param": "string",
    "code": "string"
  }
}`}
          </pre>
        </div>

        <div className="docs-card">
          <h4 className="card-label">공통 에러 코드</h4>
          <ul className="docs-list error-codes">
            <li><code className="inline-code">invalid_api_key</code> - API 키 없음/유효하지 않음</li>
            <li><code className="inline-code">model_not_found</code> - 모델명 불일치</li>
            <li><code className="inline-code">unsupported</code> - 미지원 옵션 요청</li>
            <li><code className="inline-code">upstream_error</code> - AI 서버 오류</li>
            <li><code className="inline-code">timeout</code> - AI 서버 타임아웃</li>
          </ul>
        </div>
      </section>

      {/* 2. Chat Completion */}
      <section className="docs-section">
        <h3 className="section-heading">2. Chat Completion (OpenAI 호환)</h3>

        <div className="endpoint-badge">
          <span className="method-badge post">POST</span>
          <code>/chat/api/enterprise</code>
        </div>

        <div className="docs-card">
          <h4 className="card-label">Request</h4>
          <pre className="code-block-multi">
{`{
  "model": "Cukee-1.5-it",
  "messages": [
    { "role": "user", "content": "잔잔한 영화 추천해줘" }
  ],
  "ticketId": 3,
  "pinnedMovieIds": [101, 203],
  "isAdultAllowed": false,
  "temperature": 0.7,
  "top_p": 0.9,
  "top_k": 50,
  "max_tokens": 2048,
  "stream": false
}`}
          </pre>
        </div>

        <div className="docs-card">
          <h4 className="card-label">필드 설명</h4>
          <table className="docs-table">
            <thead>
              <tr>
                <th>필드</th>
                <th>필수</th>
                <th>설명</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>model</code></td>
                <td className="required">필수</td>
                <td>Cukee-1.5-it만 허용</td>
              </tr>
              <tr>
                <td><code>messages</code></td>
                <td className="required">필수</td>
                <td>OpenAI 호환 메시지 배열 (role: system | user | assistant)</td>
              </tr>
              <tr>
                <td><code>ticketId</code></td>
                <td className="optional">선택</td>
                <td>테마 선택용 (1~11), 기본값 3</td>
              </tr>
              <tr>
                <td><code>pinnedMovieIds</code></td>
                <td className="optional">선택</td>
                <td>고정 영화 ID 리스트</td>
              </tr>
              <tr>
                <td><code>isAdultAllowed</code></td>
                <td className="optional">선택</td>
                <td>19금 허용 여부, 기본값 false</td>
              </tr>
              <tr>
                <td><code>temperature</code></td>
                <td className="optional">선택</td>
                <td>생성 다양성 조절</td>
              </tr>
              <tr>
                <td><code>top_p, top_k</code></td>
                <td className="optional">선택</td>
                <td>샘플링 파라미터</td>
              </tr>
              <tr>
                <td><code>max_tokens</code></td>
                <td className="optional">선택</td>
                <td>최대 출력 토큰 수</td>
              </tr>
              <tr>
                <td><code>stream</code></td>
                <td className="unsupported">미지원</td>
                <td>true면 에러 반환</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="docs-card">
          <h4 className="card-label">Response: 200 OK</h4>
          <pre className="code-block-multi">
{`{
  "id": "chatcmpl-<uuid>",
  "object": "chat.completion",
  "created": 1710000000,
  "model": "Cukee-1.5-it",
  "choices": [
    {
      "index": 0,
      "message": { "role": "assistant", "content": "..." },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 123,
    "completion_tokens": 45,
    "total_tokens": 168
  }
}`}
          </pre>
        </div>

        <div className="docs-card error-card">
          <h4 className="card-label">Error 예시</h4>
          <ul className="docs-list">
            <li><strong>401 Unauthorized</strong> - API 키 없음/유효하지 않음</li>
            <li><strong>400 Bad Request</strong> - 모델명/파라미터 오류</li>
          </ul>
          <pre className="code-block-multi">
{`{
  "error": {
    "message": "Model 'xxx' not found.",
    "type": "invalid_request_error",
    "param": "model",
    "code": "model_not_found"
  }
}`}
          </pre>
        </div>
      </section>

      {/* 3. 사용량/요금 */}
      <section className="docs-section">
        <h3 className="section-heading">3. 사용량/요금</h3>

        <div className="docs-card pricing-card">
          <h4 className="card-label">요금 기준</h4>
          <div className="pricing-grid">
            <div className="pricing-item">
              <span className="pricing-label">입력 토큰</span>
              <span className="pricing-value">₩2,000 / 1M tokens</span>
            </div>
            <div className="pricing-item cached">
              <span className="pricing-label">캐시된 입력</span>
              <span className="pricing-value">₩250 / 1M tokens</span>
            </div>
            <div className="pricing-item">
              <span className="pricing-label">출력 토큰</span>
              <span className="pricing-value">₩15,000 / 1M tokens</span>
            </div>
          </div>
          <p className="pricing-note">* 토큰 수는 내부 추정치 기준</p>
        </div>
      </section>

      {/* 4. 제한 */}
      <section className="docs-section">
        <h3 className="section-heading">4. 제한 (기본값)</h3>

        <div className="docs-card">
          <div className="limits-grid">
            <div className="limit-item">
              <span className="limit-label">RPM</span>
              <span className="limit-value">200</span>
              <span className="limit-desc">Requests per Minute</span>
            </div>
            <div className="limit-item">
              <span className="limit-label">TPM</span>
              <span className="limit-value">30,000</span>
              <span className="limit-desc">Tokens per Minute</span>
            </div>
            <div className="limit-item">
              <span className="limit-label">RPD</span>
              <span className="limit-value">200,000</span>
              <span className="limit-desc">Requests per Day</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 예시 요청 */}
      <section className="docs-section">
        <h3 className="section-heading">5. 예시 요청</h3>

        <div className="docs-card">
          <h4 className="card-label">Python</h4>
          <pre className="code-block-multi">
{`import requests

url = "https://cukee.world/api/cuk/et/chat/api/enterprise"
headers = {
    "Authorization": "Bearer ck_...",
    "Content-Type": "application/json",
}
payload = {
    "model": "Cukee-1.5-it",
    "messages": [{"role": "user", "content": "잔잔한 영화 추천해줘"}],
    "ticketId": 3,
}

response = requests.post(url, headers=headers, json=payload, timeout=30)
response.raise_for_status()
print(response.json())`}
          </pre>
          <button
            className="copy-btn block-copy"
            onClick={() => copyToClipboard(`import requests

url = "https://cukee.world/api/cuk/et/chat/api/enterprise"
headers = {
    "Authorization": "Bearer ck_...",
    "Content-Type": "application/json",
}
payload = {
    "model": "Cukee-1.5-it",
    "messages": [{"role": "user", "content": "잔잔한 영화 추천해줘"}],
    "ticketId": 3,
}

response = requests.post(url, headers=headers, json=payload, timeout=30)
response.raise_for_status()
print(response.json())`)}
          >
            Copy Code
          </button>
        </div>

        <div className="docs-card">
          <h4 className="card-label">JavaScript</h4>
          <pre className="code-block-multi">
{`const url = "https://cukee.world/api/cuk/et/chat/api/enterprise";
const payload = {
  model: "Cukee-1.5-it",
  messages: [{ role: "user", content: "잔잔한 영화 추천해줘" }],
  ticketId: 3,
};

fetch(url, {
  method: "POST",
  headers: {
    Authorization: "Bearer ck_...",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
})
  .then((res) => {
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    return res.json();
  })
  .then((data) => console.log(data))
  .catch((err) => console.error(err));`}
          </pre>
          <button
            className="copy-btn block-copy"
            onClick={() => copyToClipboard(`const url = "https://cukee.world/api/cuk/et/chat/api/enterprise";
const payload = {
  model: "Cukee-1.5-it",
  messages: [{ role: "user", content: "잔잔한 영화 추천해줘" }],
  ticketId: 3,
};

fetch(url, {
  method: "POST",
  headers: {
    Authorization: "Bearer ck_...",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
})
  .then((res) => {
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    return res.json();
  })
  .then((data) => console.log(data))
  .catch((err) => console.error(err));`)}
          >
            Copy Code
          </button>
        </div>

        <div className="docs-card">
          <h4 className="card-label">cURL</h4>
          <pre className="code-block-multi">
{`curl -X POST "https://cukee.world/api/cuk/et/chat/api/enterprise" \\
  -H "Authorization: Bearer ck_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "Cukee-1.5-it",
    "messages": [{ "role": "user", "content": "잔잔한 영화 추천해줘" }],
    "ticketId": 3
  }'`}
          </pre>
          <button
            className="copy-btn block-copy"
            onClick={() => copyToClipboard(`curl -X POST "https://cukee.world/api/cuk/et/chat/api/enterprise" \\
  -H "Authorization: Bearer ck_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "Cukee-1.5-it",
    "messages": [{ "role": "user", "content": "잔잔한 영화 추천해줘" }],
    "ticketId": 3
  }'`)}
          >
            Copy Code
          </button>
        </div>
      </section>
    </div>
  );
};

export default ApiDocsSection;
