#!/usr/bin/env node
/**
 * auto-fix.mjs -- One-shot fixer for execution plan markdown files.
 * Applies all corrections from FIX-BEFORE-START.md and FIX-ROUND-2.md.
 *
 * Usage:  node auto-fix.mjs
 * No npm dependencies required (fs + path only).
 */

import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── helpers ────────────────────────────────────────────────────────

function loadFile(name) {
  const p = join(__dirname, name);
  return readFileSync(p, 'utf-8');
}

function saveFile(name, content) {
  const p = join(__dirname, name);
  writeFileSync(p, content, 'utf-8');
}

function backup(name) {
  const src = join(__dirname, name);
  const dst = src + '.bak';
  copyFileSync(src, dst);
}

/** Apply a list of [pattern, replacement] pairs. Returns { text, count }. */
function applyRules(text, rules) {
  let count = 0;
  for (const [pat, rep] of rules) {
    const regex = typeof pat === 'string' ? new RegExp(escapeRe(pat), 'g') : pat;
    const before = text;
    text = text.replace(regex, rep);
    // count every occurrence that was actually replaced
    const diff = (before.match(regex) || []).length;
    if (diff > 0) count += diff;
  }
  return { text, count };
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Remove whole lines that match a pattern (exact or regex). */
function deleteLines(text, patterns) {
  let count = 0;
  const lines = text.split('\n');
  const out = [];
  for (const line of lines) {
    let matched = false;
    for (const pat of patterns) {
      const re = typeof pat === 'string' ? new RegExp(escapeRe(pat)) : pat;
      if (re.test(line)) { matched = true; break; }
    }
    if (matched) { count++; } else { out.push(line); }
  }
  return { text: out.join('\n'), count };
}

// ── per-file rule sets ─────────────────────────────────────────────

function fixMasterSequence(src) {
  // Order matters: specific paths first, generic `src/server/` last.
  const rules = [
    ['src/server/services/ai/',                  'src/lib/ai/'],
    ['src/server/services/requirement-engine',   'src/lib/engines/requirement-engine'],
    ['src/server/services/feature-map-engine',   'src/lib/engines/feature-map-engine'],
    ['src/server/services/codegen/',             'src/lib/engines/codegen/'],
    ['src/server/services/translation/',         'src/lib/translation/'],
    ['src/server/services/quality/',             'src/lib/quality/'],
    ['src/server/services/deploy/',              'src/lib/deploy/'],
    ['src/server/services/screenshot/',          'src/lib/screenshot/'],
    ['src/server/services/acceptance/',           'src/lib/acceptance/'],
    ['src/server/services/pipeline/',            'src/lib/pipeline/'],
    ['src/server/services/project-service',      'src/lib/services/project-service'],
    ['src/server/services/dag-service',          'src/lib/services/dag-service'],
    ['src/server/services/storage',              'src/lib/storage/storage'],
    ['src/server/workers/',                      'src/lib/queue/workers/'],
    ['src/server/queue/',                        'src/lib/queue/'],
    ['src/server/websocket/',                    'src/lib/socket/'],
    ['src/server/db/',                           'src/lib/db/'],
    // catch-all for any remaining src/server/ references
    ['src/server/',                              'src/lib/'],
    // Prisma / auth replacements
    [/prisma migrate dev/g,                      '[REPLACED-BY-SUPABASE]'],
    [/npx prisma/g,                              '[REPLACED-BY-SUPABASE]'],
    ['@auth/prisma-adapter',                     '[REPLACED-BY-SUPABASE-AUTH]'],
    ['@auth/supabase-adapter',                   '[REPLACED-BY-SUPABASE-AUTH]'],
  ];
  return applyRules(src, rules);
}

function fixProjectInit(src) {
  // Line deletions first
  const delPatterns = [
    /^\s*-\s*next-auth/,                        // next-auth dep line
    /^\s*-\s*prisma\b/,                         // prisma dep line
    /^\s*-\s*@prisma\/client/,                  // @prisma/client dep line
    /next-auth@/,                               // install cmd referencing next-auth
    /prisma@/,                                  // install cmd referencing prisma
    /@prisma\/client@/,                         // install cmd referencing @prisma/client
    /mkdir -p src\/app\/api\/auth\/\[\.\.\.nextauth\]/, // mkdir nextauth
    /auth\/\[\.\.\.nextauth\]\/route\.ts/,      // tree line for nextauth route
    /NEXTAUTH_URL/,                             // .env NEXTAUTH_URL
    /NEXTAUTH_SECRET/,                          // .env NEXTAUTH_SECRET
  ];
  const del = deleteLines(src, delPatterns);

  // String replacements
  const rules = [
    ['src/db/',                     'src/lib/db/'],
    ['CLAUDE_API_KEY',              'ANTHROPIC_API_KEY'],
    ['CLOUDFLARE_R2_ACCESS_KEY',    'CLOUDFLARE_R2_ACCESS_KEY_ID'],
  ];
  // Avoid double-replacing CLOUDFLARE_R2_ACCESS_KEY_ID_ID:
  // We need to be careful with the last rule. Replace exact key only when
  // it is NOT already followed by _ID.
  rules.pop(); // remove the naive rule
  const refined = [
    ...rules,
    [/CLOUDFLARE_R2_ACCESS_KEY(?!_ID)/g, 'CLOUDFLARE_R2_ACCESS_KEY_ID'],
  ];
  const rep = applyRules(del.text, refined);
  return { text: rep.text, count: del.count + rep.count };
}

function fixUiFramework(src) {
  const rules = [
    [/from 'reactflow'/g,                       "from '@xyflow/react'"],
    [/from "reactflow"/g,                        "from '@xyflow/react'"],
    [/import ReactFlow\b/g,                      'import { ReactFlow }'],
    ["'reactflow/dist/style.css'",               "'@xyflow/react/dist/style.css'"],
    ['"reactflow/dist/style.css"',               '"@xyflow/react/dist/style.css"'],
    ['Next.js 14',                               'Next.js 15'],
    ["from 'next-themes/dist/types'",            "from 'next-themes'"],
    ['"next-themes/dist/types"',                 '"next-themes"'],
    ['KanbanIcon',                               'LayoutDashboardIcon'],
  ];
  return applyRules(src, rules);
}

function fixAiEngine(src) {
  const rules = [
    ['process.env.CLAUDE_API_KEY',  'process.env.ANTHROPIC_API_KEY'],
    ['CLAUDE_API_KEY',              'ANTHROPIC_API_KEY'],
  ];
  let result = applyRules(src, rules);
  // Add src/ prefix to bare `lib/` paths (only when not already prefixed)
  const libFix = result.text.replace(/(?<![a-zA-Z0-9_\-\/])lib\//g, (match, offset) => {
    // Check whether `src/` already precedes this `lib/`
    const before = result.text.substring(Math.max(0, offset - 4), offset);
    if (before.endsWith('src/')) return match;
    result.count++;
    return 'src/lib/';
  });
  result.text = libFix;
  return result;
}

