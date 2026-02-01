import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

export type NavEdge = {
  from: string;
  to: string;
  ts: string;
  pageNameFrom?: string;
  pageNameTo?: string;
};

export type GenerationSummary = {
  baseUrl: string;
  generatedAt: string;
  pages: Array<{ name: string; filePath: string; url: string }>;
};

export type PlanFlow = {
  name: string;
  steps: Array<{ page: string; url: string }>;
  suggestedEdgeCases: string[];
  risk: 'low' | 'medium' | 'high';
};

export type TestPlan = {
  baseUrl: string;
  generatedAt: string;
  flows: PlanFlow[];
  notes: string[];
};

function normalize(u: string) {
  try {
    const url = new URL(u);
    url.hash = '';
    return url.toString();
  } catch {
    return u;
  }
}

function buildUrlToPageName(summary: GenerationSummary) {
  const m = new Map<string, string>();
  for (const p of summary.pages) m.set(normalize(p.url), p.name);
  return m;
}

function heuristicFlowName(pages: string[]) {
  const a = pages.filter(Boolean);
  if (a.length <= 1) return a[0] ? `${a[0]} journey` : 'Journey';
  return `${a[0]} → ${a[a.length - 1]}`;
}

function heuristicRisk(pages: string[], urls: string[]) {
  const blob = (pages.join(' ') + ' ' + urls.join(' ')).toLowerCase();
  if (/login|signin|auth|mfa|otp|admin|payment|checkout|approve|delete|user management/.test(blob)) return 'high';
  if (/create|edit|update|submit|save|upload/.test(blob)) return 'medium';
  return 'low';
}

function heuristicEdgeCases(pages: string[], urls: string[]) {
  const out: string[] = [];
  const blob = (pages.join(' ') + ' ' + urls.join(' ')).toLowerCase();
  if (/login|signin|auth/.test(blob)) {
    out.push('Invalid username/password shows a friendly error');
    out.push('Locked/disabled user cannot login');
    out.push('Session timeout redirects to Login and preserves return URL');
  }
  if (/mfa|otp/.test(blob)) {
    out.push('Invalid MFA/OTP code is rejected');
    out.push('Resend code works and rate limits apply');
  }
  out.push('Required field validation messages appear when submitting empty form');
  out.push('Navigation back/refresh does not break the flow');
  return Array.from(new Set(out)).slice(0, 8);
}

async function aiFlowNameAndCases(params: { baseUrl: string; pages: string[]; urls: string[] }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      name: heuristicFlowName(params.pages),
      cases: heuristicEdgeCases(params.pages, params.urls),
    };
  }

  try {
    const prompt = `You are a QA automation architect. Given a user journey (sequence of pages visited), return:\n1) A short flow name\n2) 5-8 suggested edge cases\n\nReturn JSON only with keys: name, cases (array of strings).\n\nBaseURL: ${params.baseUrl}\nPages: ${params.pages.join(' -> ')}\nURLs: ${params.urls.join(' -> ')}\n`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Return only strict JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!res.ok) throw new Error('OpenAI request failed');
    const json: any = await res.json();
    const text = String(json?.choices?.[0]?.message?.content ?? '').trim();
    const parsed = JSON.parse(text);
    const name = String(parsed?.name ?? '').trim() || heuristicFlowName(params.pages);
    const cases = Array.isArray(parsed?.cases) ? parsed.cases.map((x: any) => String(x)).filter(Boolean) : heuristicEdgeCases(params.pages, params.urls);
    return { name, cases: cases.slice(0, 10) };
  } catch {
    return {
      name: heuristicFlowName(params.pages),
      cases: heuristicEdgeCases(params.pages, params.urls),
    };
  }
}

function computeFlows(summary: GenerationSummary, edges: NavEdge[]) {
  const urlToName = buildUrlToPageName(summary);

  // Build adjacency and also keep a simple "sessions" list by chaining edges in time order.
  const ordered = edges
    .map((e) => ({ ...e, from: normalize(e.from), to: normalize(e.to) }))
    .filter((e) => e.from && e.to && e.from !== e.to)
    .sort((a, b) => String(a.ts).localeCompare(String(b.ts)));

  // Greedy chain: if next.from == current.to, extend path; else start new.
  const paths: string[][] = [];
  let cur: string[] = [];

  for (const e of ordered) {
    if (!cur.length) {
      cur = [e.from, e.to];
      continue;
    }
    if (cur[cur.length - 1] === e.from) {
      cur.push(e.to);
    } else {
      paths.push(cur);
      cur = [e.from, e.to];
    }
  }
  if (cur.length) paths.push(cur);

  // De-dup paths by normalized sequence
  const uniq = new Map<string, string[]>();
  for (const p of paths) {
    const compact: string[] = [];
    for (const u of p) {
      if (!compact.length || compact[compact.length - 1] !== u) compact.push(u);
    }
    const key = compact.join(' -> ');
    if (!uniq.has(key) && compact.length >= 2) uniq.set(key, compact);
  }

  return Array.from(uniq.values()).slice(0, 25).map((seq) => {
    const steps = seq.map((u) => ({ url: u, page: urlToName.get(u) ?? 'UnknownPage' }));
    const pages = steps.map((s) => s.page);
    const urls = steps.map((s) => s.url);
    return { steps, pages, urls };
  });
}

export async function generatePlan(params: { summaryPath: string; navPath?: string; outPath?: string }) {
  const summaryRaw = await fs.readFile(params.summaryPath, 'utf-8');
  const summary = JSON.parse(summaryRaw) as GenerationSummary;

  const navPath = params.navPath ?? path.join(path.dirname(params.summaryPath), 'qa-genie.nav.json');
  let edges: NavEdge[] = [];
  try {
    edges = JSON.parse(await fs.readFile(navPath, 'utf-8')) as NavEdge[];
  } catch {
    // ok
  }

  let flowsBase = computeFlows(summary, edges);

  // Fallback: older recordings may not have nav edges.
  if (!flowsBase.length && summary.pages.length) {
    flowsBase = [
      {
        steps: summary.pages.map((p) => ({ url: p.url, page: p.name })),
        pages: summary.pages.map((p) => p.name),
        urls: summary.pages.map((p) => p.url),
      },
    ];
  }

  const flows: PlanFlow[] = [];
  for (const f of flowsBase) {
    const ai = await aiFlowNameAndCases({ baseUrl: summary.baseUrl, pages: f.pages, urls: f.urls });
    flows.push({
      name: ai.name,
      steps: f.steps,
      suggestedEdgeCases: ai.cases,
      risk: heuristicRisk(f.pages, f.urls),
    });
  }

  const plan: TestPlan = {
    baseUrl: summary.baseUrl,
    generatedAt: new Date().toISOString(),
    flows,
    notes: [
      'This plan is generated from observed navigation and is best-effort.',
      'Use it to prioritize test coverage and to drive test generation later.',
    ],
  };

  const outPath = params.outPath ?? path.join(path.dirname(params.summaryPath), 'qa-genie.plan.yaml');
  await fs.writeFile(outPath, YAML.stringify(plan), 'utf-8');

  return { plan, outPath, navPath };
}
