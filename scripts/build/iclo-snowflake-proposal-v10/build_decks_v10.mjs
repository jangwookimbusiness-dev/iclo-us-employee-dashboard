import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const ROOT = "/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard";
const WORK = path.join(ROOT, "tmp/iclo-snowflake-proposal-v10");
const OUT = path.join(ROOT, "output/proposal-v10");
const DEMO_URL = "jangwookimbusiness-dev.github.io/iclo-us-employee-dashboard";

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
    6: "The Governed Evidence Layer Runs on Snowflake",
    7: "Year One May Cost More",
    8: "What the Buyer Can Verify",
    9: "Route the Existing Support Relationship",
    10: "A 90-Day Validation Plan",
    11: "Data and Responsibility Boundaries",
    12: "Technical Decisions for the Pilot",
    13: "What the Scenario Model Needs",
    14: "Account Evidence Required Before Outreach",
    15: "ICLO: Confirmed and Still to Verify",
  },
  ko: {
    2: "치아보험에서 실제 진료까지 네 가지 판단이 남습니다",
    3: "치아보험 이용을 청구 근거까지 연결합니다",
    4: "이번 PoC는 미국 시장의 한 운영 구조만 검증합니다",
    5: "미국 치아보험은 계약·운영·청구 주체가 다릅니다",
    6: "근거 레이어를 Snowflake 위에서 통제합니다",
    7: "1년차 비용은 오를 수 있습니다",
    8: "기업이 확인해야 할 데이터 기준",
    9: "기존 지원 관계를 미국 HLS 검증으로 연결합니다",
    10: "90일 공동 검증 계획",
    11: "데이터와 책임의 경계",
    12: "파일럿 전에 결정할 기술 사항",
    13: "시나리오 모델의 입력과 출력",
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

// v10 connector language: one plain rule, used everywhere.
// Arrowheads are not available - `connectorHead` is a read-only getter that
// returns null - so rather than mixing drawn arrows with rules, the whole deck
// speaks in rules. It also suits the content: on slide 7 a rule is the only
// honest connector, because the deck refuses to claim a direction there. Where
// direction is real, the labels carry it (DAYS 0-30 -> 31-60 -> 61-90).
function connect(deck, slideNo, { left, top, width = 0, height = 0, color = C.teal, weight = 1.5 }) {
  const s = deck.slides.getItem(slideNo - 1).shapes.add({
    geometry: "line",
    position: { left, top, width, height },
  });
  s.line = { style: "solid", fill: color, width: weight };
  return s;
}

// A filled bar, for the left-edge markers the deck already uses on its cards.
function marker(deck, slideNo, { left, top, width = 3, height, color = C.teal }) {
  const s = deck.slides.getItem(slideNo - 1).shapes.add({
    geometry: "rect", position: { left, top, width, height },
  });
  s.fill = color;
  s.line = line();
  return s;
}

// v10: move a record without touching its text or style.
function moveTo(deck, records, slideNo, text, position) {
  const hit = records.find((r) => r.slide === slideNo && r.text === text);
  if (!hit) throw new Error(`Missing text on slide ${slideNo}: ${text}`);
  shape(deck, hit).position = position;
}

// v10: replace text inside a table cell, located by its current contents.
function setCellByExact(deck, records, slideNo, oldText, newText) {
  for (const r of records.filter((x) => x.slide === slideNo && x.kind === "table")) {
    const table = deck.resolve(r.id);
    for (let row = 0; row < r.rows; row += 1) {
      for (let col = 0; col < r.cols; col += 1) {
        const cell = table.getCell(row, col);
        if (String(cell.text) === oldText) {
          cell.text.set(newText);
          return true;
        }
      }
    }
  }
  throw new Error(`Missing table cell on slide ${slideNo}: ${oldText}`);
}

// v10: slide 2's four-decision model is ICLO's own framing laid over real market
// mechanics. The template inherited a "CONFIRMED MARKET CONTEXT" chip, which
// credits the framing to an external source it does not have.
const CHIP_OVERRIDE = {
  en: { 2: "ICLO FRAMING / U.S. MARKET CONTEXT" },
  ko: { 2: "ICLO 관점 / 미국 시장 맥락" },
};

function deSlopHeader(deck, records, slideNo, lang) {
  if (slideNo === 1) return;
  const rs = recordsOn(records, slideNo);
  const appendix = slideNo >= 11;
  for (const r of rs) {
    const b = bbox(r);
    if (b.top < 58 && b.left < 400 && r.text) {
      const s = flat(deck, r);
      s.text = appendix ? (lang === "ko" ? "부록" : "APPENDIX") : "";
      if (appendix) s.text.style = { fontSize: 17, bold: true, color: C.muted };
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
    const combined = CHIP_OVERRIDE[lang][slideNo] || [...new Set(tagText)].join(" / ");
    s.text = combined;
    s.position = { left: 700, top: 24, width: 516, height: 32 };
    s.text.style = {
      fontSize: 13,
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
        s.position = { left: 64, top: b.top - 6, width: 1152, height: Math.max(34, b.height) };
        s.text.style = {
          fontSize: 17,
          bold: false,
          color: /not |No |아닙|미노출|prerequisite|전제|확인/.test(r.text) ? C.coral : C.teal,
          alignment: "left",
        };
      }
    }
  }
}

function editCover(deck, records, lang) {
  // Removed on request: the program-name / sponsor bracket. It read as an
  // unfinished draft on the very first line. The ask itself survives on slide 15
  // and in the action register, where it is phrased as a request rather than a gap.
  setTextByExact(
    deck,
    records,
    1,
    lang === "ko"
      ? "현재 Snowflake 지원 관계를 구조화된 90일 공동 검증으로 전환하는 제안입니다. [공식 프로그램명·현재 스폰서 확인 필요]"
      : "This proposal converts ICLO's existing Snowflake startup support into a structured 90-day joint validation. [Official program name / current sponsor: confirm]",
    lang === "ko"
      ? "현재 Snowflake 지원 관계를 구조화된 90일 공동 검증으로 전환하는 제안입니다."
      : "This proposal converts ICLO's existing Snowflake startup support into a structured 90-day joint validation.",
  );

  const rs = recordsOn(records, 1);
  for (const r of rs) {
    const b = bbox(r);
    if (!r.text && b.top >= 420 && b.top < 570 && b.height > 80) flat(deck, r);
    if (b.top >= 620 && b.top < 660) {
      const s = flat(deck, r);
      if (r.text) s.text = "";
    }
    if (r.text && b.top >= 440 && b.top < 480) {
      styleText(deck, r, { fontSize: 21, bold: true, color: C.white });
      shape(deck, r).position = { left: b.left, top: 436, width: Math.max(b.width, 300), height: 46 };
    }
    if (r.text && b.top >= 480 && b.top < 550) {
      styleText(deck, r, { fontSize: 17, color: C.coverMuted });
      shape(deck, r).position = { left: b.left, top: 492, width: Math.max(b.width, 300), height: b.height };
    }
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
    if (r.text && b.left < 220 && b.top >= 220 && b.top < 550) styleText(deck, r, { fontSize: 18.5, bold: true, color: C.teal });
    if (r.text && b.left >= 220 && b.left < 520 && b.top >= 220 && b.top < 580) styleText(deck, r, { fontSize: 20, color: C.ink });
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

  hubAndSpoke(deck, records, 2);
}

// Slide 4's evidence row said only "No employee-level PHI", which reads as "none
// exists anywhere". Slide 6 then shows HRIS eligibility and TPA claim lines
// entering Snowflake, so a security reviewer catches the contradiction on the
// next page. Individual-level records must exist - member-months and
// claims-confirmed completion cannot be computed without them. What is
// controlled is who may see them.
function fixPhiScope(deck, records, lang) {
  setCellByExact(deck, records, 4,
    lang === "ko" ? "직원별 PHI 미노출" : "No employee-level PHI",
    lang === "ko" ? "기업 화면에 직원별 PHI 미노출" : "No employee-level PHI in employer views");
}

// Slides 2 and 13 share this layout exactly, down to the coordinates: four rows
// on the left, a hub box in the middle, an outcome list on the right.
//
// Both shipped with a single inbound arrow that started in empty space - it was
// attached to none of the four rows - so it read as a stray mark and the rows
// read as unconnected to the hub. Replaced with a bus: a stub off each row, one
// spine, one line into the box. All four inputs visibly feed the hub, which is
// what both slides are about.
function hubAndSpoke(deck, records, slideNo) {
  const ROWS = [255, 351, 447, 543];
  const SPINE = 524;
  const BOX_LEFT = 558;
  const BOX_MID = 399;
  for (const r of recordsOn(records, slideNo)) {
    const b = bbox(r);
    if (!r.text && b.left >= 520 && b.left < BOX_LEFT && b.top >= 370 && b.top < 405) flat(deck, r);
  }
  for (const y of ROWS) {
    marker(deck, slideNo, { left: 64, top: y - 31, height: 62 });
    connect(deck, slideNo, { left: 500, top: y, width: SPINE - 500 });
  }
  connect(deck, slideNo, { left: SPINE, top: ROWS[0], height: ROWS[3] - ROWS[0] });
  connect(deck, slideNo, { left: SPINE, top: BOX_MID, width: BOX_LEFT - SPINE });
  // Bracket down the outcome list so the single outbound arrow reads as feeding
  // all seven outcomes, not the one bullet it happens to point at.
  connect(deck, slideNo, { left: 816, top: 289, height: 246 });
}

function editJourney(deck, records, lang) {
  const rs = recordsOn(records, 3);
  for (const r of rs) {
    const b = bbox(r);
    if (!r.text && b.top === 230 && b.height === 180) flat(deck, r);
    // v10: b.top guard. Without it this also matched the footer page number "03"
    // and rendered it as "3" while every other slide stayed two-digit.
    if (r.text && /^0[1-4]$/.test(r.text) && b.top < 500) {
      const s = flat(deck, r);
      s.text = String(Number(r.text));
      s.text.style = { fontSize: 18.5, bold: true, color: C.teal };
    }
    if (!r.text && b.top === 455 && b.width > 1000) flat(deck, r);
    if (r.text && (r.text === "SHADOW SIGNAL" || r.text === "섀도 신호")) styleText(deck, r, { fontSize: 18.5, bold: true, color: C.coral });
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
    // v10: the two vertical links down the contracting column were grey-on-white
    // at 1px, so the three boxes read as unrelated. They are the chain the slide
    // is about; give them the connector colour.
    if (!r.text && b.width === 0 && b.height >= 20) { ruleBox(deck, r, C.teal, 1.5); continue; }
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
    // v10: same two vertical links as slide 5, but here the flatten sweep was
    // wiping them out entirely - the raw-image path rendered as three
    // disconnected boxes. Excluded from the sweep and given the connector colour.
    if (!r.text && b.width === 0 && b.height >= 20) { ruleBox(deck, r, C.coral, 1.5); continue; }
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
  styleByExact(deck, records, 6, copy.raw, { fontSize: 18.5, bold: true, color: C.coral });
  styleByExact(deck, records, 6, copy.shadow, { fontSize: 18.5, bold: true, color: C.coral });
  styleByExact(deck, records, 6, copy.structured, { fontSize: 18.5, bold: true, color: C.teal });
  styleByExact(deck, records, 6, copy.canonical, { fontSize: 18.5, bold: true, color: C.teal });
  styleByExact(deck, records, 6, copy.quality, { fontSize: 18.5, bold: true, color: C.teal });
  styleByExact(deck, records, 6, copy.outcome, { fontSize: 18.5, bold: true, color: C.teal });
  styleByExact(deck, records, 6, copy.uri, { fontSize: 18, bold: true, color: C.coral });
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
  styleByExact(deck, records, 7, copy.hypothesis, { fontSize: 18, bold: true, color: C.coral });
  styleByExact(deck, records, 7, copy.low, { fontSize: 18.5, bold: true, color: C.teal, alignment: "center" });
  styleByExact(deck, records, 7, copy.high, { fontSize: 18.5, bold: true, color: C.coral, alignment: "center" });
  styleByExact(
    deck,
    records,
    7,
    lang === "ko" ? "여러 해 가치 관점" : "Multi-year value lens",
    { fontSize: 18, color: C.teal, alignment: "center" },
  );
  styleByExact(
    deck,
    records,
    7,
    lang === "ko" ? "직원 경험 관점" : "Employee experience lens",
    { fontSize: 18, color: C.coral, alignment: "center" },
  );
  for (const r of rs) {
    const b = bbox(r);
    if (!r.text && b.top >= 530 && b.top < 640 && b.width <= 8 && b.height >= 50) {
      const s = shape(deck, r);
      s.fill = C.teal;
      s.line = line();
    }
  }

  // v10: the drawn path used to descend from Year 1 through Years 2-3 into a box
  // captioned "Direction unknown" - the picture asserted the recovery the caption
  // refuses to claim. Rebuilt below as a stepped timeline: it rises into Year 1,
  // which is the slide's claim, and runs level after that, which is all the deck
  // will say. Block positions are set there, in one place.
  // Removed, not flattened to a horizontal: these are connectors whose drawn line
  // ignores the bbox, so resizing them leaves the descent on the slide.
  for (const r of rs) {
    const b = bbox(r);
    const isDescender = !r.text && b.width === 46 && b.left > 400 && b.top >= 300 && b.top < 400;
    if (isDescender) flat(deck, r);
  }

  // v10: LOW/HIGH TURNOVER and the two "lens" labels sat in separate boxes 240px
  // apart, paired only by font color. Merge each pair into one block.
  const pairs = lang === "ko"
    ? [["낮은\n이직률", "낮은 이직률\n여러 해 가치 관점", 236, C.teal], ["높은\n이직률", "높은 이직률\n직원 경험 관점", 344, C.coral]]
    : [["LOW\nTURNOVER", "LOW TURNOVER\nMulti-year value lens", 236, C.teal], ["HIGH\nTURNOVER", "HIGH TURNOVER\nEmployee experience lens", 344, C.coral]];
  for (const [oldText, newText, top, color] of pairs) {
    moveTo(deck, records, 7, oldText, { left: 1046, top, width: 170, height: 86 });
    setTextByExact(deck, records, 7, oldText, newText);
    styleByExact(deck, records, 7, oldText, { fontSize: 18, bold: true, color, alignment: "center" });
  }
  for (const stale of lang === "ko" ? ["여러 해 가치 관점", "직원 경험 관점"] : ["Multi-year value lens", "Employee experience lens"]) {
    setTextByExact(deck, records, 7, stale, "");
  }

  // Rebuilt as one drawn path instead of four floating blocks. The step up into
  // Year 1 stays - that IS the slide's claim, and the title says it - and the
  // path then runs flat through Years 2-3 to Validate, because after year one
  // the deck claims nothing. Stops sit on the path so it reads as a timeline
  // rather than a chart with a hidden y-axis.
  const RAIL = 300;
  const BASE_Y = 366;
  const STEP_X = 250;
  flat(deck, at7(records, [244, 307, 46, 74]));            // old rising arrow
  // Drawn as a step rather than a diagonal: horizontal and vertical segments
  // have unambiguous geometry, while a diagonal line shape depends on a flip
  // flag this API does not expose.
  connect(deck, 7, { left: 170, top: BASE_Y, width: STEP_X - 170 });
  const riser = deck.slides.getItem(6).shapes.add({
    geometry: "line", position: { left: STEP_X, top: RAIL, width: 0, height: BASE_Y - RAIL },
  });
  riser.line = { style: "solid", fill: C.teal, width: 1.5 };
  connect(deck, 7, { left: STEP_X, top: RAIL, width: 1046 - STEP_X });
  for (const [cx, cy] of [[170, BASE_Y], [414, RAIL], [707, RAIL], [968, RAIL]]) {
    const dot = deck.slides.getItem(6).shapes.add({
      geometry: "ellipse", position: { left: cx - 5, top: cy - 5, width: 10, height: 10 },
    });
    dot.fill = C.teal;
    dot.line = line();
  }

  const rows = lang === "ko"
    ? [["기준", 326, 152, 25], ["플랜 연도 시작", 382, 152, 28], ["1년차", 252, 220, 25],
       ["예방 이용 증가\n미치료 상태 발견", 316, 220, 74], ["2-3년차", 252, 218, 25],
       ["치료 구성 + 청구 지연\n측정 가능", 316, 218, 62], ["검증", 252, 156, 25], ["방향 미확정", 316, 156, 44]]
    : [["Baseline", 326, 152, 25], ["Plan-year start", 382, 152, 28], ["Year 1", 252, 220, 25],
       ["Preventive use rises\nNew treatment is discovered", 316, 220, 74], ["Years 2-3", 252, 218, 25],
       ["Treatment mix + run-out\nbecome measurable", 316, 218, 62], ["Validate", 252, 156, 25],
       ["Direction unknown", 316, 156, 44]];
  const lefts = [78, 78, 304, 304, 598, 598, 890, 890];
  rows.forEach(([text, top, width, height], i) => {
    moveTo(deck, records, 7, text, { left: lefts[i], top, width, height });
  });

  // Close the dead band the shortened diagram left between it and the three
  // principle cards.
  for (const r of rs) {
    const b = bbox(r);
    if (b.top >= 548 && b.top < 640) {
      shape(deck, r).position = { left: b.left, top: b.top - 46, width: b.width, height: b.height };
    }
  }
}

function at7(records, bbox) {
  const hit = records.find((r) => r.slide === 7 && !r.text
    && Array.isArray(r.bbox) && r.bbox.join(",") === bbox.join(","));
  if (!hit) throw new Error(`slide 7: no shape at ${bbox.join(",")}`);
  return hit;
}

async function editDashboard(deck, records, lang) {
  setTextByExact(
    deck,
    records,
    8,
    lang === "ko" ? "대시보드는 성과보다 데이터 기준과 프라이버시를 먼저 보여줍니다" : "The Dashboard Makes Data Quality and Privacy Visible",
    TITLE_COPY[lang][8],
  );

  // v10: the English subhead was 132 chars in a 52px box; the second line wrapped
  // out of the box and the section rule at y=177 struck through it. Shortened to
  // one line rather than moving a rule the whole template shares.
  if (lang === "en") {
    setTextByExact(
      deck,
      records,
      8,
      "This is not a performance claim. It shows the denominator, freshness, claims lag, completeness and privacy rules behind each result.",
      "Not a performance claim: the denominator, freshness, claims lag and privacy rules stay visible.",
    );
  }

  // v10: the four caption rails were coral / navy / sky / teal with no semantic
  // difference between them - the exact rainbow the de-slop pass removed elsewhere.
  const captions = lang === "ko"
    ? ["합성 데이터", "기준 집단", "최신성", "프라이버시"]
    : ["SYNTHETIC", "DENOMINATOR", "FRESHNESS", "PRIVACY"];
  const rail = [...captions, lang === "ko" ? "데모" : "LIVE DEMO"];
  for (const caption of rail) styleByExact(deck, records, 8, caption, { fontSize: 18, bold: true, color: C.navy });
  for (const r of recordsOn(records, 8)) {
    const b = bbox(r);
    if (!r.text && b.top === 594 && b.width === 4 && b.height === 54) {
      const s = shape(deck, r);
      s.fill = C.teal;
      s.line = line();
    }
  }

  // v10: the shipped screenshot was captured against a viewport narrower than the
  // dashboard, so its own right edge cut "completeness 98.4% (synthetic" and the
  // "Synthetic data" mark. Re-captured after fixing the .wrap padding override in
  // index.html; frame resized to the new aspect and centered above the caption rail.
  const shot = records.find((r) => r.slide === 8 && r.kind === "image" && bbox(r).width > 1000);
  if (!shot) throw new Error("Missing slide 8 dashboard image");
  const img = deck.resolve(shot.id);
  await img.replace(await FileBlob.load(path.join(WORK, "dashboard-overview-v10.png")));
  img.position = { left: 120, top: 205, width: 1040, height: 361 };

  // v10: the QR was unlabelled and unclickable in the forwarded PDF. Show the URL.
  const demoLabel = lang === "ko" ? "합성 데이터 대시보드" : "Synthetic dashboard";
  moveTo(deck, records, 8, demoLabel, { left: 620, top: 654, width: 596, height: 20 });
  setTextByExact(deck, records, 8, demoLabel, `${demoLabel} · ${DEMO_URL}`);
  styleByExact(deck, records, 8, demoLabel, { fontSize: 12, color: C.muted, alignment: "right" });
}

// Trim the longest strings in the deck. Everything here says the same thing in
// fewer words; nothing is dropped. Shorter copy is what buys the larger type on
// fixed-size boxes.
function shortenCopy(deck, records, lang) {
  const EN = [
    [12, "Given ICLO's current Snowflake status [account / cloud / region / credits: confirm], what is the practical U.S. Business Critical and BAA path?",
         "What is the practical U.S. Business Critical and BAA path for ICLO's current Snowflake account?"],
    [12, "What tenancy, purpose-access, masking, row-policy and access-history pattern do you recommend?",
         "What tenancy, masking, row-policy and access-history pattern do you recommend?"],
    [12, "Does this mean true local training and parameter aggregation, or collaborative ML inside a Clean Room, Native App or customer-account execution pattern?",
         "True local training with parameter aggregation, or collaborative ML in a Clean Room, Native App or customer account?"],
    [12, "When does customer-account execution create repeatability beyond a connector pattern?",
         "When does customer-account execution beat a connector pattern?"],
    [12, "What real multi-party payer / TPA / employer collaboration would justify it?",
         "Which multi-party payer / TPA / employer collaboration justifies it?"],
    [5, "Defines funding, network, benefit rules, data rights and reporting terms",
        "Sets funding, network, benefit rules and data rights"],
    [6, "URI + metadata + model version + approved derived signal only",
        "No image binaries. Person-linked references and signals do enter"],
    [6, "experiment assignment + claims-confirmed outcomes",
        "claims-confirmed outcomes (arm assignment pending legal + protocol sign-off)"],
    [8, "Aggregate · n ≥ 20 · no PHI",
        "Aggregate only · min cell by distinct person · employer isolation"],
    [3, "Concern + benefit understanding\nOptional oral-image capture",
        "Concern + benefit understanding\nOptional oral image"],
  ];
  const KO = [
    [12, "ICLO 의 현재 Snowflake 상태 [ 계정 · 클라우드 · 리전 · 크레딧 확인 필요 ] 를 기준으로 미국 Business Critical·BAA 경로를 어떻게 정할 것인가 ?",
         "ICLO의 현재 Snowflake 계정 기준으로 미국 Business Critical·BAA 경로를 어떻게 정하는가?"],
    [12, "테넌시 , 목적별 접근 , 마스킹 , 행 정책 , 접근 기록을 어떻게 설계하는가 ?",
         "테넌시·마스킹·행 정책·접근 기록을 어떻게 설계하는가?"],
    [5, "비용 구조 , 네트워크 , 혜택 규칙 , 데이터 권리와 보고 범위를 정합니다 .",
        "비용 구조·네트워크·혜택 규칙·데이터 권리를 정합니다."],
    [6, "URI + 메타데이터 + 모델 버전 + 승인된 파생 신호만",
        "사진 바이너리는 안 들어감. 사람·기업에 연결된 참조와 신호는 들어감"],
    [6, "실험군 배정 + 청구로 확인한 결과",
        "청구로 확인한 결과 (실험군 배정은 법무·프로토콜 승인 후)"],
    [8, "집계만 · n ≥ 20 · 개인정보 없음",
        "집계 전용 · 최소 셀은 고유 인물 기준 · 기업 격리"],
  ];
  for (const [slideNo, oldText, newText] of lang === "ko" ? KO : EN) {
    const hit = records.find((r) => r.slide === slideNo && r.text === oldText);
    if (hit) shape(deck, hit).text = newText;   // template wording drifts by language
  }
  sweepTerminology(deck, records, lang);
}

// Whole-deck terminology sweep. The exact-match pairs above only reach strings
// somebody thought to list; this catches the rest. In self-funded dental the
// employer carries the claims cost, so "보험자 지급" (the carrier paid it) is
// simply wrong wherever it appears. The EN starter already says "plan-paid".
// Canon: contracts/proposal-package-v11.yml -> terminology.forbidden
const TERM_SWEEP = {
  ko: [["보험자 지급", "플랜 지급"], ["보험사가 지급", "플랜이 지급"]],
  en: [["insurer-paid", "plan-paid"], ["carrier-paid", "plan-paid"]],
};

function sweepTerminology(deck, records, lang) {
  const rules = TERM_SWEEP[lang] ?? [];
  if (!rules.length) return;
  const swap = (s) => rules.reduce((acc, [a, b]) => acc.split(a).join(b), s);

  for (const r of records) {
    if (r.kind === "table") {
      const table = deck.resolve(r.id);
      for (let row = 0; row < r.rows; row += 1) {
        for (let col = 0; col < r.cols; col += 1) {
          const cell = table.getCell(row, col);
          const before = String(cell.text);
          const after = swap(before);
          if (after !== before) cell.text.set(after);
        }
      }
    } else if (r.text) {
      const after = swap(r.text);
      if (after !== r.text) shape(deck, r).text = after;
    }
  }
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
        s.position = { left: 92, top: b.top, width: 92, height: b.height };
        s.text.style = { fontSize: 17, bold: true, color: C.teal };
      } else {
        s.text = "";
      }
    }
    if (r.text && labels.has(r.text)) {
      const s = styleText(deck, r, { fontSize: 18.5, bold: true, color: C.ink });
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
      s.position = { left: 64, top: 516, width: 1152, height: 96 };
      s.text.style = { fontSize: 18, color: C.muted, alignment: "left" };
    }
  }
  setTextByExact(
    deck,
    records,
    10,
    lang === "ko" ? "Snowflake와 ICLO의 역할·게이트·산출물을 90일 안에 명확히 합니다" : "A 90-Day Validation with Explicit Owners, Gates and Outputs",
    TITLE_COPY[lang][10],
  );

  // v10: "employers × member-months × refresh frequency → annual credits" reads as
  // a credit model but omits warehouse size, runtime, concurrency and volume. A
  // Snowflake SE stops on that arrow. State it as sizing inputs, not an equation.
  setTextByExact(
    deck,
    records,
    10,
    lang === "ko"
      ? "운영 방식 · ICLO가 주간 서면 현황과 단일 의사결정 기록을 관리합니다.\n사용량 산정 · 기업 수 × 가입자-월 × 수집·변환·결과 갱신 빈도 → 연간 크레딧[사이징 세션에서 산정]."
      : "OPERATING MODEL · ICLO runs weekly written status and one decision log.\nCONSUMPTION MODEL · employers × member-months × ingestion / transform / outcome-refresh frequency → annual credits [estimate in sizing session].",
    lang === "ko"
      ? "운영 방식 · ICLO가 주간 서면 현황과 단일 의사결정 기록을 관리합니다.\n사용량 산정 · 기업 수, 가입자-월, 수집·변환·결과 갱신 빈도, 데이터 규모, 웨어하우스 크기와 실행 시간을 입력값으로 제공하고, Snowflake SE가 Day 30 사이징 세션에서 연간 크레딧을 산정합니다."
      : "OPERATING MODEL · ICLO runs weekly written status and one decision log.\nCONSUMPTION MODEL · ICLO supplies the sizing inputs (employers, member-months, ingestion / transform / outcome-refresh frequency, data volume, warehouse size and runtime); the Snowflake SE calculates annual credits in the Day-30 sizing session.",
  );


  for (const r of rs) {
    const b = bbox(r);
    if (!r.text) continue;
    if (b.top >= 220 && b.top < 246) {
      styleText(deck, r, {
        fontSize: 17,
        bold: true,
        color: /CONDITIONAL|조건부/.test(r.text) ? C.muted : C.teal,
      });
    }
    if (b.top >= 246 && b.top < 278) {
      styleText(deck, r, { fontSize: 22, bold: true, color: C.navy });
    }
    // This is the densest slide in the deck: four columns 216 units wide, each
    // holding two bodies and a gate line inside a 260-unit band. At the deck's
    // standard body size the columns collide, so the bodies sit one step down
    // and the whole column is re-spaced to match.
    if (b.top >= 298 && b.top < 356) {
      styleText(deck, r, { fontSize: 15, color: C.muted });
    }
    if (b.top >= 378 && b.top < 416) {
      styleText(deck, r, { fontSize: 15, color: C.muted });
    }
    if (r.text === "SNOWFLAKE") styleText(deck, r, { fontSize: 16.5, bold: true, color: C.teal });
    if (r.text === "ICLO") styleText(deck, r, { fontSize: 16.5, bold: true, color: C.navy });
    if (/^GATE|^게이트/.test(r.text)) styleText(deck, r, { fontSize: 14, bold: true, color: C.navy });
    if (/^TRIGGER|^발동 조건/.test(r.text)) styleText(deck, r, { fontSize: 14, bold: true, color: C.coral });
  }

  // The template already carries phase connectors at x=316/607/898 but with no
  // stroke, so a four-phase timeline rendered as four unlinked columns. Give
  // them a stroke and an arrowhead - phases genuinely run in sequence. The last
  // one is muted: EXPAND is conditional, not the next step.
  for (const r of rs) {
    const b = bbox(r);
    if (!r.text && b.top === 338 && b.height === 0 && b.width === 39) {
      const s = shape(deck, r);
      s.line = { style: "solid", fill: b.left > 850 ? C.muted : C.teal, width: 1.5 };
    }
  }

  // Re-space each column for the larger type. Original tops map to new
  // top/height pairs; the band runs 218-480, stopping clear of the operating
  // model note at 500.
  const LANE = { 226: [220, 18], 248: [240, 30], 282: [274, 18], 302: [294, 76],
                 362: [376, 18], 383: [396, 50], 419: [446, 54] };
  for (const r of rs) {
    const b = bbox(r);
    const slot = LANE[b.top];
    if (slot && r.text) shape(deck, r).position = { left: b.left, top: slot[0], width: b.width, height: slot[1] };
    if (!r.text && b.top === 357 && b.height === 1) {
      shape(deck, r).position = { left: b.left, top: 370, width: b.width, height: 1 };
    }
  }
}

