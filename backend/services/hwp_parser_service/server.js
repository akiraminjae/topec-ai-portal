// 한글 문서(hwp/hwpx) 전문 파서 — TOPEC AI 포털 공통 서비스 레이어
//
// document_service는 파이썬(FastAPI)이지만, hwp(3.x/5.x 바이너리)·hwpx(OWPML) 파싱은
// Node.js 라이브러리 kordoc(https://github.com/chrisryugj/kordoc, MIT)이 훨씬 정교하고
// 검증되어 있어(rhwp/cfb 등 기반) 이 파싱만 별도의 작은 Node 서비스로 분리했습니다.
// document_service/parsers.py가 hwp/hwpx 파일을 이 서비스로 보내 결과를 받아옵니다.

import express from "express";
import multer from "multer";
import { parse } from "kordoc";

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

app.get("/health", (req, res) => {
  res.json({ service: "hwp_parser_service", status: "ok" });
});

app.post("/parse", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(422).json({ detail: "file 필드가 필요합니다" });
  }
  try {
    const result = await parse(req.file.buffer);
    if (!result.success) {
      return res.status(422).json({ detail: result.errorMessage || "문서를 파싱할 수 없습니다" });
    }
    const blocks = result.blocks || [];
    const paragraphs = blocks.filter((b) => b.type === "paragraph" || b.type === "heading").length;
    const tables = result.tableCount ?? blocks.filter((b) => b.type === "table").length;
    const images = result.imageCount ?? blocks.filter((b) => b.type === "image").length;
    res.json({ paragraphs, tables, images, text: result.markdown || "" });
  } catch (err) {
    res.status(500).json({ detail: err instanceof Error ? err.message : String(err) });
  }
});

const port = process.env.PORT || 8107;
app.listen(port, "0.0.0.0", () => {
  console.log(`hwp_parser_service listening on ${port}`);
});
