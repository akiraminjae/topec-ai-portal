"""텍스트 청킹 — 문자 수 기준 슬라이딩 윈도우, 가능하면 줄바꿈 경계에서 자릅니다."""


def chunk_text(text: str, max_chars: int = 800, overlap: int = 120) -> list[str]:
    text = text.strip()
    if not text:
        return []

    chunks = []
    start = 0
    n = len(text)
    while start < n:
        end = min(start + max_chars, n)
        if end < n:
            nl = text.rfind("\n", start, end)
            if nl > start + max_chars // 2:
                end = nl
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= n:
            break
        start = max(end - overlap, start + 1)
    return chunks
