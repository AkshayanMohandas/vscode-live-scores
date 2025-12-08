# Live Sports Scores - VS Code Extension

**Never miss a match while you code. Stay connected to the games that matter.**

<div align="center">

![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white)
![Version](https://img.shields.io/badge/version-0.1.3-blue?style=for-the-badge&logo=github&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge&logo=open-source-initiative&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Football](https://img.shields.io/badge/⚽-Football-1E88E5?style=for-the-badge&logo=soccer&logoColor=white)
![Cricket](https://img.shields.io/badge/🏏-Cricket-FF6F00?style=for-the-badge&logo=cricket&logoColor=white)
![Status](https://img.shields.io/badge/status-active-success?style=for-the-badge&logo=check-circle&logoColor=white)

</div>

---

## 🎯 What is Live Sports Scores?

**Live Sports Scores** transforms VS Code into your personal sports command center. Whether you're debugging code or following your favorite teams, this extension keeps you connected to live football (soccer) and cricket matches directly in your development environment.

### The Problem
You're in the zone coding, but you don't want to miss that crucial goal, wicket, or match-winning moment. Constantly switching tabs or checking your phone breaks your flow.

### The Solution
**Live Sports Scores** brings live sports directly into VS Code with real-time updates, a beautiful dashboard, and a status bar that shows scores at a glance—all without leaving your editor.

---

## ✨ Features

### 📊 Status Bar Integration
- **Live Score Display** - See the top live football or cricket match right in your status bar
- **Smart Prioritization** - Football matches take priority, with cricket as fallback
- **One-Click Access** - Click the status bar to open the full dashboard
- **Match Pinning** - Pin your favorite match to always see it in the status bar
- **Real-Time Updates** - Scores refresh automatically based on your configured interval

### 🎮 Tabbed Dashboard
- **⚽ Football Tab** - View all live matches from your configured competition
  - Team names with logos
  - Live scores and match time
  - Match status (Live, Paused, Finished, etc.)
  - Competition information
  - Pin matches to status bar
  
- **🏏 Cricket Tab** - View current cricket matches from around the world
  - Team names and match types
  - Live scores with runs, wickets, and overs
  - Match status and information
  - Pin matches to status bar

### ⚙️ Fully Configurable
- Customizable refresh intervals (10-300 seconds)
- Enable/disable cricket scores
- Configure favorite football competition
- Show/hide status bar
- Control maximum cricket matches displayed

---

## 🚀 Quick Start Guide

### Step 1: Install the Extension

1. Open VS Code Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
2. Search for **"Live Sports Scores"**
3. Click **Install**

### Step 2: Set Up Football Scores

1. **Get Your API Key**
   - Visit [football-data.org](https://www.football-data.org/client/register)
   - Register for a free account
   - Copy your API key

2. **Configure in VS Code**
   - Open Settings (`Ctrl+,` / `Cmd+,`)
   - Search for "Live Sports Scores"
   - Set `footballLiveScores.apiKey` to your API key
   - Set `footballLiveScores.favoriteCompetitionId` (e.g., `2021` for Premier League)

### Step 3: Set Up Cricket Scores (Optional)

1. **Get Your API Key**
   - Visit [cricketdata.org](https://cricketdata.org/)
   - Sign up for a free account
   - Get your API key

2. **Configure in VS Code**
   - In Settings, set `footballLiveScores.cricketApiKey` to your API key
   - Ensure `footballLiveScores.enableCricket` is enabled (default: `true`)

### Step 4: Start Using

1. **Open the Dashboard**
   - Click the status bar item, OR
   - Use Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) → **"Sports: Open Live Scores Dashboard"**

2. **View Live Matches**
   - Browse the Football and Cricket tabs
   - See real-time scores updating automatically
   - Pin matches you want to track in the status bar

3. **Refresh Manually**
   - Click the "Refresh" button in the dashboard, OR
   - Use Command Palette → **"Sports: Refresh Live Scores"**

---

## 📋 Supported Sports & Leagues

<div align="center">

![Football Live](https://img.shields.io/badge/⚽-Football%20Live-1E88E5?style=flat-square&logo=soccer&logoColor=white)
![Cricket Live](https://img.shields.io/badge/🏏-Cricket%20Live-FF6F00?style=flat-square&logo=cricket&logoColor=white)
![Real-Time](https://img.shields.io/badge/Real--Time-Scores-00C853?style=flat-square&logo=clock&logoColor=white)

</div>

| Sport | Status | Coverage | API Source |
|-------|--------|----------|------------|
| ⚽ **Football (Soccer)** | ✅ Live | All competitions from football-data.org | [football-data.org](https://www.football-data.org/) |
| 🏏 **Cricket** | ✅ Live | Current matches worldwide | [cricketdata.org](https://cricketdata.org/) |

### Popular Football Competitions
- **Premier League** (ID: 2021)
- **La Liga** (ID: 2014)
- **Bundesliga** (ID: 2002)
- **Serie A** (ID: 2019)
- **Ligue 1** (ID: 2015)
- **Champions League** (ID: 2001)
- And many more! Check [football-data.org](https://www.football-data.org/) for full list.

---

## ⚙️ Configuration

All settings are available in VS Code Settings (`Ctrl+,` / `Cmd+,`) under **"Live Sports Scores"**.

### Available Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `footballLiveScores.apiKey` | string | `""` | API key for football-data.org (required for football) |
| `footballLiveScores.favoriteCompetitionId` | number | `2021` | Default competition ID (2021 = Premier League) |
| `footballLiveScores.refreshInterval` | number | `30` | Polling interval in seconds (10-300) |
| `footballLiveScores.showStatusBar` | boolean | `true` | Show status bar item |
| `footballLiveScores.enableCricket` | boolean | `true` | Enable cricket live scores |
| `footballLiveScores.cricketApiKey` | string | `""` | API key for cricketdata.org (required for cricket) |
| `footballLiveScores.cricketMaxMatches` | number | `10` | Maximum cricket matches to display |

### Example Configuration

```json
{
  "footballLiveScores.apiKey": "your-football-api-key-here",
  "footballLiveScores.favoriteCompetitionId": 2021,
  "footballLiveScores.refreshInterval": 30,
  "footballLiveScores.showStatusBar": true,
  "footballLiveScores.enableCricket": true,
  "footballLiveScores.cricketApiKey": "your-cricket-api-key-here",
  "footballLiveScores.cricketMaxMatches": 10
}
```

---

## 🎮 Commands

Access via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- **Sports: Open Live Scores Dashboard** - Opens the main dashboard with Football and Cricket tabs
- **Sports: Refresh Live Scores** - Manually refresh all scores

---

## 🔧 Development

### Prerequisites

- Node.js v16+
- VS Code latest version
- TypeScript knowledge (optional)

### Build from Source

```bash
# Clone the repository
git clone https://github.com/AkshayanMohandas/vscode-live-scores.git
cd vscode-live-scores

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode (auto-compile on changes)
npm run watch

# Run in development mode
# Press F5 in VS Code to launch Extension Development Host
```

### Project Structure

```
vscode-live-scores/
├── 📁 src/
│   └── extension.ts          # Main extension logic
├── 📁 media/
│   ├── dashboard.css         # Dashboard styles
│   ├── dashboard.js          # Dashboard JavaScript
│   ├── icon.png             # Extension icon
│   └── sports.svg            # Dashboard icon
├── 📁 out/                   # Compiled JavaScript
├── package.json              # Extension manifest
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

### API Integration

<div align="center">

![Football API](https://img.shields.io/badge/Football-Data%20API-1E88E5?style=flat-square&logo=api&logoColor=white)
![Cricket API](https://img.shields.io/badge/Cricket-Data%20API-FF6F00?style=flat-square&logo=api&logoColor=white)
![REST API](https://img.shields.io/badge/REST-API-00A8E8?style=flat-square&logo=rest&logoColor=white)
![Real-Time](https://img.shields.io/badge/Real--Time-Updates-00C853?style=flat-square&logo=clock&logoColor=white)

</div>

- **Football**: Uses [football-data.org API v4](https://www.football-data.org/documentation/quickstart)
  - Endpoint: `https://api.football-data.org/v4/matches?status=LIVE`
  - Authentication: X-Auth-Token header
  
- **Cricket**: Uses [cricketdata.org / cricapi](https://cricketdata.org/)
  - Endpoint: `https://api.cricapi.com/v1/currentMatches`
  - Authentication: API key in query parameter

---

## 💡 Use Cases

### For Developers
- **Stay Connected** - Follow matches while coding without context switching
- **Quick Checks** - Glance at status bar for instant score updates
- **Productivity** - No need to leave your editor to check scores
- **Multi-Tasking** - Code and follow sports simultaneously

### For Sports Fans
- **Multi-Sport Tracking** - Football and cricket in one place
- **Real-Time Updates** - Live scores that refresh automatically
- **Clean Interface** - Focused dashboard without distractions
- **Persistent Tracking** - Status bar always visible

### For Teams
- **Game Day Monitoring** - Track important matches during work
- **Team Events** - Follow team matches and competitions
- **Sports-Themed Environment** - Fun productivity tool
- **Shared Workspace** - Team members can follow the same matches

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Ways to Contribute

- 🐛 **Report Bugs** - Help us squash issues
- 💡 **Suggest Features** - Tell us what you want to see
- 🔧 **Submit PRs** - Code contributions are always welcome
- 📖 **Improve Docs** - Help others understand the project
- ⭐ **Star the Repo** - Show your support

### Development Setup

```bash
# Fork and clone
git clone https://github.com/AkshayanMohandas/vscode-live-scores.git

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and test
npm run compile
# Press F5 in VS Code to test

# Submit PR
git push origin feature/amazing-feature
```

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

<div align="center">

![Powered By](https://img.shields.io/badge/Powered%20By-Football%20Data%20API-1E88E5?style=flat-square&logo=soccer&logoColor=white)
![Powered By](https://img.shields.io/badge/Powered%20By-Cricket%20Data%20API-FF6F00?style=flat-square&logo=cricket&logoColor=white)
![Open Source](https://img.shields.io/badge/Open%20Source-MIT%20License-00C853?style=flat-square&logo=open-source-initiative&logoColor=white)
![Made With](https://img.shields.io/badge/Made%20With-VS%20Code-007ACC?style=flat-square&logo=visual-studio-code&logoColor=white)

</div>

- [football-data.org](https://www.football-data.org/) for providing football data APIs
- [cricketdata.org](https://cricketdata.org/) for providing cricket data APIs
- VS Code team for the amazing extension platform
- Open source community for inspiration and tools
- Sports fans everywhere for the motivation to build this

---

## 🏆 Ready to Never Miss a Match Again?

Install **Live Sports Scores** today and transform your VS Code into the ultimate sports command center!

**Download Now** → Search "Live Sports Scores" in VS Code Extensions

---

**Happy coding and may your teams always win!** 🚀⚽🏏

---

### 🐛 Found a Bug? 💡 Have an Idea?

Help make Live Sports Scores better! Report issues, suggest features, or share your feedback.

<div align="center">

[![GitHub Issues](https://img.shields.io/badge/Report-Issue-red?style=for-the-badge&logo=github&logoColor=white)](https://github.com/AkshayanMohandas/vscode-live-scores/issues)
[![GitHub Discussions](https://img.shields.io/badge/Suggest-Feature-orange?style=for-the-badge&logo=github&logoColor=white)](https://github.com/AkshayanMohandas/vscode-live-scores/discussions)
[![GitHub Stars](https://img.shields.io/badge/⭐-Star%20Us-yellow?style=for-the-badge&logo=github&logoColor=white)](https://github.com/AkshayanMohandas/vscode-live-scores)

</div>
