import type { QeReportEnvelope } from './core/index.js';
import type { QeReportJson } from './core/report-schema.js';

/** Escape dynamic text for safe HTML embedding. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function confidenceClass(level: string): string {
  const normalized = level.toLowerCase();
  if (normalized === 'high') return 'badge-high';
  if (normalized === 'low') return 'badge-low';
  return 'badge-medium';
}

function renderList(items: string[]): string {
  if (items.length === 0) {
    return '<p class="muted">None</p>';
  }
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function renderGaps(
  gaps: QeReportJson['gaps'],
): string {
  if (gaps.length === 0) {
    return '<p class="muted">None</p>';
  }
  const rows = gaps
    .map(
      (gap) =>
        `<tr><td>${escapeHtml(gap.text)}</td><td>${gap.assumed ? 'Yes' : 'No'}</td></tr>`,
    )
    .join('');
  return `<table><thead><tr><th>Gap</th><th>Assumed</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderRisks(risks: QeReportJson['risks']): string {
  const rows = risks
    .map(
      (risk) =>
        `<tr>
          <td>${escapeHtml(risk.title)}</td>
          <td>${escapeHtml(risk.impact)}</td>
          <td>${escapeHtml(risk.likelihood)}</td>
          <td>${escapeHtml(risk.detection)}</td>
          <td>${escapeHtml(risk.mitigation)}</td>
        </tr>`,
    )
    .join('');
  return `<table class="wide"><thead><tr>
    <th>Risk</th><th>Impact</th><th>Likelihood</th><th>Detection</th><th>Mitigation</th>
  </tr></thead><tbody>${rows}</tbody></table>`;
}

function renderScenarios(scenarios: QeReportJson['scenarios']): string {
  if (scenarios.length === 0) {
    return '<p class="muted">None</p>';
  }
  const rows = scenarios
    .map(
      (scenario) =>
        `<tr>
          <td>${escapeHtml(scenario.id)}</td>
          <td>${escapeHtml(scenario.name)}</td>
          <td>${escapeHtml(scenario.exploration)}</td>
          <td><span class="evidence-${escapeHtml(scenario.evidence.type)}">${escapeHtml(scenario.evidence.text)}</span> <span class="tag">${escapeHtml(scenario.evidence.type)}</span></td>
          <td><span class="badge ${confidenceClass(scenario.confidence)}">${escapeHtml(scenario.confidence)}</span></td>
          <td>${escapeHtml(scenario.why)}</td>
          <td>${escapeHtml(scenario.layer)}</td>
        </tr>`,
    )
    .join('');
  return `<table class="wide"><thead><tr>
    <th>#</th><th>Scenario</th><th>Exploration</th><th>Evidence</th><th>Confidence</th><th>Why</th><th>Layer</th>
  </tr></thead><tbody>${rows}</tbody></table>`;
}

function renderAutomation(automation: QeReportJson['automation']): string {
  if (automation.length === 0) {
    return '<p class="muted">None</p>';
  }
  const rows = automation
    .map(
      (entry) =>
        `<tr><td>${escapeHtml(entry.layer)}</td><td>${escapeHtml(entry.note)}</td></tr>`,
    )
    .join('');
  return `<table><thead><tr><th>Layer</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderNonfunctional(nf: QeReportJson['nonfunctional']): string {
  const rows = (
    ['performance', 'security', 'accessibility', 'observability'] as const
  )
    .map(
      (key) =>
        `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(nf[key])}</td></tr>`,
    )
    .join('');
  return `<table><tbody>${rows}</tbody></table>`;
}

function renderCoverageGaps(gaps: QeReportJson['coverageGaps']): string {
  if (!gaps || gaps.length === 0) {
    return '<p class="muted">None</p>';
  }
  const rows = gaps
    .map(
      (gap) =>
        `<tr><td>${escapeHtml(gap.text)}</td><td>${gap.reason ? escapeHtml(gap.reason) : '—'}</td></tr>`,
    )
    .join('');
  return `<table><thead><tr><th>Gap</th><th>Reason</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderRepoCandidates(candidates: QeReportJson['repoCandidates']): string {
  if (!candidates || candidates.length === 0) {
    return '';
  }
  const rows = candidates
    .map(
      (c) =>
        `<tr>
          <td>${escapeHtml(c.candidate)}</td>
          <td>${escapeHtml(c.evidence)}</td>
          <td>${escapeHtml(c.confidence)}</td>
          <td>${escapeHtml(c.verifyHow)}</td>
        </tr>`,
    )
    .join('');
  return `<h3>Repo candidates</h3>
    <table class="wide"><thead><tr>
      <th>Candidate</th><th>Evidence</th><th>Confidence</th><th>Verify how</th>
    </tr></thead><tbody>${rows}</tbody></table>`;
}

function renderRepoLedger(ledger: QeReportJson['repoLedger']): string {
  if (!ledger || ledger.length === 0) {
    return '';
  }
  const rows = ledger
    .map(
      (entry) =>
        `<tr>
          <td>${escapeHtml(entry.repo)}</td>
          <td>${escapeHtml(entry.role)}</td>
          <td>${escapeHtml(entry.scopeCertainty)}</td>
          <td>${escapeHtml(entry.requestedDepth)}</td>
          <td>${escapeHtml(entry.status)}</td>
          <td>${escapeHtml(entry.evidenceOrReason)}</td>
        </tr>`,
    )
    .join('');
  return `<h3>Repo ledger</h3>
    <table class="wide"><thead><tr>
      <th>Repo</th><th>Role</th><th>Certainty</th><th>Depth</th><th>Status</th><th>Evidence / reason</th>
    </tr></thead><tbody>${rows}</tbody></table>`;
}

function renderDropped(dropped: QeReportJson['droppedScenarios']): string {
  if (!dropped || dropped.length === 0) {
    return '';
  }
  const rows = dropped
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.reason)}</td></tr>`,
    )
    .join('');
  return `<h3>Dropped scenarios</h3>
    <table><thead><tr><th>Name</th><th>Reason</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderWarningsBanner(warnings: string[]): string {
  if (warnings.length === 0) {
    return '';
  }
  const items = warnings
    .map((warning) => `<li>${escapeHtml(warning)}</li>`)
    .join('');
  return `<aside class="warnings" role="alert">
    <strong>Validation warnings (${warnings.length})</strong>
    <ul>${items}</ul>
  </aside>`;
}

function renderTabPanel(
  id: string,
  label: string,
  content: string,
  selected: boolean,
): { tab: string; panel: string } {
  const tabId = `tab-${id}`;
  const panelId = `panel-${id}`;
  const selectedAttr = selected ? 'true' : 'false';
  const hidden = selected ? '' : ' hidden';
  return {
    tab: `<button type="button" role="tab" id="${tabId}" aria-selected="${selectedAttr}" aria-controls="${panelId}" tabindex="${selected ? '0' : '-1'}" data-tab="${id}">${escapeHtml(label)}</button>`,
    panel: `<section role="tabpanel" id="${panelId}" aria-labelledby="${tabId}"${hidden}>${content}</section>`,
  };
}

/** Render a self-contained tabbed HTML report from a server envelope. */
export function renderReportHtml(envelope: QeReportEnvelope): string {
  const { report, validationWarnings, reportSchemaVersion, promptVersion } =
    envelope;
  const hasMultiRepo =
    (report.repoCandidates?.length ?? 0) > 0 ||
    (report.repoLedger?.length ?? 0) > 0 ||
    (report.repoSelfCritique?.length ?? 0) > 0;

  const overviewContent = `
    <dl class="meta">
      <dt>Mode</dt><dd>${escapeHtml(report.mode)}</dd>
      <dt>Generated</dt><dd>${escapeHtml(report.generated)}</dd>
      <dt>Schema</dt><dd>${escapeHtml(reportSchemaVersion)}</dd>
      <dt>Prompt</dt><dd>${escapeHtml(promptVersion)}</dd>
    </dl>
    <p class="confidence">
      <span class="badge ${confidenceClass(report.confidence.level)}">${escapeHtml(report.confidence.level)}</span>
      ${escapeHtml(report.confidence.reason)}
    </p>
    <h3>Understanding</h3>
    ${renderList(report.understanding)}
    ${report.goNoGo
      ? `<h3>GO / NO-GO</h3>
         <p><strong>${escapeHtml(report.goNoGo.decision)}</strong> — ${escapeHtml(report.goNoGo.reason)}</p>`
      : ''}`;

  const tabs: Array<{ id: string; label: string; content: string }> = [
    { id: 'overview', label: 'Overview', content: overviewContent },
    {
      id: 'gaps',
      label: 'Gaps & questions',
      content: `<h3>Gaps</h3>${renderGaps(report.gaps)}<h3>Questions</h3>${renderList(report.questions)}`,
    },
    { id: 'risks', label: 'Risks', content: renderRisks(report.risks) },
    {
      id: 'scenarios',
      label: 'Scenarios',
      content: renderScenarios(report.scenarios),
    },
    {
      id: 'automation',
      label: 'Automation & NFR',
      content: `<h3>Automation</h3>${renderAutomation(report.automation)}
        <h3>Non-functional</h3>${renderNonfunctional(report.nonfunctional)}`,
    },
    {
      id: 'mode',
      label: 'Mode output',
      content: `<pre class="pre">${escapeHtml(report.modeOutput.content)}</pre>`,
    },
    {
      id: 'scope',
      label: 'Scope',
      content: `<h3>Out of scope</h3>${renderList(report.outOfScope)}
        <h3>Coverage gaps</h3>${renderCoverageGaps(report.coverageGaps)}
        ${renderDropped(report.droppedScenarios)}`,
    },
  ];

  if (hasMultiRepo) {
    const critique =
      report.repoSelfCritique && report.repoSelfCritique.length > 0
        ? `<h3>Self-critique</h3>${renderList(report.repoSelfCritique)}`
        : '';
    tabs.push({
      id: 'repos',
      label: 'Multi-repo',
      content: `${renderRepoCandidates(report.repoCandidates)}${renderRepoLedger(report.repoLedger)}${critique}`,
    });
  }

  const tabButtons: string[] = [];
  const tabPanels: string[] = [];
  tabs.forEach((tab, index) => {
    const { tab: button, panel } = renderTabPanel(
      tab.id,
      tab.label,
      tab.content,
      index === 0,
    );
    tabButtons.push(button);
    tabPanels.push(panel);
  });

  const title = escapeHtml(report.title);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>QE Analysis — ${title}</title>
  <style>
    :root {
      --bg: #0f1419;
      --surface: #1a2332;
      --border: #2d3a4d;
      --text: #e7ecf3;
      --muted: #8b9cb3;
      --accent: #3d8bfd;
      --warn-bg: #3d2a14;
      --warn-border: #c9782a;
      --high: #2d6a4f;
      --medium: #5c4d1f;
      --low: #6b2d3a;
    }
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, Segoe UI, sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 1.5rem;
      line-height: 1.5;
    }
    h1 { font-size: 1.5rem; margin: 0 0 1rem; }
    h3 { font-size: 1rem; margin: 1.25rem 0 0.5rem; color: var(--muted); }
    .muted { color: var(--muted); }
    .warnings {
      background: var(--warn-bg);
      border: 1px solid var(--warn-border);
      border-radius: 8px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.25rem;
    }
    .warnings ul { margin: 0.5rem 0 0; padding-left: 1.25rem; }
    [role="tablist"] {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 1rem;
    }
    [role="tab"] {
      background: transparent;
      border: none;
      color: var(--muted);
      cursor: pointer;
      padding: 0.6rem 1rem;
      font: inherit;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
    }
    [role="tab"]:hover { color: var(--text); }
    [role="tab"][aria-selected="true"] {
      color: var(--accent);
      border-bottom-color: var(--accent);
    }
    [role="tabpanel"] { min-height: 12rem; }
    [role="tabpanel"][hidden] { display: none; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    table.wide { display: block; overflow-x: auto; }
    th, td {
      border: 1px solid var(--border);
      padding: 0.5rem 0.65rem;
      text-align: left;
      vertical-align: top;
    }
    th { background: var(--surface); color: var(--muted); font-weight: 600; }
    .meta {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.25rem 1rem;
      margin: 0 0 1rem;
    }
    .meta dt { color: var(--muted); }
    .meta dd { margin: 0; }
    .badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-right: 0.35rem;
    }
    .badge-high { background: var(--high); }
    .badge-medium { background: var(--medium); }
    .badge-low { background: var(--low); }
    .tag {
      font-size: 0.7rem;
      color: var(--muted);
      margin-left: 0.25rem;
    }
    .pre {
      white-space: pre-wrap;
      background: var(--surface);
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
    }
    ul { margin: 0; padding-left: 1.25rem; }
  </style>