function editAppendix(deck, records, slideNo, lang) {
  if (slideNo === 12 || slideNo === 15) {
    for (const r of recordsOn(records, slideNo)) {
      const b = bbox(r);
      if (!r.text && b.left >= 640 && b.top >= 190 && b.height > 300) flat(deck, r);
      if (!r.text && b.left < 100 && b.top >= 240 && b.width <= 32 && b.height <= 32) flat(deck, r);
      if (r.text && /^\d$/.test(r.text) && b.left < 100) styleText(deck, r, { fontSize: 18, bold: true, color: C.teal });
    }
  }
  if (slideNo === 13) {
    for (const r of recordsOn(records, 13)) {
      const b = bbox(r);
      if (!r.text && b.left === 64 && b.width === 450 && b.top >= 210 && b.top <= 510) flat(deck, r);
      // Not the hub panel: the bus now converges on it, so it has to be a
      // visible object. Slide 2 keeps its equivalent panel and the two slides
      // share this layout exactly.
      const isHub = b.left === 558 && b.top === 326;
      if (!r.text && !isHub && b.left >= 540 && b.left < 800 && b.height > 100) flat(deck, r);
      if (!r.text && b.left >= 800 && b.height > 300) flat(deck, r);
      if (r.text && b.left < 220 && b.top >= 220 && b.top < 550) styleText(deck, r, { fontSize: 18.5, bold: true, color: C.teal });
    }
    const modelTitle = lang === "ko" ? "통제된\n시나리오 모델" : "GOVERNED\nSCENARIO MODEL";
    const modelNote = lang === "ko" ? "데이터 계보 + 버전 + 불확실성" : "Lineage + version + uncertainty";
    // Both were set for a flattened, white panel. The hub is dark again, so the
    // title has to invert; the note matches slide 2's sub-line treatment.
    styleByExact(deck, records, 13, modelTitle, { fontSize: 19, bold: true, color: C.white, alignment: "center" });
    moveTo(deck, records, 13, modelTitle, { left: 570, top: 344, width: 190, height: 62 });
    styleByExact(deck, records, 13, modelNote, { fontSize: 13, color: C.coverMuted, alignment: "center" });
    moveTo(deck, records, 13, modelNote, { left: 570, top: 414, width: 190, height: 42 });
    // Wrapped to two lines in a 28px box and swallowed the next bullet's dot.
    if (lang === "en") {
      setTextByExact(deck, records, 13, "Allowed / plan-paid / employee OOP separation",
        "Allowed / plan-paid / OOP separation");
    }
    hubAndSpoke(deck, records, 13);
  }
  // v10: a platform supplies controls; ICLO and the customer set the purposes.
  if (slideNo === 11) {
    setCellByExact(
      deck,
      records,
      11,
      lang === "ko" ? "이용 기록을 목적별 관리" : "Govern event data by purpose",
      lang === "ko" ? "이용 기록에 목적별 접근 통제 적용" : "Enforce purpose-based access on event data",
    );
  }
  if (slideNo === 15) {
    const section = lang === "ko" ? "확인됨 / 추가 확인" : "CONFIRMED / TO COMPLETE";
    const warning = lang === "ko"
      ? "외부 공유 전 대괄호를 모두 교체합니다. 프로그램 선정은 보험사 연동·인수·심사 또는 미국 성과를 입증하지 않습니다."
      : "Before release: replace all bracketed fields. Program selection does not prove insurer integration, underwriting, adjudication or U.S. outcomes.";

    // v10: the closing external slide carried five editor's brackets, so it read as
    // an unfinished draft. Two of those fields are the ask itself - only Snowflake
    // can supply them - and one is ICLO's own company record. Say which is which.
    const rewrites = lang === "ko"
      ? [
        ["회사\n[법인명·본사·사업 단계·핵심 인력 수: 외부 공유 전 확인]", "회사\n주식회사 아이클로 (ICLO Co., Ltd.) · 제주 · 국내 B2C·B2B 상용화 단계 · 핵심 인력 12명"],
        ["SNOWFLAKE 상태\n[현재 계정·클라우드·리전·크레딧·지원 담당자: 확인]", "SNOWFLAKE 상태\nSnowflake와 함께 확인: 계정 · 클라우드 · 리전 · 크레딧 · 지원 담당자"],
        ["[Snowflake 공식 프로그램명과 현재 스폰서: 확인]", "이번 회의에서 Snowflake에 요청: 공식 프로그램명과 현재 스폰서"],
        ["[계정·클라우드·리전·크레딧·사용량·지원 담당자: 확인]", "이번 회의에서 Snowflake에 요청: 계정 · 클라우드 · 리전 · 크레딧 · 사용량 · 기술지원 담당자"],
        [warning, "Snowflake 행은 이번 회의의 요청 사항입니다. 국내 상용화 단계와 프로그램 선정은 보험사 연동·인수·심사 또는 미국 성과를 입증하지 않습니다."],
      ]
      : [
        ["COMPANY\n[Legal entity · HQ · stage · team size: confirm before release]", "COMPANY\nICLO Co., Ltd. · Jeju, Republic of Korea · Commercial in the Korean market, B2C and B2B · 12 core team"],
        ["SNOWFLAKE STATUS\n[Current account · cloud · region · credits · support owner: confirm]", "SNOWFLAKE STATUS\nTo confirm with Snowflake: account · cloud · region · credits · support owner"],
        ["[Official Snowflake program name and current sponsor: confirm]", "Requested from Snowflake in this meeting: official program name and current sponsor"],
        ["[Account, cloud, region, credits, usage and support owner: confirm]", "Requested from Snowflake in this meeting: account, cloud, region, credits, usage and technical-support owner"],
        [warning, "The Snowflake row is the ask in this meeting. Korean commercial stage and program selection do not prove insurer integration, underwriting, adjudication or U.S. outcomes."],
      ];

    // The right column restated the left one row for row: PROGRAMS/CONFIRMED
    // said the same thing, and SNOWFLAKE STATUS/CURRENT STATE listed the same
    // fields twice over. Dropped. Each left row already carries its own status
    // inline, and row 4 absorbs the relationship ask so nothing is lost.
    rewrites[1][1] = lang === "ko"
      ? "SNOWFLAKE 상태\nSnowflake와 함께 확인: 공식 프로그램명 · 스폰서 · 계정 · 클라우드 · 리전 · 크레딧 · 지원 담당자"
      : "SNOWFLAKE STATUS\nTo confirm with Snowflake: official program name, sponsor, account, cloud, region, credits and support owner";
    for (const [oldText, newText] of rewrites) setTextByExact(deck, records, 15, oldText, newText);

    for (const r of recordsOn(records, 15)) {
      const b = bbox(r);
      if (b.left >= 680 && b.top >= 200 && b.top < 560 && r.text !== warning) {
        const s = flat(deck, r);
        if (r.text) s.text = "";
      }
      if (r.text && b.left === 108) shape(deck, r).position = { left: 108, top: b.top, width: 1000, height: b.height };
    }
    moveTo(deck, records, 15, warning, { left: 108, top: 606, width: 1000, height: 44 });
    styleByExact(deck, records, 15, warning, { fontSize: 17, bold: true, color: C.coral });
    styleByExact(deck, records, 15, section, { fontSize: 19.5, bold: true, color: C.teal });
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

// v10: slide 14 shipped as two empty tables with two different header colors and
// no statement that it is a blank template. Runs after flattenBottomNote so the
// note keeps the room the longer sentence needs.
function editDiligence(deck, records, lang) {
  for (const label of lang === "ko" ? ["계정 정보 + 데이터", "사업 + 기술 준비도"] : ["ACCOUNT IDENTITY + DATA", "COMMERCIAL + TECHNICAL READINESS"]) {
    // "COMMERCIAL + TECHNICAL READINESS" no longer fits its 360-unit box at
    // the larger size and was losing its last word.
    styleByExact(deck, records, 14, label, { fontSize: 16, bold: true, color: C.teal });
    moveTo(deck, records, 14, label, { left: 64, top: label === "ACCOUNT IDENTITY + DATA" || label === "계정 정보 + 데이터" ? 205 : 438, width: 620, height: 26 });
  }
  for (const r of records.filter((x) => x.slide === 14 && x.kind === "table")) {
    const table = deck.resolve(r.id);
    for (let col = 0; col < r.cols; col += 1) {
      const cell = table.getCell(0, col);
      cell.fill = C.teal;
      // typeface pinned: the inherited header font fell back to a narrower face
      // than the rest of the deck.
      cell.text.style = { color: C.white, bold: true, fontSize: 17, typeface: "Arial" };
    }
  }
  const oldNote = lang === "ko"
    ? "이 표에 계정 근거가 채워지기 전에는 'Snowflake 고객인 TPA가 많다'고 말하지 않습니다."
    : "No statement that 'many TPAs are on Snowflake' should be used before this matrix contains account evidence.";
  const newNote = lang === "ko"
    ? "빈 템플릿입니다. 계정팀과 함께 채웁니다. 이 표에 계정 근거가 채워지기 전에는 'Snowflake 고객인 TPA가 많다'고 말하지 않습니다."
    : "Blank template, to be completed with the account team. No statement that 'many TPAs are on Snowflake' should be used before this matrix contains account evidence.";
  setTextByExact(deck, records, 14, oldNote, newNote);
  moveTo(deck, records, 14, oldNote, { left: 64, top: 634, width: 1152, height: 38 });
}

// The three table slides carry the deck's densest text and inherited the
// template's cell font, which rendered around 8pt on a 13.3in slide. Nothing in
// the script touched it, so it escaped the size pass. Header rows stay a step
// down from body so the hierarchy survives the bump.
function enlargeTables(deck, records, slideNos) {
  for (const slideNo of slideNos) {
    for (const r of records.filter((x) => x.slide === slideNo && x.kind === "table")) {
      const table = deck.resolve(r.id);
      for (let row = 0; row < r.rows; row += 1) {
        for (let col = 0; col < r.cols; col += 1) {
          table.getCell(row, col).text.style = row === 0
            ? { fontSize: 17.5, bold: true }
            : { fontSize: 18 };
        }
      }
    }
  }
}

// Slide 10 packed a four-phase timeline into four 216-unit columns, which is
// why it was the one slide whose body type had to stay a size down. Split into
// two slides of two phases each, every column roughly doubles in width and the
// deck can use one type size throughout.
async function splitTimeline(deck, lang) {
  const src = deck.slides.getItem(9);
  const dup = src.duplicate();
  dup.moveTo(10);                                  // sits immediately after slide 10

  const look = async () => (await deck.inspect({ kind: "slide,textbox,shape,image", include: "id,slide,text,bbox", maxChars: 1000000 }))
    .ndjson.trim().split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
  const COL = [64, 355, 646, 937];                 // phase panel lefts
  const NEW = [64, 646];                           // two columns per slide now

  // One slide at a time, each against a fresh inspection. Sharing a single
  // snapshot across both halves let the second pass resolve shapes the first
  // pass had already moved, and the untouched thin shapes on slide 10 vanished.
  for (const [slideNo, keep] of [[11, [2, 3]], [10, [0, 1]]]) {
    for (const r of (await look()).filter((x) => x.slide === slideNo && ["textbox", "shape"].includes(x.kind))) {
      const b = bbox(r);
      if (b.top < 200 || b.top > 470) continue;    // header, footer and the model note stay put
      const col = COL.findIndex((x, i) => b.left >= x - 2 && b.left < (COL[i + 1] ?? 1e4) - 2);
      if (col < 0) continue;
      const s2 = deck.resolve(r.id);
      const slot = keep.indexOf(col);
      if (slot < 0) {                              // phase belongs to the other slide
        s2.fill = "none";
        s2.line = line();
        if (r.text) s2.text = "";
        s2.position = { left: -200, top: 900, width: 1, height: 1 };
        continue;
      }
      const isConnector = !r.text && b.height === 0 && b.width === 39;
      // Hairlines are redrawn below rather than carried across. Duplication
      // preserved their geometry but not their paint, and restating fill and
      // stroke on the inherited shapes did not bring them back on both halves.
      const isHairline = !r.text && b.height <= 1 && b.width > 20;
      if (isHairline) {
        s2.line = line();
        s2.fill = "none";
        s2.position = { left: -200, top: 900, width: 1, height: 1 };
        continue;
      }
      s2.position = { left: NEW[slot] + (b.left - COL[col]), top: b.top, width: Math.min(b.width * 2 + 40, 490), height: b.height };
    }
  }

  // Redrawn fresh so both halves are identical: one divider per column between
  // the Snowflake and ICLO blocks, and one connector between the two columns.
  for (const slideNo of [10, 11]) {
    for (const left of NEW) connect(deck, slideNo, { left, top: 370, width: 472, color: C.rule, weight: 1 });
    connect(deck, slideNo, { left: 566, top: 338, width: 56 });
  }

  const recs = await look();
  // Titles carry the halves, and the operating-model note belongs with the end.
  const title = (n) => recs.find((r) => r.slide === n && r.bbox && r.bbox[1] === 62 && r.text);
  const sub = (n) => recs.find((r) => r.slide === n && r.bbox && r.bbox[1] === 121 && r.text);
  deck.resolve(title(10).id).text = lang === "ko" ? "90일 공동 검증 계획 · 라우팅과 설계" : "A 90-Day Validation Plan · Route and Design";
  deck.resolve(title(11).id).text = lang === "ko" ? "90일 공동 검증 계획 · 검증과 확장" : "A 90-Day Validation Plan · Validate and Expand";
  deck.resolve(sub(10).id).text = lang === "ko"
    ? "Step 0부터 60일까지: 담당을 확정하고 아키텍처를 설계합니다."
    : "Step 0 through Day 60: name the owners, then design the architecture.";
  deck.resolve(sub(11).id).text = lang === "ko"
    ? "61일부터 90일까지, 그리고 조건부 확장입니다. ICLO가 케이던스와 의사결정 기록을 맡습니다."
    : "Day 61 to Day 90, plus conditional expansion. ICLO owns the cadence and decision log.";
  const note10 = recs.find((r) => r.slide === 10 && /^(OPERATING MODEL|운영 방식)/.test(r.text || ""));
  if (!note10) throw new Error("slide 10: operating-model note not found");
  deck.resolve(note10.id).text = "";

  // Footer page numbers: the insert pushed every later slide up by one.
  for (const r of recs.filter((x) => x.bbox && x.bbox[1] === 687 && x.bbox[0] === 1168 && x.text)) {
    deck.resolve(r.id).text = String(r.slide).padStart(2, "0");
  }
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

  editCover(deck, records, lang);
  for (let slideNo = 2; slideNo <= 15; slideNo += 1) deSlopHeader(deck, records, slideNo, lang);
  editDecision(deck, records, lang);
  editJourney(deck, records, lang);
  editScope(deck, records, lang);
  fixPhiScope(deck, records, lang);
  editEcosystem(deck, records, lang);
  editArchitecture(deck, records, lang);
  editCurve(deck, records, lang);
  await editDashboard(deck, records, lang);
  shortenCopy(deck, records, lang);
  editRoute(deck, records, lang);
  editTimeline(deck, records, lang);
  for (let slideNo = 11; slideNo <= 15; slideNo += 1) editAppendix(deck, records, slideNo, lang);
  for (const slideNo of [2, 5, 6, 7, 9, 10, 13, 14]) flattenBottomNote(deck, records, slideNo);
  enlargeTables(deck, records, [4, 11, 14]);
  editDiligence(deck, records, lang);

  if (lang === "en") {
    for (const slide of deck.slides.items) {
      slide.speakerNotes.clear();
      slide.speakerNotes.setVisible(false);
    }
  }

  const outDir = path.join(OUT, lang === "ko" ? "01_KO_Internal" : "02_EN_External");
  const base = lang === "ko"
    ? "ICLO-Snowflake-Joint-Validation-Proposal-v10-KO-Internal"
    : "ICLO-Snowflake-Joint-Validation-Proposal-v10-EN-External-Notes-Stripped";
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
  await splitTimeline(deck, lang);

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

// 빌드 끝단 정합성 검사 — 정본은 contracts/proposal-package-v11.yml
{
  const { spawnSync } = await import("node:child_process");
  const repo = path.resolve(new URL(".", import.meta.url).pathname, "../..");
  const r = spawnSync("python3", [path.join(repo, "scripts/check-package-consistency.py")],
                      { cwd: repo, stdio: "inherit" });
  if (r.status !== 0) process.exitCode = r.status;
}
