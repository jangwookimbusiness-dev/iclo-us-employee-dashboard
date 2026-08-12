import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const ROOT = "/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard";
const WORK = path.join(ROOT, "tmp/iclo-snowflake-proposal-v9-deslop");
const OUT = path.join(ROOT, "output/proposal-v9");

const C = {
  navy: "#13294B",
  teal: "#008A94",
  coral: "#D86464",
  ink: "#162742",
  muted: "#66768A",
  rule: "#D8E2E8",
  pale: "#F5F8FA",
  white: "#FFFFFF",
  coverMuted: "#C8D6E1",
};

const TITLE_COPY = {
  en: {
    2: "Four Decisions Stand Between Coverage and Care",
    3: "From Dental Benefit to Verified Use",
    4: "One U.S. Dental-Benefit Lane",
    5: "The U.S. Dental-Benefit Operating Chain",
    6: "Snowflake Governs the Evidence Layer",
    7: "Year One May Cost More",
    8: "What the Buyer Can Verify",
    9: "Route the Existing Support Relationship",
    10: "A 90-Day Validation Plan",
    11: "Data and Responsibility Boundaries",
    12: "Technical Decisions for the Pilot",
    13: "What the J-Curve Model Needs",
    14: "Account Evidence Required Before Outreach",
    15: "ICLO: Confirmed and Still to Verify",
  },
  ko: {
    2: "치아보험에서 실제 진료까지 네 가지 판단이 남습니다",
    3: "치아보험 이용을 청구 근거까지 연결합니다",
    4: "이번 PoC는 미국 시장의 한 운영 구조만 검증합니다",
    5: "미국 치아보험은 계약·운영·청구 주체가 다릅니다",
    6: "Snowflake는 근거 데이터를 통제합니다",
    7: "1년차 비용은 오를 수 있습니다",
    8: "기업이 확인해야 할 네 가지",
    9: "기존 지원 관계를 미국 HLS 검증으로 연결합니다",
    10: "90일 공동 검증 계획",
    11: "데이터와 책임의 경계",
    12: "파일럿 전에 결정할 기술 사항",
    13: "J-curve 모델의 입력과 출력",
    14: "고객 접촉 전 확인할 계정 근거",
    15: "ICLO: 확인된 사실과 남은 검증",
  },
};

function line(fill = "none", width = 0) {
  return { style: "solid", fill, width };
}

function bbox(record) {
  const [left, top, width, height] = record.bbox || [0, 0, 0, 0];
  return { left, top, width, height };
}

function recordsOn(records, slideNo) {
  return records.filter((r) => r.slide === slideNo && ["shape", "textbox"].includes(r.kind));
}

function shape(deck, record) {
  return deck.resolve(record.id);
}

function flat(deck, record) {
  const s = shape(deck, record);
  s.fill = "none";
  s.line = line();
  s.shadow = "shadow-none";
  return s;
}

function ruleBox(deck, record, color = C.rule, width = 1) {
  const s = shape(deck, record);
  s.fill = "none";
  s.line = line(color, width);
  s.shadow = "shadow-none";
  return s;
}

function styleText(deck, record, style) {
  const s = shape(deck, record);
  s.text.style = style;
  return s;
}

function setTextByExact(deck, records, slideNo, oldText, newText) {
  const hit = records.find((r) => r.slide === slideNo && r.text === oldText);
  if (!hit) throw new Error(`Missing text on slide ${slideNo}: ${oldText}`);
  shape(deck, hit).text = newText;
}

function styleByExact(deck, records, slideNo, text, style) {
  const hit = records.find((r) => r.slide === slideNo && r.text === text);
  if (!hit) throw new Error(`Missing text on slide ${slideNo}: ${text}`);
  return styleText(deck, hit, style);
}

