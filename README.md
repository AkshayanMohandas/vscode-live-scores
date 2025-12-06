# Live Sports Scores (VS Code Extension)

See live **football** and **cricket** scores while you code — lightweight, unobtrusive, and powered by:

- Football: [football-data.org](https://www.football-data.org/)
- Cricket: [cricketdata.org / api.cricapi.com](https://cricketdata.org/) (currentMatches) :contentReference[oaicite:1]{index=1}

## Features

- **Status Bar**  
  - Shows the top live *football* match, or if none, the top live *cricket* match.
  - Cricket status bar uses a **match summary** format and only appears when something is live.

- **Tabbed Dashboard (Webview)**  
  - `⚽ Football` tab: all live matches for your configured competition.
  - `🏏 Cricket` tab: current matches from cricketdata.org.

- **Configurable** (Settings → "Live Sports Scores"):
  - `footballLiveScores.apiKey` (football-data.org)
  - `footballLiveScores.favoriteCompetitionId`
  - `footballLiveScores.refreshInterval`
  - `footballLiveScores.showStatusBar`
  - `footballLiveScores.enableCricket`
  - `footballLiveScores.cricketApiKey` (cricketdata.org / cricapi)
  - `footballLiveScores.cricketMaxMatches`

## Setup

### Football

1. Register at https://www.football-data.org/client/register and obtain API key.
2. In VS Code settings, set `footballLiveScores.apiKey` and `footballLiveScores.favoriteCompetitionId`.

### Cricket

1. Signup at https://cricketdata.org/ and get your API key.
2. In VS Code settings, set `footballLiveScores.cricketApiKey`.
3. Make sure `footballLiveScores.enableCricket` is enabled.

The extension calls:

- `https://api.football-data.org/v4/competitions/{id}/matches?status=LIVE`
- `https://api.cricapi.com/v1/currentMatches?apikey=YOUR_KEY&offset=0`

## Commands

- **Sports: Open Live Scores Dashboard**
- **Sports: Refresh Live Scores**

## Development

```bash
npm install
npm run watch
# Press F5 in VS Code to launch Extension Development Host
