#!/usr/bin/env node
/**
 * Create a Google Sheet for a RealRAG R4B-style human calibration batch.
 * Reads <outDir>/human-calibration-batch.jsonl and writes google-sheet.json,
 * also appending google_sheet metadata to <outDir>/summary.json when present.
 */
import fs from 'node:fs';
import path from 'node:path';
import { homedir } from 'node:os';
import { google } from '/home/aya/.pi/agent/skills/aya/aya-google-drive/node_modules/googleapis/build/src/index.js';

const args = {
  outDir: '',
  title: '',
  parent: '0AAdREfVcovRHUk9PVA',
  share: ['felipe@aya.cx', 'felipesztutman@gmail.com'],
};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--out') args.outDir = process.argv[++i];
  else if (a === '--title') args.title = process.argv[++i];
  else if (a === '--parent') args.parent = process.argv[++i];
  else if (a === '--share') args.share = process.argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
  else throw new Error(`unknown arg ${a}`);
}
if (!args.outDir) throw new Error('--out is required');
const jsonlPath = path.join(args.outDir, 'human-calibration-batch.jsonl');
const summaryPath = path.join(args.outDir, 'summary.json');
const rows = fs.readFileSync(jsonlPath, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const headers = Object.keys(rows[0]);
const values = [headers, ...rows.map((r) => headers.map((h) => r[h] ?? ''))];
const title = args.title || `RealRAG human calibration — ${rows.length} — ${new Date().toISOString().slice(0, 10)}`;
const instructions = [
  ['RealRAG R4B-v2 — Human calibration'],
  ['Goal', 'Judge whether the model answer answers the question. This calibrates automatic metrics and LLM judges.'],
  ['Deduplication', 'This v2 batch has one row per question/qid. Labels already filled in the previous sheet were preserved where applicable.'],
  ['Do not judge', 'Do not infer whether the model internally used the evidence.'],
  ['Label: correct', 'Semantically answers the question.'],
  ['Label: partial', 'Useful but incomplete or ambiguous.'],
  ['Label: wrong', 'Incorrect, contradictory, or does not answer.'],
  ['Label: parse_error', 'Invalid/truncated/non-answer output.'],
  ['Label: unclear', 'Cannot decide from provided information.'],
  ['Confidence', '1 low / 2 medium / 3 high.'],
  ['Bias control', 'Hidden columns contain condition, automatic metric, and LLM panel metadata. Review visible columns first.'],
];
const schema = [
  ['field', 'allowed_values'],
  ['human_label', 'correct, partial, wrong, parse_error, unclear'],
  ['human_confidence', '1, 2, 3'],
];
const dashboard = [
  ['Metric', 'Formula / value'],
  ['Total rows', '=COUNTA(adjudication_batch!A2:A)'],
  ['Reviewed rows', '=COUNTA(adjudication_batch!I2:I)'],
  ['Correct', '=COUNTIF(adjudication_batch!I2:I,"correct")'],
  ['Partial', '=COUNTIF(adjudication_batch!I2:I,"partial")'],
  ['Wrong', '=COUNTIF(adjudication_batch!I2:I,"wrong")'],
  ['Parse error', '=COUNTIF(adjudication_batch!I2:I,"parse_error")'],
  ['Unclear', '=COUNTIF(adjudication_batch!I2:I,"unclear")'],
];
const credentialsPath = path.join(homedir(), '.pi', 'agent', 'credentials', 'aya-dashboard-55a83a9e7716.json');
const key = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
const auth = new google.auth.GoogleAuth({ credentials: key, scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets'] });
const drive = google.drive({ version: 'v3', auth });
const sheets = google.sheets({ version: 'v4', auth });
const create = await drive.files.create({
  requestBody: { name: title, mimeType: 'application/vnd.google-apps.spreadsheet', parents: [args.parent] },
  supportsAllDrives: true,
  fields: 'id,name,webViewLink',
});
const spreadsheetId = create.data.id;
const meta = await sheets.spreadsheets.get({ spreadsheetId });
const defaultSheetId = meta.data.sheets[0].properties.sheetId;
await sheets.spreadsheets.batchUpdate({
  spreadsheetId,
  requestBody: { requests: [
    { updateSheetProperties: { properties: { sheetId: defaultSheetId, title: 'adjudication_batch', gridProperties: { frozenRowCount: 1 } }, fields: 'title,gridProperties.frozenRowCount' } },
    { addSheet: { properties: { title: 'instructions', index: 0, gridProperties: { frozenRowCount: 1 } } } },
    { addSheet: { properties: { title: 'schema', index: 2, gridProperties: { frozenRowCount: 1 } } } },
    { addSheet: { properties: { title: 'dashboard', index: 3, gridProperties: { frozenRowCount: 1 } } } },
  ] },
});
await sheets.spreadsheets.values.update({ spreadsheetId, range: 'adjudication_batch!A1', valueInputOption: 'USER_ENTERED', requestBody: { values } });
await sheets.spreadsheets.values.update({ spreadsheetId, range: 'instructions!A1', valueInputOption: 'USER_ENTERED', requestBody: { values: instructions } });
await sheets.spreadsheets.values.update({ spreadsheetId, range: 'schema!A1', valueInputOption: 'USER_ENTERED', requestBody: { values: schema } });
await sheets.spreadsheets.values.update({ spreadsheetId, range: 'dashboard!A1', valueInputOption: 'USER_ENTERED', requestBody: { values: dashboard } });
const latest = await sheets.spreadsheets.get({ spreadsheetId });
const batchSheetId = latest.data.sheets.find((s) => s.properties.title === 'adjudication_batch').properties.sheetId;
const instructionsSheetId = latest.data.sheets.find((s) => s.properties.title === 'instructions').properties.sheetId;
const dashboardSheetId = latest.data.sheets.find((s) => s.properties.title === 'dashboard').properties.sheetId;
await sheets.spreadsheets.batchUpdate({
  spreadsheetId,
  requestBody: { requests: [
    { setDataValidation: { range: { sheetId: batchSheetId, startRowIndex: 1, endRowIndex: rows.length + 1, startColumnIndex: 8, endColumnIndex: 9 }, rule: { condition: { type: 'ONE_OF_LIST', values: ['correct', 'partial', 'wrong', 'parse_error', 'unclear'].map((userEnteredValue) => ({ userEnteredValue })) }, strict: true, showCustomUi: true } } },
    { setDataValidation: { range: { sheetId: batchSheetId, startRowIndex: 1, endRowIndex: rows.length + 1, startColumnIndex: 9, endColumnIndex: 10 }, rule: { condition: { type: 'ONE_OF_LIST', values: ['1', '2', '3'].map((userEnteredValue) => ({ userEnteredValue })) }, strict: true, showCustomUi: true } } },
    { updateDimensionProperties: { range: { sheetId: batchSheetId, dimension: 'COLUMNS', startIndex: 13, endIndex: headers.length }, properties: { hiddenByUser: true }, fields: 'hiddenByUser' } },
    { updateDimensionProperties: { range: { sheetId: batchSheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 8 }, properties: { pixelSize: 220 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId: batchSheetId, dimension: 'COLUMNS', startIndex: 10, endIndex: 11 }, properties: { pixelSize: 260 }, fields: 'pixelSize' } },
    { repeatCell: { range: { sheetId: batchSheetId, startRowIndex: 0, endRowIndex: rows.length + 1, startColumnIndex: 0, endColumnIndex: headers.length }, cell: { userEnteredFormat: { wrapStrategy: 'WRAP' } }, fields: 'userEnteredFormat.wrapStrategy' } },
    { repeatCell: { range: { sheetId: batchSheetId, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.88, green: 0.92, blue: 1 } } }, fields: 'userEnteredFormat(textFormat,backgroundColor)' } },
    { repeatCell: { range: { sheetId: instructionsSheetId, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 14 } } }, fields: 'userEnteredFormat.textFormat' } },
    { repeatCell: { range: { sheetId: dashboardSheetId, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.88, green: 0.92, blue: 1 } } }, fields: 'userEnteredFormat(textFormat,backgroundColor)' } },
  ] },
});
const permissionResults = [];
for (const emailAddress of args.share) {
  try {
    await drive.permissions.create({ fileId: spreadsheetId, supportsAllDrives: true, requestBody: { type: 'user', role: 'writer', emailAddress }, sendNotificationEmail: false });
    permissionResults.push({ emailAddress, role: 'writer', ok: true });
  } catch (e) {
    permissionResults.push({ emailAddress, role: 'writer', ok: false, error: e.message });
  }
}
const info = {
  schema: 'realrag.r4b.google_sheet.v1',
  created_at: new Date().toISOString(),
  title,
  spreadsheetId,
  webViewLink: create.data.webViewLink,
  rows: rows.length,
  tabs: ['instructions', 'adjudication_batch', 'schema', 'dashboard'],
  hidden_columns_start: 'hidden_source_review_id',
  permissions: permissionResults,
};
fs.writeFileSync(path.join(args.outDir, 'google-sheet.json'), JSON.stringify(info, null, 2) + '\n');
if (fs.existsSync(summaryPath)) {
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  summary.google_sheet = { title, spreadsheetId, webViewLink: create.data.webViewLink, rows: rows.length, permissions: permissionResults };
  summary.files = Array.from(new Set([...(summary.files || []), 'google-sheet.json']));
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + '\n');
}
console.log(JSON.stringify(info, null, 2));
