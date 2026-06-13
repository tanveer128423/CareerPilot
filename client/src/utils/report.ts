import type { AnalysisResult } from "../types";
import { readinessLabel, scoreColor } from "./format";

/**
 * Build a branded, print-optimized one-page HTML report and open it in a new
 * window with the print dialog (the user saves as PDF). Dependency-free — uses
 * the browser's native "Save as PDF" so there's nothing to bundle or break.
 */
export function openPrintableReport(a: AnalysisResult): void {
  const html = buildReportHtml(a);
  const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=1000");
  if (!win) {
    // Pop-up blocked — fall back to a downloadable .html file.
    downloadHtml(html);
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  // Give the browser a tick to lay out before invoking print.
  win.addEventListener("load", () => {
    win.focus();
    win.print();
  });
}

function downloadHtml(html: string): void {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "careerpilot-readiness-report.html";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function gaugeSvg(score: number): string {
  const size = 150;
  const stroke = 13;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.max(0, Math.min(100, score)) / 100) * c;
  const color = scoreColor(score);
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <g transform="rotate(-90 ${size / 2} ${size / 2})">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#EEEEF2" stroke-width="${stroke}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${offset}"/>
    </g>
    <text x="50%" y="48%" text-anchor="middle" font-size="38" font-weight="700" fill="${color}"
      font-family="ui-monospace, Menlo, monospace">${score}</text>
    <text x="50%" y="64%" text-anchor="middle" font-size="11" fill="#6B7280">${esc(readinessLabel(score))}</text>
  </svg>`;
}

function chips(items: string[], kind: "have" | "missing"): string {
  if (!items.length) {
    return `<span style="color:#16A34A;font-size:13px;">All required skills covered ✓</span>`;
  }
  const bg = kind === "have" ? "#EAF7EE" : "#FDECEC";
  const fg = kind === "have" ? "#16A34A" : "#DC2626";
  const mark = kind === "have" ? "✓" : "•";
  return items
    .map(
      (s) =>
        `<span style="display:inline-block;background:${bg};color:${fg};padding:3px 9px;border-radius:999px;font-size:12px;font-weight:600;margin:0 5px 5px 0;">${mark} ${esc(
          s,
        )}</span>`,
    )
    .join("");
}

function buildReportHtml(a: AnalysisResult): string {
  const { matchObject: m, readiness: r, resumeHealth: h, roadmap, targetRole } = a;
  const date = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const roadmapRows = roadmap.length
    ? roadmap
        .map(
          (mi) => `
        <tr>
          <td style="padding:7px 10px;font-weight:600;color:#4F46E5;white-space:nowrap;vertical-align:top;">${esc(
            mi.phase,
          )}</td>
          <td style="padding:7px 10px;vertical-align:top;">
            <strong>${esc(mi.skill)}</strong><br/>
            <span style="color:#4B5563;font-size:12px;">${esc(mi.project)} · ${esc(mi.resource)}</span>
          </td>
        </tr>`,
        )
        .join("")
    : `<tr><td colspan="2" style="padding:10px;color:#16A34A;">No roadmap needed — focus on interview prep.</td></tr>`;

  const nextActions = r.nextActions.length
    ? `<ul style="margin:6px 0 0;padding-left:18px;color:#374151;font-size:13px;">${r.nextActions
        .map((s) => `<li style="margin-bottom:3px;">${esc(s)}</li>`)
        .join("")}</ul>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>CareerPilot — Readiness Report</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color:#111827; margin:0; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid transparent;
    border-image: linear-gradient(90deg,#6366F1,#8B5CF6,#EC4899) 1; padding-bottom:12px; margin-bottom:18px; }
  .brand { font-size:20px; font-weight:800; background:linear-gradient(90deg,#6366F1,#EC4899); -webkit-background-clip:text;
    background-clip:text; color:transparent; }
  .tag { font-size:11px; color:#6B7280; letter-spacing:.04em; text-transform:uppercase; }
  .top { display:flex; gap:24px; align-items:center; margin-bottom:18px; }
  .meta { flex:1; }
  .meta h1 { font-size:18px; margin:0 0 4px; }
  .stat { display:inline-block; margin-right:20px; }
  .stat b { font-size:18px; } .stat span { display:block; font-size:11px; color:#6B7280; }
  h3 { font-size:13px; text-transform:uppercase; letter-spacing:.05em; color:#6B7280; margin:18px 0 8px; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  tr:nth-child(even){ background:#FAFAFB; }
  .foot { margin-top:22px; padding-top:10px; border-top:1px solid #E5E7EB; font-size:11px; color:#9CA3AF; text-align:center; }
  .two { display:flex; gap:24px; }
  .two > div { flex:1; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">🧭 CareerPilot</div>
      <div class="tag">Deterministic · Grounded · Evidence-based</div>
    </div>
    <div style="text-align:right;font-size:12px;color:#6B7280;">
      Readiness Report<br/>${esc(date)}
    </div>
  </div>

  <div class="top">
    ${gaugeSvg(r.score)}
    <div class="meta">
      <h1>Target role: ${esc(targetRole)}</h1>
      <div style="margin:10px 0 4px;">
        <span class="stat"><b>${m.coveragePercentage}%</b><span>Skill coverage</span></span>
        <span class="stat"><b>${m.have.length}/${m.requiredSkills.length}</b><span>Required skills</span></span>
        <span class="stat"><b>${h.overall}/100</b><span>Resume health</span></span>
      </div>
    </div>
  </div>

  <div class="two">
    <div>
      <h3>Skills you have</h3>
      <div>${chips(m.have, "have")}</div>
    </div>
    <div>
      <h3>Skills to learn</h3>
      <div>${chips(m.missing, "missing")}</div>
    </div>
  </div>

  ${nextActions ? `<h3>Recommended next actions</h3>${nextActions}` : ""}

  <h3>Your roadmap</h3>
  <table>${roadmapRows}</table>

  <div class="foot">
    Generated by CareerPilot · scores computed deterministically from real resume evidence — never hallucinated.
  </div>
</body>
</html>`;
}
