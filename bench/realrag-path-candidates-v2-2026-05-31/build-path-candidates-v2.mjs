#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function arg(name, fallback) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

const ROOT = arg('root', 'bench/realrag-path-candidates-v2-2026-05-31');
const V1 = 'bench/realrag-path-construction-v1-2026-05-30';
const DATASET = arg('dataset', 'bench/_datasets/2wiki/data/dev.json');
const LABEL = arg('label', 'offset1500-n100');
const INPUTS = {
  current: arg('current', `${V1}/answer-quality-offset1500-n100-current/summary.json`),
  config0: arg('config0', `${V1}/answer-quality-offset1500-n100-config0/summary.json`),
};
const OUT_JSONL = arg('out-jsonl', `${ROOT}/path-candidates-${LABEL}.jsonl`);
const OUT_SUMMARY = arg('out-summary', LABEL === 'offset1500-n100'
  ? `${ROOT}/path-candidate-summary.json`
  : `${ROOT}/path-candidate-summary-${LABEL}.json`);

const STOP_SEEDS = new Set([
  'who', 'what', 'which', 'when', 'where', 'was', 'were', 'is', 'are', 'did', 'do', 'does',
  'the', 'a', 'an', 'in', 'of', 'for', 'and', 'or', 'to', 'by', 'with', 'from', 'this', 'that',
  'film', 'song', 'magazine', 'question', 'answer', 'passages', 'final', 'place', 'date',
  'birth', 'death', 'nationality', 'country', 'father', 'mother', 'spouse', 'husband', 'wife',
  'director', 'performer', 'composer', 'founder', 'award', 'birthday', 'work', 'at', 'born', 'die', 'died',
]);

const GENERIC_EXACT = new Set([
  'place of birth', 'place of death', 'place of origin', 'the singer', 'the child', 'the feature',
  'the general', 'the will', 'the dance', 'the dancer', 'the rock', 'the room', 'the street',
  'the light', 'the dead', 'the jury', 'the cell', 'the first day', 'the only one', 'the supporter',
  'the employee', 'the bastard', 'the open road', 'the hours', 'the mess', 'story', 'master',
  'model', 'part', 'missing', 'point', 'division', 'a division', 'captured', 'captured!',
  '@home', 'them!', 'like that', 'fire', 'kings', 'comedy!', 'the name of love', 'in the name of',
  'the name', 'the singer', 'the performer', 'the director', 'the husband',
]);

const NATIONALITIES = [
  'Afghan', 'Albanian', 'Algerian', 'American', 'Andorran', 'Angolan', 'Argentine', 'Argentinian',
  'Armenian', 'Australian', 'Austrian', 'Azerbaijani', 'Bahamian', 'Bahraini', 'Bangladeshi',
  'Barbadian', 'Belarusian', 'Belgian', 'Belizean', 'Beninese', 'Bhutanese', 'Bolivian',
  'Bosnian', 'Brazilian', 'British', 'Bulgarian', 'Burmese', 'Burundian', 'Cambodian', 'Cameroonian',
  'Canadian', 'Chadian', 'Chilean', 'Chinese', 'Colombian', 'Congolese', 'Costa Rican', 'Croatian',
  'Cuban', 'Cypriot', 'Czech', 'Danish', 'Dominican', 'Dutch', 'Ecuadorian', 'Egyptian',
  'English', 'Eritrean', 'Estonian', 'Ethiopian', 'Finnish', 'French', 'Georgian', 'German',
  'Ghanaian', 'Greek', 'Guatemalan', 'Haitian', 'Honduran', 'Hungarian', 'Icelandic', 'Indian',
  'Indonesian', 'Iranian', 'Iraqi', 'Irish', 'Israeli', 'Italian', 'Jamaican', 'Japanese',
  'Jordanian', 'Kazakh', 'Kenyan', 'Korean', 'Kuwaiti', 'Latvian', 'Lebanese', 'Liberian',
  'Libyan', 'Lithuanian', 'Luxembourgish', 'Macedonian', 'Malagasy', 'Malaysian', 'Malian',
  'Maltese', 'Mexican', 'Moldovan', 'Mongolian', 'Moroccan', 'Mozambican', 'Namibian', 'Nepalese',
  'New Zealand', 'Nicaraguan', 'Nigerian', 'Norwegian', 'Pakistani', 'Palestinian', 'Panamanian',
  'Paraguayan', 'Peruvian', 'Philippine', 'Polish', 'Portuguese', 'Puerto Rican', 'Romanian',
  'Russian', 'Rwandan', 'Saudi', 'Scottish', 'Senegalese', 'Serbian', 'Singaporean', 'Slovak',
  'Slovenian', 'Somali', 'South African', 'Spanish', 'Sri Lankan', 'Sudanese', 'Swedish', 'Swiss',
  'Syrian', 'Taiwanese', 'Tanzanian', 'Thai', 'Tunisian', 'Turkish', 'Ugandan', 'Ukrainian',
  'Uruguayan', 'Uzbek', 'Venezuelan', 'Vietnamese', 'Welsh', 'Yemeni', 'Zimbabwean', 'Soviet',
];

const NATIONALITY_RE = new RegExp(`\\b(${NATIONALITIES.map(escapeRe).join('|')})\\b`, 'i');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeAnswer(s) {
  return norm(s).replace(/\b(a|an|the)\b/g, ' ').trim().replace(/\s+/g, ' ');
}

function exactMatch(pred, gold) {
  return normalizeAnswer(pred) === normalizeAnswer(gold) ? 1 : 0;
}

function containsMatch(pred, gold) {
  const p = normalizeAnswer(pred);
  const g = normalizeAnswer(gold);
  return p && g && p.includes(g) ? 1 : 0;
}