function deSlopHeader(deck, records, slideNo, lang) {
  if (slideNo === 1) return;
  const rs = recordsOn(records, slideNo);
  const appendix = slideNo >= 11;
  for (const r of rs) {
    const b = bbox(r);
    if (b.top < 58 && b.left < 400 && r.text) {
      const s = flat(deck, r);
      s.text = appendix ? (lang === "ko" ? "부록" : "APPENDIX") : "";
      if (appendix) s.text.style = { fontSize: 11, bold: true, color: C.muted };
    }
  }

  const rightTop = rs.filter((r) => {
    const b = bbox(r);
    return b.top < 58 && b.left > 700;
  });
  const tagText = rightTop.filter((r) => r.text && r.text.trim()).map((r) => r.text.trim());
  const primary = rightTop.find((r) => r.text && r.text.trim());
  for (const r of rightTop) flat(deck, r);
  if (primary) {
    const s = shape(deck, primary);
    const combined = [...new Set(tagText)].join(" / ");
    s.text = combined;
    s.position = { left: 790, top: 28, width: 426, height: 18 };
    s.text.style = {
      fontSize: 10,
      bold: true,
      color: combined.includes("HYPOTHESIS") || combined.includes("가설") ? C.coral : C.teal,
      alignment: "right",
    };
    for (const r of rightTop) {
      if (r.id !== primary.id && r.text && r.text.trim()) shape(deck, r).text = "";
    }
  }
}

function flattenBottomNote(deck, records, slideNo) {
  for (const r of recordsOn(records, slideNo)) {
    const b = bbox(r);
    if (b.top >= 600 && b.top < 675 && b.width > 700) {
      const s = flat(deck, r);
      if (r.text && r.text.trim()) {
        s.position = { left: 64, top: b.top + 2, width: 980, height: Math.max(20, b.height) };
        s.text.style = {
          fontSize: 11,
          bold: false,
          color: /not |No |아닙|미노출|prerequisite|전제|확인/.test(r.text) ? C.coral : C.teal,
          alignment: "left",
        };
      }
    }
  }
}

function editCover(deck, records) {
  const rs = recordsOn(records, 1);
  for (const r of rs) {
    const b = bbox(r);
    if (!r.text && b.top >= 420 && b.top < 570 && b.height > 80) flat(deck, r);
    if (b.top >= 620 && b.top < 660) {
      const s = flat(deck, r);
      if (r.text) s.text = "";
    }
    if (r.text && b.top >= 440 && b.top < 480) styleText(deck, r, { fontSize: 19, bold: true, color: C.white });
    if (r.text && b.top >= 480 && b.top < 550) styleText(deck, r, { fontSize: 14, color: C.coverMuted });
    if (!r.text && b.height === 0 && b.top > 470 && b.top < 520) {
      const s = shape(deck, r);
      s.line = line(C.teal, 1);
    }
  }
}

function editDecision(deck, records, lang) {
  const rs = recordsOn(records, 2);
  for (const r of rs) {
    const b = bbox(r);
    if (!r.text && b.left === 64 && b.width === 450 && b.top >= 210 && b.top <= 510) flat(deck, r);
    if (r.text && b.left < 220 && b.top >= 220 && b.top < 550) styleText(deck, r, { fontSize: 13, bold: true, color: C.teal });
    if (r.text && b.left >= 220 && b.left < 520 && b.top >= 220 && b.top < 580) styleText(deck, r, { fontSize: 15, color: C.ink });
    if (!r.text && b.left >= 800 && b.top >= 210 && b.height > 300) flat(deck, r);
    if (r.text && b.left >= 830 && b.top >= 230) styleText(deck, r, { color: C.ink });
    if (!r.text && b.width <= 12 && b.height <= 12 && b.left >= 830) {
      const s = shape(deck, r);
      s.fill = C.teal;
      s.line = line();
    }
  }
  setTextByExact(
    deck,
    records,
    2,
    lang === "ko" ? "치아보험이 있어도 다음 행동은 자동으로 정해지지 않습니다" : "Coverage Alone Does Not Answer the Employee's Next Question",
    TITLE_COPY[lang][2],
  );
}

function editJourney(deck, records, lang) {
  const rs = recordsOn(records, 3);
  for (const r of rs) {
    const b = bbox(r);
    if (!r.text && b.top === 230 && b.height === 180) flat(deck, r);
    if (r.text && /^0[1-4]$/.test(r.text)) {
      const s = flat(deck, r);
      s.text = String(Number(r.text));
      s.text.style = { fontSize: 13, bold: true, color: C.teal };
    }
    if (!r.text && b.top === 455 && b.width > 1000) flat(deck, r);
    if (r.text && (r.text === "SHADOW SIGNAL" || r.text === "섀도 신호")) styleText(deck, r, { fontSize: 13, bold: true, color: C.coral });
    if (b.top >= 565 && b.top < 670) {
      const s = flat(deck, r);
      if (r.text) s.text = "";
    }
  }
  setTextByExact(
    deck,
    records,
    3,
    lang === "ko" ? "ICLO는 치아보험 정보와 직원의 자발적 행동을 연결합니다" : "ICLO Connects Dental Benefits to Employee Action",
    TITLE_COPY[lang][3],
  );
}

