#!/usr/bin/env node
/**
 * Validate Evidence-Paged KV runtime telemetry events against the paused
 * integration contract in bench-public/evidence-paged-kv/RUNTIME-INTEGRATION-DESIGN.md.
 *
 * Boundary: schema/privacy/process-geometry validation only. It does not prove
 * serving behavior, answer quality, model attention, or speedup.
 */

import fs from 'node:fs';
import path from 'node:path';

const MODES = new Set([
  'disabled',
  'dry-run',
  'exact-only',
  'compact-fallback',
  'degraded-fallback',
]);

const REASON_CODES = new Set([
  'hook_disabled',
  'seq_guard_exact_only',
  'flag_rate_exact_only',
  'compact_fallback_selected',
  'unsupported_shape',
  'kernel_bound_exceeded',
  'telemetry_incomplete',
  'event_cap_reached',
  'cuda_error',
  'privacy_guard',
  'manual_kill_switch',
]);

const FAILURE_REASONS = new Set([
  'unsupported_shape',
  'kernel_bound_exceeded',
  'telemetry_incomplete',
  'event_cap_reached',
  'cuda_error',
  'privacy_guard',
  'manual_kill_switch',
]);

const REQUIRED_TIMINGS = [
  'probe_candidates',
  'detector',
  'compact_merge',
  'global_select',
  'value',
  'exact_fallback',
  'total_hook_wall',
  'total_hook_cuda',
];

const FORBIDDEN_KEY_PATTERNS = [
  /(^|_)prompt($|_)/i,
  /raw_?token_?ids/i,
  /^token_?ids$/i,
  /^input_?ids$/i,
  /(^|_)answer($|_)/i,
  /completion_?text/i,
  /user_?data/i,
];

function usage(exitCode = 0) {
  const out = exitCode ? console.error : console.log;
  out(`Usage: node validate-epkv-runtime-telemetry.mjs [--json] <events.json|events.jsonl> [...]

Validates telemetry files. JSON may be a single event or an array of events.
JSONL must contain one event per non-empty line.

Exit code is non-zero when any event fails.`);
  process.exit(exitCode);
}

function isPlainObject(x) {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}

function isNumber(x) {
  return typeof x === 'number' && Number.isFinite(x);
}

function readEvents(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const ext = path.extname(file).toLowerCase();
  if (ext === '.jsonl' || raw.trim().split(/\r?\n/).length > 1 && !raw.trim().startsWith('[')) {
    return raw.split(/\r?\n/)
      .map((line, index) => ({ line, index: index + 1 }))
      .filter(({ line }) => line.trim().length > 0)
      .map(({ line, index }) => {
        try {
          return { event: JSON.parse(line), line: index };
        } catch (error) {
          return { parseError: error.message, line: index };
        }
      });
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((event, i) => ({ event, line: i + 1 }));
    return [{ event: parsed, line: 1 }];
  } catch (error) {
    return [{ parseError: error.message, line: 1 }];
  }
}

function scanForbiddenKeys(value, pathParts = [], errors = []) {
  if (Array.isArray(value)) {
    value.forEach((item, i) => scanForbiddenKeys(item, [...pathParts, String(i)], errors));
    return errors;
  }
  if (!isPlainObject(value)) return errors;
  for (const [key, child] of Object.entries(value)) {
    const fullPath = [...pathParts, key].join('.');
    const isPrivacyDeclaration = fullPath === 'privacy.prompt_text' || fullPath === 'privacy.raw_token_ids';
    if (!isPrivacyDeclaration && FORBIDDEN_KEY_PATTERNS.some((rx) => rx.test(key))) {
      errors.push({ code: 'privacy.forbidden_key', path: fullPath, message: `forbidden key '${key}'` });
    }
    scanForbiddenKeys(child, [...pathParts, key], errors);
  }
  return errors;
}

function requireField(event, field, errors) {
  if (!(field in event)) {
    errors.push({ code: 'required.missing', path: field, message: `missing required field '${field}'` });
    return false;
  }
  return true;
}

