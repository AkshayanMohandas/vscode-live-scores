import * as vscode from 'vscode';
import axios from 'axios';

// ---------- Types ----------

interface FootballMatch {
  id: number;
  homeTeam: { name: string; shortName?: string; crest?: string };
  awayTeam: { name: string; shortName?: string; crest?: string };
  status: string;
  utcDate: string;
  minute?: number | string | null;
  venue?: string;
  stage?: string;
  group?: string | null;
  area?: { name: string; code?: string; flag?: string };
  score: {
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
  competition: {
    name: string;
  };
}

// Based on cricketdata.org /api.cricapi.com/v1/currentMatches
// See docs and examples: cricket.data[i].score[0].r / w / o, name, status, matchType, etc.
interface CricketScoreEntry {
  r?: number | null; // runs
  w?: number | null; // wickets
  o?: number | null; // overs
  inning?: string;
}

interface CricketMatch {
  id?: string;
  name?: string;
  matchType?: string;
  status?: string;
  // Some responses use score[], some use team1/team2.score string
  score?: CricketScoreEntry[];
  team1?: { name?: string; score?: string };
  team2?: { name?: string; score?: string };
  teamInfo?: { name: string; img: string }[];
}

// ---------- State ----------

let statusBarItem: vscode.StatusBarItem | undefined;
let pollingIntervalHandle: NodeJS.Timeout | undefined;

let currentFootballMatches: FootballMatch[] = [];
let currentCricketMatches: CricketMatch[] = [];

let pinnedMatchId: string | number | undefined;
let pinnedMatchType: 'football' | 'cricket' | undefined;

let dashboardPanel: vscode.WebviewPanel | undefined;

// ---------- Activation / Deactivation ----------

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('footballLiveScores');

  if (config.get<boolean>('showStatusBar')) {
    statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    statusBarItem.command = 'footballLiveScores.openDashboard';
    statusBarItem.text = '$(loading~spin) Live sports...';
    statusBarItem.tooltip = 'Live Sports Scores (click to open dashboard)';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
  }

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'footballLiveScores.openDashboard',
      () => {
        openDashboard(context);
      }
    ),
    vscode.commands.registerCommand(
      'footballLiveScores.refreshScores',
      async () => {
        await refreshAllScores();
        postMatchesToWebview();
      }
    )
  );

  startPolling();
}

export function deactivate() {
  if (pollingIntervalHandle) {
    clearInterval(pollingIntervalHandle);
  }
  if (statusBarItem) {
    statusBarItem.dispose();
  }
}

// ---------- Polling & Refresh ----------

function startPolling() {
  const config = vscode.workspace.getConfiguration('footballLiveScores');
  const intervalSeconds = config.get<number>('refreshInterval') ?? 30;

  refreshAllScores(); // initial fetch

  if (pollingIntervalHandle) {
    clearInterval(pollingIntervalHandle);
  }

  pollingIntervalHandle = setInterval(async () => {
    await refreshAllScores();
    postMatchesToWebview();
  }, intervalSeconds * 1000);
}

async function refreshAllScores() {
  const config = vscode.workspace.getConfiguration('footballLiveScores');
  const enableCricket = config.get<boolean>('enableCricket') ?? true;

  await Promise.all([
    refreshFootballScores(),
    enableCricket ? refreshCricketScores() : Promise.resolve()
  ]);

  updateStatusBar();
}

// ---------- Football ----------

async function refreshFootballScores() {
  const config = vscode.workspace.getConfiguration('footballLiveScores');
  const apiKey = config.get<string>('apiKey') || '';
  if (!apiKey) {
    // We still allow cricket to show if configured; so don't hard-error here.
    if (!currentFootballMatches.length) {
      updateStatusBarText('$(warning) Set footballLiveScores.apiKey');
    }
    return;
  }

  try {
    const url = `https://api.football-data.org/v4/matches?status=LIVE`;

    const res = await axios.get(url, {
      headers: {
        'X-Auth-Token': apiKey
      }
    });

    const matches: FootballMatch[] = res.data.matches || [];
    // Polyfill minute if missing
    matches.forEach(m => {
      if ((m.minute === undefined || m.minute === null) && m.status === 'IN_PLAY') {
        m.minute = estimateMinute(m);
      }
    });
    currentFootballMatches = matches;
  } catch (err: any) {
    console.error('Error fetching football scores', err);
    // Don't aggressively overwrite the bar if cricket is fine; bar is updated in updateStatusBar()
  }
}