function editScope(deck, records, lang) {
  const old = lang === "ko" ? "PoC는 미국 치아보험 시장의 한 운영 구조만 검증합니다" : "The PoC Covers One U.S. Dental-Benefit Operating Lane";
  setTextByExact(deck, records, 4, old, TITLE_COPY[lang][4]);

  const tableRecord = records.find((r) => r.slide === 4 && r.kind === "table");
  if (tableRecord) {
    const table = deck.resolve(tableRecord.id);
    table.borders.assign({ style: "solid", fill: C.rule, width: 1 });
    for (let row = 1; row < 6; row += 1) {
      const whyCell = table.getCell(row, 4);
      whyCell.fill = C.white;
      whyCell.text.style = { color: C.coral, bold: true };
    }
  }
}

function editEcosystem(deck, records, lang) {
  const rs = recordsOn(records, 5);
  for (const r of rs) {
    const b = bbox(r);
    if (!r.text && b.top >= 230 && b.top < 330) ruleBox(deck, r, C.rule, 1);
    if (!r.text && b.left < 300 && b.top >= 230 && b.top < 520) ruleBox(deck, r, C.rule, 1);
    if (!r.text && b.left >= 700 && b.top >= 540 && b.top < 630) flat(deck, r);
  }
  setTextByExact(
    deck,
    records,
    5,
    lang === "ko" ? "미국 치아보험은 보장 대상·비용 부담·운영 주체가 서로 다릅니다" : "How the U.S. Dental Benefit Ecosystem Fits Together",
    TITLE_COPY[lang][5],
  );
}

function editArchitecture(deck, records, lang) {
  const rs = recordsOn(records, 6);
  for (const r of rs) {
    const b = bbox(r);
    if (!r.text && b.top >= 230 && b.top < 330) flat(deck, r);
    if (!r.text && b.left < 300 && b.top >= 230 && b.top < 520) flat(deck, r);
    if (!r.text && b.left >= 700 && b.top >= 540 && b.top < 630) flat(deck, r);
  }
  setTextByExact(
    deck,
    records,
    6,
    lang === "ko" ? "Snowflake는 데이터와 책임을 분리해 연결하는 근거 레이어입니다" : "Snowflake Is the Governed Evidence and Collaboration Plane",
    TITLE_COPY[lang][6],
  );

  const copy = lang === "ko" ? {
    raw: "원본 이미지 경로",
    shadow: "그림자 모드 분석",
    structured: "구조화된 근거 데이터 경로",
    canonical: "공통 데이터 모델",
    quality: "품질 + 통제",
    outcome: "성과 계산 레이어",
    uri: "URI + 메타데이터 + 모델 버전 + 승인된 파생 신호만",
  } : {
    raw: "RAW-IMAGE PATH",
    shadow: "Shadow inference",
    structured: "STRUCTURED EVIDENCE PATH",
    canonical: "Canonical model",
    quality: "Quality + controls",
    outcome: "Outcome layer",
    uri: "URI + metadata + model version + approved derived signal only",
  };
  styleByExact(deck, records, 6, copy.raw, { fontSize: 13, bold: true, color: C.coral });
  styleByExact(deck, records, 6, copy.shadow, { fontSize: 13, bold: true, color: C.coral });
  styleByExact(deck, records, 6, copy.structured, { fontSize: 13, bold: true, color: C.teal });
  styleByExact(deck, records, 6, copy.canonical, { fontSize: 13, bold: true, color: C.teal });
  styleByExact(deck, records, 6, copy.quality, { fontSize: 13, bold: true, color: C.teal });
  styleByExact(deck, records, 6, copy.outcome, { fontSize: 13, bold: true, color: C.teal });
  styleByExact(deck, records, 6, copy.uri, { fontSize: 12, bold: true, color: C.coral });
}

