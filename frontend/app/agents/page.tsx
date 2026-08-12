// 에이전트 목록 — 배포된 에이전트를 조회하는 화면 (아키텍처 1번째 레이어: 사용자 접점)
// TODO(개발팀): agent_lifecycle_service(GET /agents)와 연동해 실제 목록을 불러오도록 교체

const MOCK_AGENTS = [
  { name: "법령·지침 질의응답 에이전트", owner: "총무팀", status: "운영중" },
  { name: "회의록 요약·보고서 작성 에이전트", owner: "경영기획팀", status: "파일럿" },
  { name: "출장 휴강·보강 처리 에이전트", owner: "교무팀", status: "개발중" },
];

export default function AgentsPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-navy">에이전트 목록</h1>
      <p className="mb-6 text-sm text-steel">배포된 에이전트를 조회하고 실행합니다.</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {MOCK_AGENTS.map((a) => (
          <div key={a.name} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-navy">{a.name}</span>
              <span className="rounded-full bg-iceLight px-2 py-0.5 text-xs font-semibold text-navy">
                {a.status}
              </span>
            </div>
            <div className="text-xs text-steel">담당 부서: {a.owner}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