function estimateMinute(match: FootballMatch): number | string | undefined {
  if (match.minute !== undefined && match.minute !== null) {
    return match.minute;
  }
  
  const now = new Date();
  const start = new Date(match.utcDate);
  const diffMs = now.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 0) return 0;

  // If halftime score is present, assume 2nd half.
  // Standard break ~15min.
  // We also check diffMins > 55 to avoid false positives in 1st half if API returns non-null halftime score early.
  if (match.score.halfTime.home !== null && diffMins > 55) {
    // If it just started 2nd half, diffMins might be around 60 (45+15).
    // result should be 46.
    let est = diffMins - 15;
    if (est < 46) est = 46; // clamp to start of 2nd half
    return est > 90 ? '90+' : est;
  }

  return diffMins > 45 ? '45+' : diffMins;
}

function chooseTopFootballMatch(matches: FootballMatch[]): FootballMatch | undefined {
  if (!matches.length) return undefined;

  const priority = (status: string) => {
    switch (status) {
      case 'IN_PLAY': return 0;
      case 'PAUSED': return 1;
      case 'TIMED':
      case 'SCHEDULED': return 2;
      case 'FINISHED': return 3;
      default: return 4;
    }
  };

  const sorted = [...matches].sort((a, b) => {
    const pA = priority(a.status);
    const pB = priority(b.status);
    if (pA !== pB) return pA - pB;
    return new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime();
  });

  return sorted[0];
}

function formatFootballForStatusBar(match: FootballMatch): string {
  const home = match.homeTeam.shortName || match.homeTeam.name;
  const away = match.awayTeam.shortName || match.awayTeam.name;
  const homeScore = match.score.fullTime.home ?? 0;
  const awayScore = match.score.fullTime.away ?? 0;
  const statusIcon =
    match.status === 'IN_PLAY'
      ? '$(debug-continue)'
      : match.status === 'PAUSED'
        ? '$(debug-pause)'
        : '$(clock)';

  const timeDisplay =
    match.status === 'IN_PLAY' && match.minute !== undefined && match.minute !== null
      ? ` (${match.minute}')`
      : '';

  return `${statusIcon} ${home} ${homeScore}–${awayScore} ${away}${timeDisplay}`;
}

// ---------- Cricket (cricketdata.org / api.cricapi.com) ----------

async function refreshCricketScores() {
  const config = vscode.workspace.getConfiguration('footballLiveScores');
  const apiKey = config.get<string>('cricketApiKey') || '';
  const maxMatches = config.get<number>('cricketMaxMatches') ?? 10;

  if (!apiKey) {
    // Only warn if nothing else is live
    if (!currentCricketMatches.length) {
      console.warn(
        'No cricket API key set (footballLiveScores.cricketApiKey). Cricket scores disabled.'
      );
    }
    return;
  }

  try {
    // Free live current matches endpoint
    const url = `https://api.cricapi.com/v1/currentMatches?apikey=${encodeURIComponent(
      apiKey
    )}&offset=0`;

    const res = await axios.get(url);
    const data = res.data;
    const matches: CricketMatch[] = data?.data || [];

    // For now treat all returned matches as "current/live".
    currentCricketMatches = matches.slice(0, maxMatches);
  } catch (err: any) {
    console.error('Error fetching cricket scores', err);
  }
}

function chooseTopCricketMatch(
  matches: CricketMatch[]
): CricketMatch | undefined {
  if (!matches.length) return undefined;

  // You could add smarter heuristics (e.g. prefer T20, IPL, etc.)
  return matches[0];
}

function getCricketTeams(match: any): { team1Name: string; team2Name: string } {
  // The API has had multiple shapes, so we are defensive.
  const team1Name =
    match.team1?.name ||
    match.teams?.[0]?.name ||
    (Array.isArray(match.teams) ? match.teams[0] : '') ||
    'Team 1';
  const team2Name =
    match.team2?.name ||
    match.teams?.[1]?.name ||
    (Array.isArray(match.teams) ? match.teams[1] : '') ||
    'Team 2';

  return { team1Name, team2Name };
}

function formatCricketScoreShort(match: CricketMatch): string {
  // "Match summary" for status bar:
  // 🏏 IND vs AUS — IND 201/3 (35.2)
  const { team1Name, team2Name } = getCricketTeams(match as any);

  let scoreText = '';

  if (Array.isArray(match.score) && match.score.length > 0) {
    const s0 = match.score[0];
    const r = s0.r ?? 0;
    const w = s0.w ?? 0;
    const o = s0.o ?? 0;
    const inningLabel = s0.inning ? `${s0.inning}: ` : '';
    scoreText = `${inningLabel}${r}/${w} (${o})`;
  } else if (match.team1?.score) {
    scoreText = match.team1.score;
  }

  const statusText = match.status || '';

  if (scoreText) {
    return `$(symbol-constant) 🏏 ${team1Name} vs ${team2Name} — ${scoreText}`;
  }

  if (statusText) {
    return `$(symbol-constant) 🏏 ${team1Name} vs ${team2Name} — ${statusText}`;
  }

  return `$(symbol-constant) 🏏 ${team1Name} vs ${team2Name}`;
}