function editCurve(deck, records, lang) {
  const rs = recordsOn(records, 7);
  for (const r of rs) {
    const b = bbox(r);
    if (!r.text && b.top >= 230 && b.top < 430 && b.width >= 150 && b.width < 500) flat(deck, r);
    if (!r.text && b.left >= 850 && b.top >= 200 && b.top < 500) flat(deck, r);
  }
  setTextByExact(
    deck,
    records,
    7,
    lang === "ko" ? "경제성은 첫해 절감 약속이 아니라 J-curve 검증에서 시작합니다" : "The Economics Begin with a J-Curve - Not a Year-One Savings Promise",
    TITLE_COPY[lang][7],
  );

  const copy = lang === "ko" ? {
    hypothesis: "예시 가설 - 실제 ICLO 성과가 아님",
    low: "낮은\n이직률",
    high: "높은\n이직률",
  } : {
    hypothesis: "Illustrative shape only - not an ICLO outcome",
    low: "LOW\nTURNOVER",
    high: "HIGH\nTURNOVER",
  };
  styleByExact(deck, records, 7, copy.hypothesis, { fontSize: 12, bold: true, color: C.coral });
  styleByExact(deck, records, 7, copy.low, { fontSize: 13, bold: true, color: C.teal, alignment: "center" });
  styleByExact(deck, records, 7, copy.high, { fontSize: 13, bold: true, color: C.coral, alignment: "center" });
  styleByExact(
    deck,
    records,
    7,
    lang === "ko" ? "여러 해 가치 관점" : "Multi-year value lens",
    { fontSize: 12, color: C.teal, alignment: "center" },
  );
  styleByExact(
    deck,
    records,
    7,
    lang === "ko" ? "직원 경험 관점" : "Employee experience lens",
    { fontSize: 12, color: C.coral, alignment: "center" },
  );
  for (const r of rs) {
    const b = bbox(r);
    if (!r.text && b.top >= 530 && b.top < 640 && b.width <= 8 && b.height >= 50) {
      const s = shape(deck, r);
      s.fill = C.teal;
      s.line = line();
    }
  }
}

function editDashboard(deck, records, lang) {
  setTextByExact(
    deck,
    records,
    8,
    lang === "ko" ? "대시보드는 성과보다 데이터 기준과 프라이버시를 먼저 보여줍니다" : "The Dashboard Makes Data Quality and Privacy Visible",
    TITLE_COPY[lang][8],
  );
}

function editRoute(deck, records, lang) {
  const rs = recordsOn(records, 9);
  const labels = new Set(lang === "ko" ? ["라우팅", "적합성·담당", "계정", "전환 경로"] : ["ROUTE", "FIT + PEOPLE", "ACCOUNT", "PATH"]);
  for (const r of rs) {
    const b = bbox(r);
    if (!r.text && b.left === 64 && b.width > 1000 && b.top >= 210 && b.top < 590) flat(deck, r);
    if (r.text && /^0[1-4]$/.test(r.text)) {
      const s = flat(deck, r);
      if (Number(r.text) === 1) {
        s.text = "STEP 0";
        s.position = { left: 92, top: b.top, width: 60, height: b.height };
        s.text.style = { fontSize: 11, bold: true, color: C.teal };
      } else {
        s.text = "";
      }
    }
    if (r.text && labels.has(r.text)) {
      const s = styleText(deck, r, { fontSize: 13, bold: true, color: C.ink });
      if (r.text !== "ROUTE" && r.text !== "라우팅") s.position = { left: 92, top: b.top, width: 198, height: b.height };
    }
  }
  setTextByExact(
    deck,
    records,
    9,
    lang === "ko" ? "기존 Snowflake 지원을 미국 HLS 공동 검증 경로로 전환합니다" : "Convert Existing Snowflake Support into a Routed Validation",
    TITLE_COPY[lang][9],
  );
}