function validateEvent(event) {
  const errors = [];
  if (!isPlainObject(event)) {
    return [{ code: 'event.type', path: '', message: 'event must be an object' }];
  }

  for (const field of ['schema', 'mode', 'decision', 'reason_code']) {
    requireField(event, field, errors);
  }

  if (event.schema !== 'epkv.runtime.telemetry.v1') {
    errors.push({ code: 'schema.invalid', path: 'schema', message: 'schema must be epkv.runtime.telemetry.v1' });
  }
  if (!MODES.has(event.mode)) {
    errors.push({ code: 'mode.invalid', path: 'mode', message: `mode must be one of ${[...MODES].join(', ')}` });
  }
  if (!REASON_CODES.has(event.reason_code)) {
    errors.push({ code: 'reason_code.invalid', path: 'reason_code', message: `unknown reason_code '${event.reason_code}'` });
  }

  if (event.mode === 'compact-fallback' && event.reason_code !== 'compact_fallback_selected') {
    errors.push({ code: 'mode_reason.mismatch', path: 'reason_code', message: 'compact-fallback requires compact_fallback_selected' });
  }
  if (event.mode === 'exact-only' && !['seq_guard_exact_only', 'flag_rate_exact_only'].includes(event.reason_code)) {
    errors.push({ code: 'mode_reason.mismatch', path: 'reason_code', message: 'exact-only requires seq_guard_exact_only or flag_rate_exact_only' });
  }
  if (event.mode === 'degraded-fallback' && !FAILURE_REASONS.has(event.reason_code)) {
    errors.push({ code: 'mode_reason.mismatch', path: 'reason_code', message: 'degraded-fallback requires a fail-closed reason code' });
  }
  if (FAILURE_REASONS.has(event.reason_code) && event.mode !== 'degraded-fallback') {
    errors.push({ code: 'fail_closed.violation', path: 'mode', message: 'failure reason must force degraded-fallback mode' });
  }

  for (const numeric of ['seq_len', 'Hq', 'Hk', 'D', 'global_k', 'probe_local_top', 'fallback_local_top', 'num_chunks', 'flagged_head_count', 'flagged_head_rate']) {
    if (requireField(event, numeric, errors) && !isNumber(event[numeric])) {
      errors.push({ code: 'field.number', path: numeric, message: `${numeric} must be a finite number` });
    }
  }
  if (isNumber(event.flagged_head_rate) && (event.flagged_head_rate < 0 || event.flagged_head_rate > 1)) {
    errors.push({ code: 'flag_rate.range', path: 'flagged_head_rate', message: 'flagged_head_rate must be in [0, 1]' });
  }
  if (isNumber(event.flagged_head_count) && isNumber(event.Hq) && event.flagged_head_count > event.Hq) {
    errors.push({ code: 'flag_count.range', path: 'flagged_head_count', message: 'flagged_head_count cannot exceed Hq' });
  }

  if (!isPlainObject(event.timing_ms)) {
    errors.push({ code: 'timing.type', path: 'timing_ms', message: 'timing_ms must be an object' });
  } else {
    for (const key of REQUIRED_TIMINGS) {
      if (!(key in event.timing_ms)) {
        errors.push({ code: 'timing.missing', path: `timing_ms.${key}`, message: `missing timing '${key}'` });
      } else if (!isNumber(event.timing_ms[key])) {
        errors.push({ code: 'timing.number', path: `timing_ms.${key}`, message: `timing '${key}' must be a finite number` });
      }
    }
  }

  if (!isPlainObject(event.coverage)) {
    errors.push({ code: 'coverage.type', path: 'coverage', message: 'coverage must be an object' });
  } else {
    for (const key of ['event_index', 'event_cap', 'cap_hit', 'bucket']) {
      if (!(key in event.coverage)) errors.push({ code: 'coverage.missing', path: `coverage.${key}`, message: `missing coverage.${key}` });
    }
    if ('cap_hit' in event.coverage && typeof event.coverage.cap_hit !== 'boolean') {
      errors.push({ code: 'coverage.cap_hit.type', path: 'coverage.cap_hit', message: 'coverage.cap_hit must be boolean' });
    }
  }

  if (!isPlainObject(event.privacy)) {
    errors.push({ code: 'privacy.type', path: 'privacy', message: 'privacy must be an object' });
  } else {
    if (event.privacy.prompt_text !== false) errors.push({ code: 'privacy.prompt_text', path: 'privacy.prompt_text', message: 'privacy.prompt_text must be false' });
    if (event.privacy.raw_token_ids !== false) errors.push({ code: 'privacy.raw_token_ids', path: 'privacy.raw_token_ids', message: 'privacy.raw_token_ids must be false' });
    if (event.privacy.selected_positions_only !== true) errors.push({ code: 'privacy.selected_positions_only', path: 'privacy.selected_positions_only', message: 'privacy.selected_positions_only must be true' });
  }

  scanForbiddenKeys(event, [], errors);
  return errors;
}

function main(argv) {
  let json = false;
  const files = [];
  for (const arg of argv) {
    if (arg === '--json') json = true;
    else if (arg === '-h' || arg === '--help') usage(0);
    else files.push(arg);
  }
  if (!files.length) usage(1);

  const fileReports = [];
  let totalEvents = 0;
  let totalErrors = 0;

  for (const file of files) {
    const items = readEvents(file);
    const events = [];
    let fileErrors = 0;
    for (const item of items) {
      totalEvents += 1;
      if (item.parseError) {
        const errors = [{ code: 'parse.error', path: '', message: item.parseError }];
        events.push({ line: item.line, valid: false, errors });
        fileErrors += errors.length;
        totalErrors += errors.length;
        continue;
      }
      const errors = validateEvent(item.event);
      events.push({ line: item.line, mode: item.event?.mode, reason_code: item.event?.reason_code, valid: errors.length === 0, errors });
      fileErrors += errors.length;
      totalErrors += errors.length;
    }
    fileReports.push({ file, events: items.length, errors: fileErrors, valid: fileErrors === 0, event_reports: events });
  }

  const summary = { valid: totalErrors === 0, files: files.length, events: totalEvents, errors: totalErrors, file_reports: fileReports };
  if (json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`EPKV telemetry validation: ${summary.valid ? 'PASS' : 'FAIL'} (${summary.events} events, ${summary.errors} errors)`);
    for (const report of fileReports) {
      console.log(`- ${report.file}: ${report.valid ? 'PASS' : 'FAIL'} (${report.events} events, ${report.errors} errors)`);
      for (const ev of report.event_reports.filter((x) => !x.valid)) {
        console.log(`  line ${ev.line}: ${ev.errors.length} error(s)`);
        for (const err of ev.errors) console.log(`    [${err.code}] ${err.path}: ${err.message}`);
      }
    }
  }
  process.exit(summary.valid ? 0 : 1);
}

main(process.argv.slice(2));