// ---------- Status Bar Combined Logic ----------

function updateStatusBar() {
  if (!statusBarItem) return;

  let matchToDisplay: { type: 'football' | 'cricket'; data: any } | undefined;

  // 1. Check pinned match
  if (pinnedMatchId && pinnedMatchType) {
    if (pinnedMatchType === 'football') {
      const match = currentFootballMatches.find(m => m.id === pinnedMatchId);
      if (match) matchToDisplay = { type: 'football', data: match };
    } else if (pinnedMatchType === 'cricket') {
      const match = currentCricketMatches.find(m => m.id === pinnedMatchId);
      if (match) matchToDisplay = { type: 'cricket', data: match };
    }
  }

  // 2. Auto-selection
  if (!matchToDisplay) {
    const topFootball = chooseTopFootballMatch(currentFootballMatches);
    const topCricket = chooseTopCricketMatch(currentCricketMatches);

    if (topFootball) {
      matchToDisplay = { type: 'football', data: topFootball };
    } else if (topCricket) {
      matchToDisplay = { type: 'cricket', data: topCricket };
    }
  }

  if (matchToDisplay) {
    if (matchToDisplay.type === 'football') {
      const text = formatFootballForStatusBar(matchToDisplay.data);
      const tooltip = buildFootballTooltip(matchToDisplay.data);
      updateStatusBarText(text, tooltip);
    } else {
      const text = formatCricketScoreShort(matchToDisplay.data);
      const tooltip = buildCricketTooltip(matchToDisplay.data);
      updateStatusBarText(text, tooltip);
    }
    return;
  }

  updateStatusBarText('$(live-share) No live matches', 'Live Sports Scores');
}

function updateStatusBarText(text: string, tooltip?: string | vscode.MarkdownString) {
  if (statusBarItem) {
    statusBarItem.text = text;
    if (tooltip) {
      statusBarItem.tooltip = tooltip;
    } else {
      statusBarItem.tooltip = 'Live Sports Scores (click to open dashboard)';
    }
  }
}

function buildFootballTooltip(match: FootballMatch): vscode.MarkdownString {
  const md = new vscode.MarkdownString();
  md.supportHtml = true;
  md.isTrusted = true;

  const homeName = match.homeTeam.shortName || match.homeTeam.name;
  const awayName = match.awayTeam.shortName || match.awayTeam.name;
  const homeScore = match.score.fullTime.home ?? 0;
  const awayScore = match.score.fullTime.away ?? 0;

  // Logos
  // MarkdownString images: ![alt](url)
  // We can try to use a small table or just lines.
  // VS Code Markdown tooltips support basic tables.
  
  const homeLogo = match.homeTeam.crest ? `![${homeName}](${match.homeTeam.crest}|height=20) ` : '';
  const awayLogo = match.awayTeam.crest ? `![${awayName}](${match.awayTeam.crest}|height=20) ` : '';

  md.appendMarkdown(`### ${match.competition.name}\n\n`);
  md.appendMarkdown(`${homeLogo} **${homeName}** ${homeScore} - ${awayScore} **${awayName}** ${awayLogo}\n\n`);
  
  if (match.status === 'IN_PLAY' && match.minute) {
    const venueStr = match.venue ? ` • ${match.venue}` : '';
    md.appendMarkdown(`⏱️ ${match.minute}'${venueStr}`);
  } else {
    md.appendMarkdown(`Status: ${match.status}`);
  }

  return md;
}