function fixDeployPreview(src) {
  // Add src/ prefix to bare `lib/` paths first
  let count = 0;
  let text = src.replace(/(?<![a-zA-Z0-9_\-\/])lib\//g, (match, offset) => {
    const before = src.substring(Math.max(0, offset - 4), offset);
    if (before.endsWith('src/')) return match;
    count++;
    return 'src/lib/';
  });

  const rules = [
    [/\bCF_ACCOUNT_ID\b/g,           'CLOUDFLARE_ACCOUNT_ID'],
    [/\bR2_ACCESS_KEY_ID\b/g,        'CLOUDFLARE_R2_ACCESS_KEY_ID'],
    [/\bR2_SECRET_ACCESS_KEY\b/g,    'CLOUDFLARE_R2_SECRET_ACCESS_KEY'],
    [/\bR2_BUCKET_NAME\b/g,          'CLOUDFLARE_R2_BUCKET'],
  ];
  const rep = applyRules(text, rules);
  return { text: rep.text, count: count + rep.count };
}

// ── main ───────────────────────────────────────────────────────────

const targets = [
  { file: 'MASTER-SEQUENCE.md',  fix: fixMasterSequence },
  { file: '00-project-init.md',  fix: fixProjectInit },
  { file: '01-ui-framework.md',  fix: fixUiFramework },
  { file: '02-ai-engine.md',     fix: fixAiEngine },
  { file: '03-deploy-preview.md', fix: fixDeployPreview },
];

console.log('=== auto-fix.mjs ===\n');

let totalFiles = 0;
let totalReplacements = 0;

for (const { file, fix } of targets) {
  try {
    const original = loadFile(file);
    backup(file);

    const { text, count } = fix(original);

    if (count === 0) {
      console.log(`  ${file}: no changes needed (already clean)`);
    } else {
      saveFile(file, text);
      console.log(`  ${file}: ${count} replacements applied`);
      totalFiles++;
      totalReplacements += count;
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`  ${file}: SKIPPED (file not found)`);
    } else {
      console.error(`  ${file}: ERROR — ${err.message}`);
    }
  }
}

console.log(`\nDone. ${totalReplacements} total replacements across ${totalFiles} files.`);
console.log('Backups saved as *.md.bak in the same directory.');