function editTimeline(deck, records, lang) {
  const rs = recordsOn(records, 10);
  for (const r of rs) {
    const b = bbox(r);
    if (!r.text && b.top === 218 && b.height === 240) flat(deck, r);
    if (!r.text && b.top === 482 && b.width > 1000) flat(deck, r);
    if (r.text && b.top >= 480 && b.top < 640) {
      const s = flat(deck, r);
      s.position = { left: 64, top: 500, width: 1120, height: 86 };
      s.text.style = { fontSize: 12, color: C.muted, alignment: "left" };
    }
  }
  setTextByExact(
    deck,
    records,
    10,
    lang === "ko" ? "Snowflake와 ICLO의 역할·게이트·산출물을 90일 안에 명확히 합니다" : "A 90-Day Validation with Explicit Owners, Gates and Outputs",
    TITLE_COPY[lang][10],
  );


  for (const r of rs) {
    const b = bbox(r);
    if (!r.text) continue;
    if (b.top >= 220 && b.top < 246) {
      styleText(deck, r, {
        fontSize: 11,
        bold: true,
        color: /CONDITIONAL|조건부/.test(r.text) ? C.muted : C.teal,
      });
    }
    if (b.top >= 246 && b.top < 278) {
      styleText(deck, r, { fontSize: 17, bold: true, color: C.navy });
    }
    if (b.top >= 298 && b.top < 356) {
      styleText(deck, r, { fontSize: 11.5, color: C.muted });
    }
    if (b.top >= 378 && b.top < 416) {
      styleText(deck, r, { fontSize: 11.5, color: C.muted });
    }
    if (r.text === "SNOWFLAKE") styleText(deck, r, { fontSize: 10, bold: true, color: C.teal });
    if (r.text === "ICLO") styleText(deck, r, { fontSize: 10, bold: true, color: C.navy });
    if (/^GATE|^게이트/.test(r.text)) styleText(deck, r, { fontSize: 10, bold: true, color: C.navy });
    if (/^TRIGGER|^발동 조건/.test(r.text)) styleText(deck, r, { fontSize: 10, bold: true, color: C.coral });
  }
}

function editAppendix(deck, records, slideNo, lang) {
  if (slideNo === 12 || slideNo === 15) {
    for (const r of recordsOn(records, slideNo)) {
      const b = bbox(r);
      if (!r.text && b.left >= 640 && b.top >= 190 && b.height > 300) flat(deck, r);
      if (!r.text && b.left < 100 && b.top >= 240 && b.width <= 32 && b.height <= 32) flat(deck, r);
      if (r.text && /^\d$/.test(r.text) && b.left < 100) styleText(deck, r, { fontSize: 12, bold: true, color: C.teal });
    }
  }
  if (slideNo === 13) {
    for (const r of recordsOn(records, 13)) {
      const b = bbox(r);
      if (!r.text && b.left === 64 && b.width === 450 && b.top >= 210 && b.top <= 510) flat(deck, r);
      if (!r.text && b.left >= 540 && b.left < 800 && b.height > 100) flat(deck, r);
      if (!r.text && b.left >= 800 && b.height > 300) flat(deck, r);
      if (r.text && b.left < 220 && b.top >= 220 && b.top < 550) styleText(deck, r, { fontSize: 13, bold: true, color: C.teal });
    }
    const modelTitle = lang === "ko" ? "통제된\n시나리오 모델" : "GOVERNED\nSCENARIO MODEL";
    const modelNote = lang === "ko" ? "데이터 계보 + 버전 + 불확실성" : "Lineage + version + uncertainty";
    styleByExact(deck, records, 13, modelTitle, { fontSize: 18, bold: true, color: C.navy, alignment: "center" });
    styleByExact(deck, records, 13, modelNote, { fontSize: 12, bold: true, color: C.teal, alignment: "center" });
  }
  if (slideNo === 15) {
    const section = lang === "ko" ? "확인됨 / 추가 확인" : "CONFIRMED / TO COMPLETE";
    const warning = lang === "ko"
      ? "외부 공유 전 대괄호를 모두 교체합니다. 프로그램 선정은 보험사 연동·인수·심사 또는 미국 성과를 입증하지 않습니다."
      : "Before release: replace all bracketed fields. Program selection does not prove insurer integration, underwriting, adjudication or U.S. outcomes.";
    styleByExact(deck, records, 15, section, { fontSize: 14, bold: true, color: C.teal });
    styleByExact(deck, records, 15, warning, { fontSize: 11, bold: true, color: C.coral });
  }
  const oldTitles = {
    11: lang === "ko" ? "데이터와 책임 구분표" : "Data and Responsibility Matrix",
    12: lang === "ko" ? "Snowflake에 확인할 기술 질문" : "Detailed Snowflake Technical Questions",
    13: lang === "ko" ? "기업별 J-curve 시뮬레이션 - 입력값과 결과" : "Employer J-Curve Simulation - Inputs and Outputs",
    14: lang === "ko" ? "계정 단위 검증 템플릿" : "Self-Funded Employer Dental Account Diligence Template",
    15: lang === "ko" ? "ICLO 소개 - 확인된 내용과 반드시 채울 항목" : "About ICLO - What Is Confirmed and What Must Be Completed",
  };
  setTextByExact(deck, records, slideNo, oldTitles[slideNo], TITLE_COPY[lang][slideNo]);
}