function buildCricketTooltip(match: CricketMatch): vscode.MarkdownString {
  const md = new vscode.MarkdownString();
  md.supportHtml = true;
  md.isTrusted = true;

  const { team1Name, team2Name } = getCricketTeams(match as any);
  
  const t1LogoUrl = findCricketLogoExtension(match, team1Name);
  const t2LogoUrl = findCricketLogoExtension(match, team2Name);

  const t1Logo = t1LogoUrl ? `![${team1Name}](${t1LogoUrl}|height=20) ` : '';
  const t2Logo = t2LogoUrl ? `![${team2Name}](${t2LogoUrl}|height=20) ` : '';

  md.appendMarkdown(`### ${match.matchType || 'Cricket Match'}\n\n`);
  md.appendMarkdown(`${t1Logo} **${team1Name}** vs **${team2Name}** ${t2Logo}\n\n`);

  if (Array.isArray(match.score) && match.score.length > 0) {
    match.score.forEach(s => {
        const r = s.r ?? 0;
        const w = s.w ?? 0;
        const o = s.o ?? 0;
        const inning = s.inning ? `**${s.inning}**: ` : '';
        md.appendMarkdown(`${inning}${r}/${w} (${o} ov)\n\n`);
    });
  } else if (match.team1?.score) {
      md.appendMarkdown(`${match.team1.score}\n\n`);
  }
  
  md.appendMarkdown(`Status: ${match.status}`);
  return md;
}

function findCricketLogoExtension(match: CricketMatch, teamName: string): string | null {
  if (!match.teamInfo || !Array.isArray(match.teamInfo)) return null;
  const target = teamName.toLowerCase();
  const found = match.teamInfo.find(t => {
    const tName = (t.name || '').toLowerCase();
    // Some APIs might not have shortname, be safe
    // @ts-ignore
    const tShort = (t.shortname || '').toLowerCase();
    return tName === target || tShort === target || tName.includes(target) || target.includes(tName);
  });
  return found ? found.img : null;
}

// ---------- Dashboard Webview (Tabbed Football + Cricket) ----------

function openDashboard(context: vscode.ExtensionContext) {
  if (dashboardPanel) {
    dashboardPanel.reveal();
    postMatchesToWebview();
    return;
  }

  dashboardPanel = vscode.window.createWebviewPanel(
    'sportsLiveScoresDashboard',
    'Live Sports Scores',
    vscode.ViewColumn.Two,
    {
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );

  dashboardPanel.iconPath = {
    light: vscode.Uri.joinPath(context.extensionUri, 'media', 'sports.svg'),
    dark: vscode.Uri.joinPath(context.extensionUri, 'media', 'sports.svg')
  };

  dashboardPanel.onDidDispose(() => {
    dashboardPanel = undefined;
  });

  dashboardPanel.webview.html = getDashboardHtml(
    dashboardPanel.webview,
    context.extensionUri
  );
  postMatchesToWebview();

  dashboardPanel.webview.onDidReceiveMessage(async (message) => {
    if (message.type === 'refresh') {
      await refreshAllScores();
      postMatchesToWebview();
    } else if (message.type === 'pin') {
      pinnedMatchId = message.payload.id;
      pinnedMatchType = message.payload.type;
      updateStatusBar();
      postMatchesToWebview(); // Update webview to show pinned state
      vscode.window.showInformationMessage(`Pinned match to status bar.`);
    }
  });
}

function postMatchesToWebview() {
  if (!dashboardPanel) return;
  dashboardPanel.webview.postMessage({
    type: 'state',
    payload: {
      footballMatches: currentFootballMatches,
      cricketMatches: currentCricketMatches,
      pinnedMatchId,
      pinnedMatchType
    }
  });
}

function getDashboardHtml(
  webview: vscode.Webview,
  extensionUri: vscode.Uri
): string {
  const nonce = getNonce();
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'media', 'dashboard.css')
  );
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'media', 'dashboard.js')
  );

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none';
                 img-src ${webview.cspSource} https:;
                 style-src ${webview.cspSource} 'unsafe-inline';
                 script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="${styleUri}" rel="stylesheet" />
  <title>Live Sports Scores</title>
</head>
<body>
  <header class="header">
    <div class="title">Live Sports Scores</div>
    <div class="actions">
      <div class="tabs">
        <button class="tab active" data-tab="football">⚽ Football</button>
        <button class="tab" data-tab="cricket">🏏 Cricket</button>
      </div>
      <button id="refreshBtn" class="btn">Refresh</button>
    </div>
  </header>

  <main class="content">
    <section id="footballSection" class="tab-section">
      <div id="footballEmpty" class="empty-state">
        <div class="emoji">📡</div>
        <div class="text">No live football matches.</div>
        <div class="subtext">As soon as there are live games in your configured competition, they’ll appear here.</div>
      </div>
      <div id="footballList" class="matches-list hidden"></div>
    </section>

    <section id="cricketSection" class="tab-section hidden">
      <div id="cricketEmpty" class="empty-state">
        <div class="emoji">🏏</div>
        <div class="text">No current cricket matches.</div>
        <div class="subtext">Configure your cricket API key to see live scores from cricketdata.org.</div>
      </div>
      <div id="cricketList" class="matches-list hidden"></div>
    </section>
  </main>

  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

function getNonce() {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