function f1Score(pred, gold) {
  const pt = normalizeAnswer(pred).split(/\s+/).filter(Boolean);
  const gt = normalizeAnswer(gold).split(/\s+/).filter(Boolean);
  if (!pt.length && !gt.length) return 1;
  if (!pt.length || !gt.length) return 0;
  const counts = new Map();
  for (const t of pt) counts.set(t, (counts.get(t) || 0) + 1);
  let same = 0;
  for (const t of gt) {
    const c = counts.get(t) || 0;
    if (c > 0) {
      same += 1;
      counts.set(t, c - 1);
    }
  }
  if (!same) return 0;
  const precision = same / pt.length;
  const recall = same / gt.length;
  return 2 * precision * recall / (precision + recall);
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanValue(s) {
  let out = String(s || '')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[“”"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  out = out.replace(/^(Sir|Dame|Lord|Lady|Rev\.?|Rabbi|Dr\.?|Saint|St\.?|The Honourable|Hon\.?|Princess|Prince)\s+/i, '').trim();
  out = out.replace(/\b(of|from)\s+(East Anthony Cornwall|Antony in Cornwall|Los Angeles, California)$/i, '').trim();
  out = out.replace(/\s+,\s*$/, '').trim();
  out = out.replace(/\s+who\b.*$/i, '').trim();
  out = out.replace(/\s+which\b.*$/i, '').trim();
  out = out.replace(/\s+where\b.*$/i, '').trim();
  out = out.replace(/\s+after\b.*$/i, '').trim();
  out = out.replace(/\s+before\b.*$/i, '').trim();
  out = out.replace(/\s+with\b.*$/i, '').trim();
  out = out.replace(/\s+as\b.*$/i, '').trim();
  out = out.replace(/\s+in\s+\d{3,4}\b.*$/i, '').trim();
  return out.replace(/\s+/g, ' ').trim();
}

function stripTrailingConjunctions(s) {
  return cleanValue(String(s || '')
    .split(/\s+(?:and|or)\s+(?:his|her|their|its|the)\s+/i)[0]
    .split(/\s+and\s+(?:inherited|became|served|was|were|had|died|uses|starring|featuring)\b/i)[0]
    .split(/\s+(?:and|or)\s+[A-Z][\wÀ-ÖØ-öø-ÿ'’-]+\s+(?:de|of|von|van|da|del)\b/i)[0]
    .split(/\s+and\s+[A-Z][\wÀ-ÖØ-öø-ÿ'’-]+(?:\s|,|$)/i)[0]
    .split(/\s+and\s+\d+/i)[0]);
}

function cleanForRelation(relation, value) {
  let out = cleanValue(value)
    .replace(/^(?:musicians?|singer-songwriters?|actors?|actresses?|filmmakers?|poets?|writers?)\s+/i, '')
    .trim();

  if (['father', 'mother', 'spouse', 'child', 'director', 'performer', 'composer', 'founder'].includes(relation)) {
    out = stripTrailingConjunctions(out)
      .replace(/,\s*(?:originally|who|which|the|a|an|he|she|they|those)\b.*$/i, '')
      .replace(/\s+on a script\b.*$/i, '')
      .trim();
    if (/^[a-z]/.test(out)) {
      const names = [...out.matchAll(/(?:[A-ZÀ-ÖØ-Þ][\wÀ-ÖØ-öø-ÿ'’-]+(?:\s+|$)){2,6}/g)]
        .map((m) => cleanValue(m[0]));
      if (names.length) out = names[names.length - 1];
    }
    return out;
  }

  if (['place_of_birth', 'place_of_death', 'place_of_burial'].includes(relation)) {
    out = out
      .replace(/^\d{3,4}\s+in\s+/i, '')
      .replace(/^a\s+([A-ZÀ-ÖØ-Þ][\wÀ-ÖØ-öø-ÿ'’-]+)\s+(?:hotel|hospital|house|palace|castle|city|town)\b.*$/i, '$1')
      .replace(/\s+by\s+an?\b.*$/i, '')
      .replace(/\s+but\b.*$/i, '')
      .replace(/\s+and\s+died\b.*$/i, '')
      .replace(/\s+during\b.*$/i, '')
      .replace(/\s+to\s+(?:Italian|French|German|American|British|Spanish|Polish|Russian|Jewish|immigrant)\b.*$/i, '')
      .replace(/,\s*(?:and|but|who|which|where|when)\b.*$/i, '')
      .trim();
    const parts = out.split(',').map((x) => x.trim()).filter(Boolean);
    if (parts.length >= 3) {
      if (norm(parts[0]) === norm(parts[1])) out = parts[0];
      else if (/^now\b/i.test(parts[2])) out = parts[0];
      else out = `${parts[0]}, ${parts[1]}`;
    } else if (parts.length === 2) {
      const sublocalityFirst = /^(cedofeita)$/i.test(parts[0]);
      if (sublocalityFirst) out = parts[1];
      else if (/^(canada|united states|usa|france|germany|italy|spain|england|scotland|wales|ireland|austria-hungary|australia)$/i.test(parts[1])) out = parts[0];
      else if (/county|province|department|pas-de-calais|ille-et-vilaine/i.test(parts[1])) out = parts[0];
      else out = parts[0];
    }
    return cleanValue(out);
  }

  if (relation === 'date_of_birth') {
    out = out.split(/[–-]/)[0].replace(/\s+in\s+[A-ZÀ-ÖØ-Þ].*$/i, '').trim();
    const date = /([0-9]{1,2}\s+[A-Z][a-z]+\s+\d{3,4}|[A-Z][a-z]+\s+[0-9]{1,2},\s+\d{3,4}|\d{3,4})/.exec(out);
    return cleanValue(date?.[1] || out);
  }

  if (relation === 'date_of_death') {
    const dash = out.split(/[–-]/).map((x) => x.trim()).filter(Boolean);
    if (dash.length >= 2) out = dash[dash.length - 1];
    const date = /([0-9]{1,2}\s+[A-Z][a-z]+\s+\d{3,4}|[A-Z][a-z]+\s+[0-9]{1,2},\s+\d{3,4}|\d{3,4})/.exec(out);
    return cleanValue(date?.[1] || out);
  }

  if (['educated_at', 'employer'].includes(relation)) {
    out = out.replace(/^the\s+/i, '').split(',')[0].trim();
    out = out.replace(/\s+in\s+[A-ZÀ-ÖØ-Þ][\wÀ-ÖØ-öø-ÿ'’-]+$/i, '').trim();
    return cleanValue(out);
  }

  if (['award_received', 'country_of_citizenship'].includes(relation)) {
    out = stripTrailingConjunctions(out).split(',')[0].trim();
    return cleanValue(out);
  }

  return out;
}

function capSpans(question) {
  const spans = String(question || '').match(/(?:[A-ZÀ-ÖØ-ÞÆŒ][\wÀ-ÖØ-öø-ÿ'’.-]*(?:\s+|$)){1,10}/g) || [];
  const out = [];
  for (let s of spans) {
    s = s.replace(/\s+/g, ' ').trim().replace(/[?.,;:!()[\]{}"']/g, '');
    const words = norm(s).split(/\s+/).filter(Boolean);
    if (!s || s.length < 3) continue;
    if (words.every((w) => STOP_SEEDS.has(w))) continue;
    if (!out.some((x) => norm(x) === norm(s))) out.push(s);
  }
  return out;
}

function titleTokens(title) {
  return norm(title).split(/\s+/).filter((t) => t.length >= 3 && !STOP_SEEDS.has(t));
}

function isGenericTitle(title) {
  const n = norm(title);
  return GENERIC_EXACT.has(n) || /^the [a-z]+$/.test(n) || /^(place|date) of (birth|death|origin)$/.test(n);
}

function firstSentence(text) {
  return String(text || '').split(/(?<=\.)\s+/)[0] || '';
}

function snippetAround(text, value, maxLen = 260) {
  const raw = String(text || '');
  const nValue = norm(value);
  if (!nValue) return raw.slice(0, maxLen);
  const lower = norm(raw);
  const idx = lower.indexOf(nValue);
  if (idx < 0) return raw.slice(0, maxLen);
  const start = Math.max(0, idx - 80);
  return raw.slice(start, start + maxLen).replace(/\s+/g, ' ').trim();
}

function parseQuestion(question) {
  const q = norm(question);
  const raw = String(question || '');
  const steps = [];
  let template = 'unknown';
  let answerSlot = 'entity';

  const attr = inferTerminalAttribute(q);

  if (/paternal grandfather/.test(q)) {
    steps.push('father', 'father'); template = 'paternal_grandfather'; answerSlot = 'person';
  } else if (/maternal grandfather/.test(q)) {
    steps.push('mother', 'father'); template = 'maternal_grandfather'; answerSlot = 'person';
  } else if (/paternal grandmother/.test(q)) {
    steps.push('father', 'mother'); template = 'paternal_grandmother'; answerSlot = 'person';
  } else if (/maternal grandmother/.test(q)) {
    steps.push('mother', 'mother'); template = 'maternal_grandmother'; answerSlot = 'person';
  } else if (/father in law/.test(q)) {
    steps.push('spouse', 'father'); template = 'father_in_law'; answerSlot = 'person';
  } else if (/mother in law/.test(q)) {
    steps.push('spouse', 'mother'); template = 'mother_in_law'; answerSlot = 'person';
  } else if (/\bfather\b/.test(q) && /\bperformer\b/.test(q)) {
    steps.push('performer', 'father'); template = 'performer_father'; answerSlot = 'person';
  } else if (/\bmother\b/.test(q) && /\bperformer\b/.test(q)) {
    steps.push('performer', 'mother'); template = 'performer_mother'; answerSlot = 'person';
  } else if (/\b(child|son|daughter)\b/.test(q) && /\bdirector\b/.test(q)) {
    steps.push('director', 'child'); template = 'director_child'; answerSlot = 'person';
  } else if (/\bspouse\b|\bhusband\b|\bwife\b/.test(q) && /\bdirector\b/.test(q)) {
    steps.push('director', 'spouse'); template = 'director_spouse'; answerSlot = 'person';
  } else if (/\b(performer|director|composer|founder)\b/.test(q) && attr) {
    const owner = /\bperformer\b/.test(q) ? 'performer' : /\bdirector\b/.test(q) ? 'director' : /\bcomposer\b/.test(q) ? 'composer' : 'founder';
    steps.push(owner, attr.relation); template = `${owner}_${attr.relation}`; answerSlot = attr.slot;
  } else if (/\b(father|mother|husband|wife|spouse)\b/.test(q) && attr) {
    const owner = /\bfather\b/.test(q) ? 'father' : /\bmother\b/.test(q) ? 'mother' : 'spouse';
    steps.push(owner, attr.relation); template = `${owner}_${attr.relation}`; answerSlot = attr.slot;
  } else if (/\bfather\b/.test(q)) {
    steps.push('father'); template = 'father'; answerSlot = 'person';
  } else if (/\bmother\b/.test(q)) {
    steps.push('mother'); template = 'mother'; answerSlot = 'person';
  } else if (/\bspouse\b|\bhusband\b|\bwife\b/.test(q)) {
    steps.push('spouse'); template = 'spouse'; answerSlot = 'person';
  } else if (attr && /\bof\b/.test(q)) {
    steps.push(attr.relation); template = `direct_${attr.relation}`; answerSlot = attr.slot;
  }

  return {
    question: raw,
    normalized_question: q,
    template,
    steps,
    answer_slot: answerSlot,
    spans: capSpans(raw),
  };
}

function inferTerminalAttribute(q) {
  if (/place of birth|where .* born|born\?$/.test(q)) return { relation: 'place_of_birth', slot: 'place' };
  if (/place of death|where .* die|where .* died|where did .* die/.test(q)) return { relation: 'place_of_death', slot: 'place' };
  if (/date of birth|birthday|when .* born/.test(q)) return { relation: 'date_of_birth', slot: 'date' };
  if (/date of death|when .* die|when .* died/.test(q)) return { relation: 'date_of_death', slot: 'date' };
  if (/graduat|educated at|study|studied/.test(q)) return { relation: 'educated_at', slot: 'institution' };
  if (/work at|works at|employer/.test(q)) return { relation: 'employer', slot: 'institution' };
  if (/nationality/.test(q)) return { relation: 'country_of_citizenship', slot: 'nationality' };
  if (/which country|what country|country .* from| is from| from\?$/.test(q)) return { relation: 'country_of_citizenship', slot: 'country_or_nationality' };
  if (/place of burial|buried/.test(q)) return { relation: 'place_of_burial', slot: 'place' };
  if (/\baward\b/.test(q)) return { relation: 'award_received', slot: 'award' };
  return null;
}

function buildDatasetIndex(data) {
  const byId = new Map();
  const titleTexts = new Map();
  const normToTitle = new Map();
  const titleDocsByQid = new Map();
  for (const item of data) {
    byId.set(String(item._id), item);
    const qdocs = new Map();
    for (const [title, sents] of item.context || []) {
      const text = `${title}: ${(sents || []).join(' ')}`;
      qdocs.set(norm(title), { title, text });
      if (!titleTexts.has(norm(title))) titleTexts.set(norm(title), []);
      titleTexts.get(norm(title)).push({ qid: item._id, title, text });
      if (!normToTitle.has(norm(title))) normToTitle.set(norm(title), title);
    }
    titleDocsByQid.set(String(item._id), qdocs);
  }
  return { byId, titleTexts, normToTitle, titleDocsByQid };
}

function docForTitle(title, qid, index) {
  const nt = norm(title);
  const local = index.titleDocsByQid.get(String(qid));
  if (local?.has(nt)) return local.get(nt);
  const docs = index.titleTexts.get(nt) || [];
  if (docs.length) return docs[0];
  return null;
}

function allContextTitles(qid, index) {
  return [...(index.titleDocsByQid.get(String(qid))?.values() || [])].map((d) => d.title);
}

function matchKnownTitle(value, knownTitles) {
  const nv = norm(value);
  if (!nv) return null;
  const vTokens = new Set(nv.split(/\s+/).filter((t) => t.length >= 5 && !STOP_SEEDS.has(t)));
  const cands = [];
  for (const title of knownTitles) {
    const nt = norm(title);
    if (!nt || isGenericTitle(title)) continue;
    if (nt === nv) cands.push({ title, score: 20 });
    else if (nv.includes(nt) && nt.length >= 5) cands.push({ title, score: 14 + Math.min(5, nt.length / 8) });
    else if (nt.includes(nv) && nv.length >= 5) cands.push({ title, score: 10 + Math.min(5, nv.length / 8) });
    else {
      const tTokens = nt.split(/\s+/).filter((t) => t.length >= 5 && !STOP_SEEDS.has(t));
      const overlap = tTokens.filter((t) => vTokens.has(t));
      if (overlap.length >= 1 && (vTokens.size <= 3 || overlap.length >= 2)) {
        cands.push({ title, score: 6 + overlap.length * 2 });
      }
    }
  }
  cands.sort((a, b) => b.score - a.score || b.title.length - a.title.length);
  return cands[0] || null;
}

function matchTitlesInQuestion(question, titles, seeds = []) {
  const qn = norm(question);
  const spans = capSpans(question).map(norm);
  const seedNorms = (seeds || []).map(norm).filter(Boolean);
  const out = [];
  for (const title of titles) {
    const nt = norm(title);
    if (!nt || isGenericTitle(title)) continue;
    const tks = titleTokens(title);
    let score = 0;
    let reason = [];
    if (qn.includes(nt)) { score += 40; reason.push('title_in_question'); }
    for (const span of spans) {
      if (span && (span.includes(nt) || nt.includes(span))) { score += 22; reason.push('question_span_match'); }
      else {
        const st = span.split(/\s+/).filter((t) => t.length >= 3 && !STOP_SEEDS.has(t));
        const overlap = st.filter((t) => nt.split(/\s+/).includes(t)).length;
        if (overlap >= Math.min(2, st.length) && overlap > 0) { score += 6 * overlap; reason.push('question_token_overlap'); }
      }
    }
    for (const seed of seedNorms) {
      if (seed && (seed.includes(nt) || nt.includes(seed))) { score += 15; reason.push('seed_match'); }
    }
    if (score > 0) out.push({ title, score, reason: [...new Set(reason)] });
  }
  out.sort((a, b) => b.score - a.score || a.title.length - b.title.length);
  return out;
}

function buildAdjacency(edges = []) {
  const adj = new Map();
  function add(a, b) {
    const na = norm(a); const nb = norm(b);
    if (!na || !nb) return;
    if (!adj.has(na)) adj.set(na, []);
    adj.get(na).push({ title: b, otherNorm: nb });
  }
  for (const e of edges || []) {
    if (!Array.isArray(e) || e.length < 2) continue;
    add(e[0], e[1]); add(e[1], e[0]);
  }
  return adj;
}

function sentenceMatches(text, regexes) {
  const sentences = String(text || '').split(/(?<=\.)\s+|\n+/).filter(Boolean);
  const matches = [];
  for (const sentence of sentences) {
    for (const re of regexes) {
      re.lastIndex = 0;
      const m = re.exec(sentence);
      if (m?.[1]) matches.push({ value: cleanValue(m[1]), sentence });
    }
  }
  return matches.filter((m) => m.value && m.value.length >= 2 && !/^the\b/i.test(m.value));
}

function extractRelationFromText(relation, subjectTitle, text) {
  const t = String(text || '');
  const first = firstSentence(t);
  const out = [];
  const push = (value, score, source, sentence = '') => {
    const v = cleanForRelation(relation, value);
    if (!v || v.length < 2 || norm(v) === norm(subjectTitle)) return;
    out.push({ value: v, score, source, sentence: sentence || snippetAround(t, v) });
  };

  if (relation === 'director') {
    for (const m of sentenceMatches(t, [
      /\bdirected by\s+([^.;]+)/i,
      /\bwho also served as director\b/i,
    ])) push(m.value, 18, 'text_directed_by', m.sentence);
    const who = /stars\s+([^,.;]+),\s+who also served as director/i.exec(t);
    if (who?.[1]) push(who[1], 16, 'text_who_served_as_director', who[0]);
  } else if (relation === 'performer') {
    for (const m of sentenceMatches(t, [
      /\bperformed by\s+([^.;]+)/i,
      /\bperformed by\s+([^,.;]+)/i,
      /\bwritten and performed by\s+([^.;]+)/i,
      /\bwritten by\s+([^,.;]+),\s+who recorded/i,
      /\brecorded by\s+([^.;]+)/i,
      /\bsung by\s+([^.;]+)/i,
      /\bsang by\s+([^.;]+)/i,
    ])) push(m.value, 18, 'text_performer', m.sentence);
  } else if (relation === 'composer') {
    for (const m of sentenceMatches(t, [
      /\bmusic by\s+([^.;]+)/i,
      /\bcomposed by\s+([^.;]+)/i,
      /\bscore by\s+([^.;]+)/i,
      /\bcomposer(?: was| is)?\s+([^.;]+)/i,
    ])) push(m.value, 18, 'text_composer', m.sentence);
  } else if (relation === 'founder') {
    for (const m of sentenceMatches(t, [
      /\bfounded by\s+([^.;]+)/i,
      /\bfounder(?: was| is)?\s+([^.;]+)/i,
    ])) push(m.value, 18, 'text_founder', m.sentence);
  } else if (relation === 'spouse') {
    for (const m of sentenceMatches(t, [
      /\b(?:wife|husband) of\s+([^.;]+)/i,
      /\bmarried\s+([^.;]+)/i,
      /\blater wife of\s+([^.;]+)/i,
      /\blater husband of\s+([^.;]+)/i,
      /\bspouse(?: was| is)?\s+([^.;]+)/i,
    ])) push(stripTrailingConjunctions(m.value), 18, 'text_spouse', m.sentence);
  } else if (relation === 'father') {
    for (const m of sentenceMatches(t, [
      /\b(?:son|daughter) of\s+(?:Queen|Duchess|Lady|Princess|Empress|Countess)\s+[^.;]+?\s+and\s+([^.;]+)/i,
    ])) push(stripTrailingConjunctions(m.value), 21, 'text_father_second_parent_after_female_title', m.sentence);
    for (const m of sentenceMatches(t, [
      /\bson\s+(?:and\s+[^.;]*?\s+)?of\s+([^.;]+)/i,
      /\bdaughter\s+(?:and\s+[^.;]*?\s+)?of\s+([^.;]+)/i,
      /\bfather(?: was| is)\s+([^.;]+)/i,
      /\bhis father(?: was| is)?\s+([^.;]+)/i,
      /\bher father(?: was| is)?\s+([^.;]+)/i,
    ])) {
      if (/\b(?:his|her)?\s*mother\s+(?:was|is)\s+(?:the\s+)?daughter\s+of\b/i.test(m.sentence)) continue;
      push(stripTrailingConjunctions(m.value), 18, 'text_father', m.sentence);
    }
  } else if (relation === 'mother') {
    for (const m of sentenceMatches(t, [
      /\bby\s+(?:his|her)\s+(?:first\s+)?wife,\s+([^.;]+)/i,
      /\bson of\s+[^.;]+?\s+and\s+(?:his|her|their)?\s*(?:wife\s+)?([^.;]+)/i,
      /\bdaughter of\s+[^.;]+?\s+and\s+(?:his|her|their)?\s*(?:wife\s+)?([^.;]+)/i,
      /\bmother(?: was| is)?\s+([^.;]+)/i,
      /\bhis mother(?: was| is)?\s+([^.;]+)/i,
      /\bher mother(?: was| is)?\s+([^.;]+)/i,
    ])) push(stripTrailingConjunctions(m.value), 18, 'text_mother', m.sentence);
  } else if (relation === 'child') {
    for (const m of sentenceMatches(t, [
      /\b(?:son|daughter|child) is\s+([^.;]+)/i,
      /\bchildren? (?:include|including)\s+([^.;]+)/i,
      /\bfather of\s+([^.;]+)/i,
      /\bmother of\s+([^.;]+)/i,
    ])) push(stripTrailingConjunctions(m.value), 15, 'text_child', m.sentence);
  } else if (relation === 'place_of_birth') {
    for (const m of sentenceMatches(t, [
      /\bborn\s+(?:on\s+[^,.;]+,\s+)?(?:in|at)\s+([^.;]+)/i,
      /\bBorn as\s+[^.;]+?\s+in\s+([^.;]+)/i,
      /\(\s*[^)]*?\d{3,4},\s+in\s+([^–)-,.;]+)/i,
      /\bfrom\s+([^.;]+)$/i,
    ])) push(stripTrailingConjunctions(m.value), 18, 'text_place_of_birth', m.sentence);
  } else if (relation === 'place_of_death') {
    for (const m of sentenceMatches(t, [
      /\bdied\s+(?:on\s+[^,.;]+,\s+)?(?:in|at)\s+([^.;]+)/i,
      /\bwas killed\s+(?:in|at)\s+([^.;]+)/i,
      /\bwas assassinated\s+(?:in|at)\s+([^.;]+)/i,
    ])) push(stripTrailingConjunctions(m.value), 18, 'text_place_of_death', m.sentence);
  } else if (relation === 'date_of_birth') {
    const paren = /\(([^()]*?\d{3,4}[^()]*)\)/.exec(first);
    if (paren?.[1]) {
      const date = paren[1].split(/\s+[–-]\s+/)[0];
      push(date, 14, 'text_birth_date_parenthetical', first);
    }
    for (const m of sentenceMatches(t, [
      /\bborn\s+(?:on\s+)?([0-9]{1,2}\s+[A-Z][a-z]+\s+\d{3,4}|[A-Z][a-z]+\s+[0-9]{1,2},\s+\d{3,4}|\d{3,4})/i,
    ])) push(m.value, 18, 'text_date_of_birth', m.sentence);
  } else if (relation === 'date_of_death') {
    const paren = /\(([^()]*?[–-][^()]*?\d{3,4}[^()]*)\)/.exec(first);
    if (paren?.[1]) {
      const parts = paren[1].split(/\s*[–-]\s*/);
      if (parts[1]) push(parts[1], 14, 'text_death_date_parenthetical', first);
    }
    for (const m of sentenceMatches(t, [
      /\bdied\s+(?:on\s+)?([0-9]{1,2}\s+[A-Z][a-z]+\s+\d{3,4}|[A-Z][a-z]+\s+[0-9]{1,2},\s+\d{3,4}|\d{3,4})/i,
    ])) push(m.value, 18, 'text_date_of_death', m.sentence);
  } else if (relation === 'educated_at') {
    for (const m of sentenceMatches(t, [
      /\beducated at\s+([^.;]+)/i,
      /\bgraduated from\s+([^.;]+)/i,
      /\bgraduated(?:\s+with)?[^.;]*?\s+from\s+(?:the\s+)?([^.;]+)/i,
      /\bgraduated\s+[^.;]+?\s+from\s+([^.;]+)/i,
      /\bstudied at\s+([^.;]+)/i,
      /\bstudy at\s+([^.;]+)/i,
      /\bsent to\s+([^.;]+?)\s+in\s+\d{4}\s+to compete/i,
    ])) push(m.value, 18, 'text_educated_at', m.sentence);
  } else if (relation === 'employer') {
    for (const m of sentenceMatches(t, [
      /\bprofessor of [^.;]+ at\s+([^.;]+)/i,
      /\bprofessor [^.;]+ at\s+([^.;]+)/i,
      /\bworks? at\s+([^.;]+)/i,
      /\bemployed by\s+([^.;]+)/i,
      /\bserves? at\s+([^.;]+)/i,
    ])) push(m.value, 18, 'text_employer', m.sentence);
  } else if (relation === 'country_of_citizenship') {
    const nat = NATIONALITY_RE.exec(first) || NATIONALITY_RE.exec(t);
    if (nat?.[1]) push(nat[1], 14, 'text_nationality_word', first);
    for (const m of sentenceMatches(t, [
      /\bfrom\s+([^.;]+)/i,
      /\bbased in\s+([^.;]+)/i,
    ])) push(stripTrailingConjunctions(m.value), 8, 'text_from_based_in', m.sentence);
  } else if (relation === 'place_of_burial') {
    for (const m of sentenceMatches(t, [
      /\bburied\s+(?:in|at)\s+([^.;]+)/i,
      /\binterred\s+(?:in|at)\s+([^.;]+)/i,
    ])) push(stripTrailingConjunctions(m.value), 18, 'text_place_of_burial', m.sentence);
  } else if (relation === 'award_received') {
    for (const m of sentenceMatches(t, [
      /\bwon\s+(?:the\s+)?([^.;]*?Award[^.;]*)/i,
      /\breceived\s+(?:the\s+)?([^.;]*?Award[^.;]*)/i,
      /\bawarded\s+(?:the\s+)?([^.;]*?Award[^.;]*)/i,
      /\bnamed\s+(?:a|an|the)?\s*\"?([^\".;]*?(?:Artist|Laureate|Prize|Award|Medal|Order)[^\".;]*)\"?/i,
    ])) push(stripTrailingConjunctions(m.value), 14, 'text_award', m.sentence);
  }

  // De-duplicate by normalized value.
  const seen = new Set();
  return out.filter((x) => {
    const key = norm(x.value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 8);
}

function relationFromGraph(subjectTitle, relation, row, selectedTitles, adjacency, docText) {
  const out = [];
  const ns = norm(subjectTitle);
  const neighbors = adjacency.get(ns) || [];
  const selectedNorm = new Set(selectedTitles.map(norm));
  const dt = norm(docText || '');
  for (const nb of neighbors) {
    if (!selectedNorm.has(norm(nb.title)) || isGenericTitle(nb.title)) continue;
    let score = 7;
    const nt = norm(nb.title);
    if (dt.includes(nt)) score += 3;
    if (['father', 'mother', 'spouse', 'director', 'performer', 'composer', 'founder', 'child'].includes(relation)) score += 2;
    out.push({ value: nb.title, title: nb.title, score, source: 'title_graph_neighbor', sentence: snippetAround(docText, nb.title) });
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, 8);
}

function relationOutputs(subjectTitle, relation, row, item, index, selectedTitles, adjacency) {
  const doc = docForTitle(subjectTitle, row.qid, index);
  const text = doc?.text || '';
  const knownTitles = [...new Set([...selectedTitles, ...allContextTitles(row.qid, index)])];
  const textOutputs = extractRelationFromText(relation, subjectTitle, text).map((x) => {
    const mt = matchKnownTitle(x.value, knownTitles);
    return { ...x, title: mt?.title || null, score: x.score + (mt ? mt.score / 4 : 0), evidence_title: subjectTitle };
  });
  const graphEligible = ['father', 'mother', 'spouse', 'child', 'director', 'performer', 'composer', 'founder'].includes(relation);
  const graphOutputs = graphEligible
    ? relationFromGraph(subjectTitle, relation, row, selectedTitles, adjacency, text).map((x) => ({ ...x, evidence_title: subjectTitle }))
    : [];
  const combined = [...textOutputs, ...graphOutputs];
  const seen = new Set();
  return combined.filter((x) => {
    const key = norm(x.title || x.value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => b.score - a.score).slice(0, 10);
}

function makeCandidates(row, item, index) {
  const selectedTitles = row.selected_titles || [];
  const q = parseQuestion(row.question);
  const adjacency = buildAdjacency(row.edges || []);
  const contextTitles = allContextTitles(row.qid, index);
  const knownTitles = [...new Set([...selectedTitles, ...contextTitles])];
  const starts = matchTitlesInQuestion(row.question, selectedTitles, row.seeds || []);
  const fallbackStarts = starts.length ? [] : matchTitlesInQuestion(row.question, knownTitles, row.seeds || []).slice(0, 3);
  const startCandidates = (starts.length ? starts : fallbackStarts).slice(0, 5);

  const candidates = [];
  const genericSuppressed = selectedTitles.filter(isGenericTitle).length;
  const riskFlags = [];
  if (genericSuppressed) riskFlags.push('generic_title_suppressed');
  if ((row.edges || []).length >= 15) riskFlags.push('crowded_title_graph');
  if (q.steps.length >= 2) riskFlags.push('multi_step_relation');
  if (/grand/.test(q.template)) riskFlags.push('grandparent_template');
  if (/country|nationality|place|date|educated|employer|award/.test(q.template)) riskFlags.push('attribute_owner_template');

  if (!q.steps.length) {
    return {
      question_parse: q,
      start_candidates: startCandidates,
      generic_suppressed: genericSuppressed,
      risk_flags: [...new Set([...riskFlags, 'template_unknown'])],
      candidates: [],
    };
  }

  for (const start of startCandidates) {
    let beams = [{
      current_title: start.title,
      score: start.score,
      chain: [],
      answer: null,
      answer_source: null,
      complete: false,
      failures: [],
    }];
    for (const [stepIndex, relation] of q.steps.entries()) {
      const isLast = stepIndex === q.steps.length - 1;
      const next = [];
      for (const beam of beams) {
        if (!beam.current_title) {
          next.push({ ...beam, failures: [...beam.failures, `missing_subject_for_${relation}`] });
          continue;
        }
        const outputs = relationOutputs(beam.current_title, relation, row, item, index, selectedTitles, adjacency);
        if (!outputs.length) {
          next.push({ ...beam, score: beam.score - 8, failures: [...beam.failures, `no_${relation}_candidate`] });
          continue;
        }
        for (const out of outputs.slice(0, 5)) {
          const answerish = isLast && !out.title;
          const matchedTitle = out.title || (isLast && ['father', 'mother', 'spouse', 'child', 'director', 'performer', 'composer', 'founder'].includes(relation) ? matchKnownTitle(out.value, knownTitles)?.title : null);
          const step = {
            step: stepIndex + 1,
            relation,
            from: beam.current_title,
            to: out.value,
            to_title: matchedTitle || null,
            evidence_title: out.evidence_title || beam.current_title,
            source: out.source,
            score: Number(out.score.toFixed(3)),
            snippet: out.sentence ? String(out.sentence).replace(/\s+/g, ' ').trim().slice(0, 260) : '',
          };
          const stepScore = isLast
            ? out.score + 4
            : matchedTitle
              ? out.score + 4
              : out.score - 12;
          next.push({
            current_title: matchedTitle || null,
            score: beam.score + stepScore,
            chain: [...beam.chain, step],
            answer: isLast ? out.value : null,
            answer_source: isLast ? out.source : null,
            complete: isLast,
            failures: [...beam.failures],
          });
        }
      }
      beams = next.sort((a, b) => b.score - a.score).slice(0, 12);
    }
    for (const beam of beams) {
      const chainTitles = beam.chain.flatMap((s) => [s.from, s.to_title || s.to]).filter(Boolean);
      const evidenceTitles = [...new Set(beam.chain.map((s) => s.evidence_title).filter(Boolean))];
      candidates.push({
        template: q.template,
        steps: q.steps,
        start_entity: start.title,
        answer_slot: q.answer_slot,
        candidate_chain: beam.chain,
        answer_candidate: beam.answer,
        answer_source: beam.answer_source,
        evidence_titles: [...new Set(evidenceTitles)],
        chain_titles: [...new Set(chainTitles)],
        operational_score: Number(beam.score.toFixed(3)),
        risk_flags: [...new Set(riskFlags)],
        failures: beam.failures,
        complete: Boolean(beam.complete && beam.answer),
      });
    }
  }

  candidates.sort((a, b) => b.operational_score - a.operational_score);
  return {
    question_parse: q,
    start_candidates: startCandidates,
    generic_suppressed: genericSuppressed,
    risk_flags: [...new Set(riskFlags)],
    candidates: candidates.slice(0, 20),
  };
}

function supportRecall(candidate, supportTitles = []) {
  const support = (supportTitles || []).map((x) => norm(x)).filter(Boolean);
  if (!support.length) return { recall: 0, full: false, matched: [] };
  const evidence = new Set((candidate?.chain_titles || []).concat(candidate?.evidence_titles || []).map(norm));
  const matched = support.filter((s) => [...evidence].some((e) => e === s || e.includes(s) || s.includes(e)));
  return { recall: matched.length / support.length, full: matched.length === support.length, matched };
}

function compareToRun(row, currentRow) {
  const cfgPath = row.conditions?.entity_hop_path_prompt || {};
  const curPath = currentRow?.conditions?.entity_hop_path_prompt || {};
  return {
    config0_path_prompt: {
      em: Number(cfgPath.em || 0),
      contains: Number(cfgPath.contains || 0),
      f1: Number(cfgPath.f1 || 0),
      output: String(cfgPath.output || ''),
    },
    current_path_prompt: {
      em: Number(curPath.em || 0),
      contains: Number(curPath.contains || 0),
      f1: Number(curPath.f1 || 0),
      output: String(curPath.output || ''),
    },
  };
}

function summarize(records, config0, current) {
  const total = records.length;
  const safeDiv = (a, b = total) => (b ? a / b : 0);
  const top = records.map((r) => r.top_candidate).filter(Boolean);
  const answerTop = top.filter((c) => c.answer_candidate);
  const metricSums = records.reduce((acc, r) => {
    const m = r.posthoc_top_metrics || { em: 0, contains: 0, f1: 0 };
    acc.em += m.em; acc.contains += m.contains; acc.f1 += m.f1;
    acc.support += r.posthoc_support_recall?.recall || 0;
    acc.full += r.posthoc_support_recall?.full ? 1 : 0;
    return acc;
  }, { em: 0, contains: 0, f1: 0, support: 0, full: 0 });

  const byTemplate = new Map();
  for (const r of records) {
    const t = r.question_parse.template;
    if (!byTemplate.has(t)) byTemplate.set(t, { count: 0, answer_candidates: 0, em: 0, contains: 0, f1: 0, support: 0, full: 0 });
    const s = byTemplate.get(t);
    s.count += 1;
    if (r.top_candidate?.answer_candidate) s.answer_candidates += 1;
    s.em += r.posthoc_top_metrics?.em || 0;
    s.contains += r.posthoc_top_metrics?.contains || 0;
    s.f1 += r.posthoc_top_metrics?.f1 || 0;
    s.support += r.posthoc_support_recall?.recall || 0;
    s.full += r.posthoc_support_recall?.full ? 1 : 0;
  }

  const byRisk = new Map();
  for (const r of records) {
    const flags = r.risk_flags.length ? r.risk_flags : ['no_flag'];
    for (const f of flags) {
      if (!byRisk.has(f)) byRisk.set(f, { count: 0, answer_candidates: 0, em: 0, f1: 0 });
      const s = byRisk.get(f);
      s.count += 1;
      if (r.top_candidate?.answer_candidate) s.answer_candidates += 1;
      s.em += r.posthoc_top_metrics?.em || 0;
      s.f1 += r.posthoc_top_metrics?.f1 || 0;
    }
  }

  const ambiguous = records.filter((r) => {
    const c = r.candidates || [];
    if (c.length < 2) return false;
    return Math.abs((c[0].operational_score || 0) - (c[1].operational_score || 0)) < 3;
  }).length;

  const configMacro = config0.macro?.entity_hop_path_prompt || {};
  const currentMacro = current.macro?.entity_hop_path_prompt || {};
  const pairwise = records.reduce((acc, r) => {
    const em = r.posthoc_top_metrics?.em || 0;
    const cfg = r.prior_run_metrics.config0_path_prompt.em || 0;
    const cur = r.prior_run_metrics.current_path_prompt.em || 0;
    if (em > cfg) acc.vs_config0.wins += 1; else if (em < cfg) acc.vs_config0.losses += 1; else acc.vs_config0.ties += 1;
    if (em > cur) acc.vs_current.wins += 1; else if (em < cur) acc.vs_current.losses += 1; else acc.vs_current.ties += 1;
    return acc;
  }, { vs_config0: { wins: 0, losses: 0, ties: 0 }, vs_current: { wins: 0, losses: 0, ties: 0 } });

  return {
    schema: 'realrag.path_candidates.v2.summary',
    generated_at: new Date().toISOString(),
    input: {
      config0_summary: INPUTS.config0,
      current_summary: INPUTS.current,
      dataset: DATASET,
      dataset_use: 'question/context text only for operational extraction; supporting_facts/evidences/gold used only for posthoc diagnostics',
    },
    total,
    operational_metrics: {
      start_entity_found_rate: safeDiv(records.filter((r) => r.start_candidates.length).length),
      candidate_row_rate: safeDiv(records.filter((r) => r.candidates.length).length),
      top_answer_candidate_rate: safeDiv(answerTop.length),
      single_top_candidate_rate: safeDiv(records.filter((r) => r.candidates.length === 1).length),
      ambiguous_top_candidate_rate: safeDiv(ambiguous),
      generic_title_suppression_rows: records.filter((r) => r.generic_suppressed > 0).length,
      generic_title_suppression_count: records.reduce((a, r) => a + r.generic_suppressed, 0),
      avg_candidate_count: safeDiv(records.reduce((a, r) => a + r.candidates.length, 0)),
    },
    posthoc_diagnostics_not_used_for_selection: {
      top_candidate_em: safeDiv(metricSums.em),
      top_candidate_contains: safeDiv(metricSums.contains),
      top_candidate_f1: safeDiv(metricSums.f1),
      top_path_support_title_recall: safeDiv(metricSums.support),
      top_path_full_support_rate: safeDiv(metricSums.full),
      config0_path_prompt_macro: configMacro,
      current_path_prompt_macro: currentMacro,
      top_candidate_vs_config0_path_prompt: {
        em_delta: safeDiv(metricSums.em) - Number(configMacro.em || 0),
        contains_delta: safeDiv(metricSums.contains) - Number(configMacro.contains || 0),
        f1_delta: safeDiv(metricSums.f1) - Number(configMacro.f1 || 0),
      },
      pairwise_em_movement: pairwise,
    },
    by_template: [...byTemplate.entries()].map(([template, s]) => ({
      template,
      count: s.count,
      answer_candidate_rate: safeDiv(s.answer_candidates, s.count),
      posthoc_em: safeDiv(s.em, s.count),
      posthoc_contains: safeDiv(s.contains, s.count),
      posthoc_f1: safeDiv(s.f1, s.count),
      posthoc_support_recall: safeDiv(s.support, s.count),
      posthoc_full_support_rate: safeDiv(s.full, s.count),
    })).sort((a, b) => b.count - a.count || a.template.localeCompare(b.template)),
    by_risk_flag: [...byRisk.entries()].map(([flag, s]) => ({
      flag,
      count: s.count,
      answer_candidate_rate: safeDiv(s.answer_candidates, s.count),
      posthoc_em: safeDiv(s.em, s.count),
      posthoc_f1: safeDiv(s.f1, s.count),
    })).sort((a, b) => b.count - a.count || a.flag.localeCompare(b.flag)),
    stop_or_continue: decide(records, metricSums, configMacro),
  };
}

function decide(records, metricSums, configMacro) {
  const total = records.length || 1;
  const startRate = records.filter((r) => r.start_candidates.length).length / total;
  const answerRate = records.filter((r) => r.top_candidate?.answer_candidate).length / total;
  const supportRate = metricSums.full / total;
  const f1 = metricSums.f1 / total;
  const cfgF1 = Number(configMacro.f1 || 0);
  const reasons = [];
  if (startRate < 0.5) reasons.push('start_entity_found_rate_below_0p50');
  if (answerRate < 0.25) reasons.push('answer_candidate_rate_below_0p25');
  if (supportRate < 0.25) reasons.push('path_full_support_rate_below_0p25');
  if (f1 + 0.05 < cfgF1) reasons.push('no_llm_candidate_f1_far_below_config0_prompt');
  if (!reasons.length) reasons.push('path_object_ready_for_manual_review_not_4090_yet');
  return {
    decision: reasons[0] === 'path_object_ready_for_manual_review_not_4090_yet' ? 'manual_review_next' : 'revise_no_llm_candidate_extractor_before_4090',
    reasons,
    no_4090: true,
  };
}

function main() {
  const config0 = readJson(INPUTS.config0);
  const current = readJson(INPUTS.current);
  const data = readJson(DATASET);
  const index = buildDatasetIndex(data);
  const currentRows = new Map(current.rows.map((r) => [String(r.qid), r]));
  const records = [];
  for (const row of config0.rows) {
    const item = index.byId.get(String(row.qid));
    if (!item) throw new Error(`missing dataset item for ${row.qid}`);
    const built = makeCandidates(row, item, index);
    const top = built.candidates[0] || null;
    const support = supportRecall(top, row.support_titles || []);
    const metrics = top?.answer_candidate ? {
      em: exactMatch(top.answer_candidate, row.gold),
      contains: containsMatch(top.answer_candidate, row.gold),
      f1: f1Score(top.answer_candidate, row.gold),
    } : { em: 0, contains: 0, f1: 0 };
    records.push({
      schema: 'realrag.path_candidate_case.v2',
      idx: row.idx,
      qid: row.qid,
      question: row.question,
      gold: row.gold,
      support_titles: row.support_titles || [],
      question_parse: built.question_parse,
      start_candidates: built.start_candidates,
      generic_suppressed: built.generic_suppressed,
      risk_flags: built.risk_flags,
      candidate_count: built.candidates.length,
      top_candidate: top,
      candidates: built.candidates,
      posthoc_top_metrics: metrics,
      posthoc_support_recall: support,
      prior_run_metrics: compareToRun(row, currentRows.get(String(row.qid))),
      selected_titles: row.selected_titles || [],
    });
  }

  fs.mkdirSync(ROOT, { recursive: true });
  fs.writeFileSync(OUT_JSONL, records.map((r) => JSON.stringify(r)).join('\n') + '\n');
  const summary = summarize(records, config0, current);
  writeJson(OUT_SUMMARY, summary);
  console.log(JSON.stringify(summary, null, 2));
}

main();