async function build(lang) {
  const starter = path.join(WORK, lang, "template-starter.pptx");
  const deck = await PresentationFile.importPptx(await FileBlob.load(starter));
  const inspection = await deck.inspect({
    kind: "slide,textbox,shape,image,table,notes",
    include: "id,slide,text,textPreview,bbox,rows,cols",
    maxChars: 1000000,
  });
  const records = inspection.ndjson.trim().split("\n").filter(Boolean).map((lineText) => JSON.parse(lineText));

  editCover(deck, records);
  for (let slideNo = 2; slideNo <= 15; slideNo += 1) deSlopHeader(deck, records, slideNo, lang);
  editDecision(deck, records, lang);
  editJourney(deck, records, lang);
  editScope(deck, records, lang);
  editEcosystem(deck, records, lang);
  editArchitecture(deck, records, lang);
  editCurve(deck, records, lang);
  editDashboard(deck, records, lang);
  editRoute(deck, records, lang);
  editTimeline(deck, records, lang);
  for (let slideNo = 11; slideNo <= 15; slideNo += 1) editAppendix(deck, records, slideNo, lang);
  for (const slideNo of [2, 5, 6, 7, 9, 10, 13, 14]) flattenBottomNote(deck, records, slideNo);

  if (lang === "en") {
    for (const slide of deck.slides.items) {
      slide.speakerNotes.clear();
      slide.speakerNotes.setVisible(false);
    }
  }

  const outDir = path.join(OUT, lang === "ko" ? "01_KO_Internal" : "02_EN_External");
  const base = lang === "ko"
    ? "ICLO-Snowflake-Joint-Validation-Proposal-v9-KO-Internal"
    : "ICLO-Snowflake-Joint-Validation-Proposal-v9-EN-External-Notes-Stripped";
  const renderDir = path.join(WORK, lang, "final-render");
  const layoutDir = path.join(WORK, lang, "final-layout");
  await fs.mkdir(outDir, { recursive: true });
  await fs.mkdir(renderDir, { recursive: true });
  await fs.mkdir(layoutDir, { recursive: true });

  for (let index = 0; index < deck.slides.count; index += 1) {
    const slide = deck.slides.getItem(index);
    const n = String(index + 1).padStart(2, "0");
    const png = await deck.export({ slide, format: "png", scale: 2 });
    await fs.writeFile(path.join(renderDir, `slide-${n}.png`), new Uint8Array(await png.arrayBuffer()));
    const layout = await deck.export({ slide, format: "layout" });
    await fs.writeFile(path.join(layoutDir, `slide-${n}.layout.json`), new Uint8Array(await layout.arrayBuffer()));
  }
  const montage = await deck.export({ format: "webp", montage: true, scale: 0.65 });
  await fs.writeFile(path.join(WORK, lang, "final-montage.webp"), new Uint8Array(await montage.arrayBuffer()));
  const finalInspection = await deck.inspect({
    kind: "slide,textbox,shape,image,table,notes,layout",
    include: "id,slide,text,textPreview,bbox,rows,cols",
    maxChars: 1000000,
  });
  await fs.writeFile(path.join(WORK, lang, "final-inspect.ndjson"), finalInspection.ndjson, "utf8");
  const pptx = await PresentationFile.exportPptx(deck);
  await pptx.save(path.join(outDir, `${base}.pptx`));
  console.log(JSON.stringify({ lang, slides: deck.slides.count, output: path.join(outDir, `${base}.pptx`) }));
}

try {
  await build("en");
  await build("ko");
} catch (error) {
  console.error(`BUILD_ERROR: ${error?.message || String(error)}`);
  const stackLines = String(error?.stack || "").split("\n");
  console.error(stackLines.slice(-8).join("\n"));
  process.exitCode = 1;
}