</head>
<body>
  <header>
    <h1>${title}</h1>
    <p class="muted">QE Intelligence Suite · ${escapeHtml(report.mode)}</p>
  </header>
  ${renderWarningsBanner(validationWarnings)}
  <div role="tablist" aria-label="Report sections">
    ${tabButtons.join('\n    ')}
  </div>
  ${tabPanels.join('\n  ')}
  <script>
    (function () {
      var tablist = document.querySelector('[role="tablist"]');
      if (!tablist) return;
      var tabs = tablist.querySelectorAll('[role="tab"]');
      function activateTab(tab) {
        tabs.forEach(function (t) {
          var selected = t === tab;
          t.setAttribute('aria-selected', selected ? 'true' : 'false');
          t.tabIndex = selected ? 0 : -1;
          var panel = document.getElementById(t.getAttribute('aria-controls'));
          if (panel) panel.hidden = !selected;
        });
        tab.focus();
      }
      tablist.addEventListener('click', function (e) {
        var tab = e.target.closest('[role="tab"]');
        if (tab) activateTab(tab);
      });
      tablist.addEventListener('keydown', function (e) {
        var list = Array.prototype.slice.call(tabs);
        var i = list.indexOf(document.activeElement);
        if (i < 0) return;
        var next = i;
        if (e.key === 'ArrowRight') next = (i + 1) % list.length;
        else if (e.key === 'ArrowLeft') next = (i - 1 + list.length) % list.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = list.length - 1;
        else return;
        e.preventDefault();
        activateTab(list[next]);
      });
    })();
  </script>
</body>
</html>
`;
}
