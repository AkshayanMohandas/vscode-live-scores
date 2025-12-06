(function () {
  const vscode = acquireVsCodeApi();

  const refreshBtn = document.getElementById('refreshBtn');

  const tabs = Array.from(document.querySelectorAll('.tab'));
  const footballSection = document.getElementById('footballSection');
  const cricketSection = document.getElementById('cricketSection');

  const footballEmpty = document.getElementById('footballEmpty');
  const footballList = document.getElementById('footballList');
  const cricketEmpty = document.getElementById('cricketEmpty');
  const cricketList = document.getElementById('cricketList');

  let state = {
    footballMatches: [],
    cricketMatches: [],
    pinnedMatchId: undefined,
    pinnedMatchType: undefined
  };

  // --------- UI interactions ---------

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      setActiveTab(target || 'football');
    });
  });

  function setActiveTab(tab) {
    tabs.forEach((t) =>
      t.classList.toggle('active', t.getAttribute('data-tab') === tab)
    );
    footballSection.classList.toggle('hidden', tab !== 'football');
    cricketSection.classList.toggle('hidden', tab !== 'cricket');
  }

  refreshBtn.addEventListener('click', () => {
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'Refreshing...';
    vscode.postMessage({ type: 'refresh' });
  });

  // --------- Messages from extension ---------

  window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.type === 'state') {
      state.footballMatches = message.payload.footballMatches || [];
      state.cricketMatches = message.payload.cricketMatches || [];
      state.pinnedMatchId = message.payload.pinnedMatchId;
      state.pinnedMatchType = message.payload.pinnedMatchType;
      render();
      refreshBtn.disabled = false;
      refreshBtn.textContent = 'Refresh';
    }
  });

  // --------- Rendering ---------

  function render() {
    renderFootball(state.footballMatches);
    renderCricket(state.cricketMatches);
  }

  function createPinButton(id, type) {
    const btn = document.createElement('button');
    btn.className = 'pin-btn';
    btn.innerHTML = '📌'; // Pin emoji
    btn.title = 'Pin to Status Bar';
    
    if (state.pinnedMatchId === id && state.pinnedMatchType === type) {
      btn.classList.add('pinned');
      btn.title = 'Currently Pinned';
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent triggering other card clicks if any
      vscode.postMessage({
        type: 'pin',
        payload: { id, type }
      });
    });

    return btn;
  }

  function renderFootball(matches) {
    if (!matches || !matches.length) {
      footballEmpty.classList.remove('hidden');
      footballList.classList.add('hidden');
      footballList.innerHTML = '';
      return;
    }

    footballEmpty.classList.add('hidden');
    footballList.classList.remove('hidden');
    footballList.innerHTML = '';

    matches.forEach((match) => {
      const card = document.createElement('div');
      card.className = 'match-card';

      const header = document.createElement('div');
      header.className = 'match-header';

      const comp = document.createElement('div');
      comp.className = 'match-competition';
      const areaName = match.area?.name ? ` (${match.area.name})` : '';
      comp.textContent = (match.competition?.name || 'Competition') + areaName;

      const actionsWrapper = document.createElement('div');
      actionsWrapper.className = 'match-actions';

      const pinBtn = createPinButton(match.id, 'football');
      actionsWrapper.appendChild(pinBtn);

      const statusWrapper = document.createElement('div');
      statusWrapper.className = 'match-status';

      const statusPill = document.createElement('span');
      statusPill.className = 'status-pill';
      const status = match.status;

      if (status === 'IN_PLAY') {
        statusPill.classList.add('status-live');
        statusPill.textContent = 'LIVE';
      } else if (status === 'PAUSED') {
        statusPill.classList.add('status-paused');
        statusPill.textContent = 'HT';
      } else {
        statusPill.classList.add('status-upcoming');
        statusPill.textContent = status || '';
      }

      statusWrapper.appendChild(statusPill);
      actionsWrapper.appendChild(statusWrapper);

      header.appendChild(comp);
      header.appendChild(actionsWrapper);

      const body = document.createElement('div');
      body.className = 'match-body';

      const teams = document.createElement('div');
      teams.className = 'teams';

      const homeRow = document.createElement('div');
      homeRow.className = 'team-row';

      const awayRow = document.createElement('div');
      awayRow.className = 'team-row';

      // Home Team
      const homeName = document.createElement('div');
      homeName.className = 'team-name home';
      
      if (match.homeTeam?.crest) {
        const img = document.createElement('img');
        img.src = match.homeTeam.crest;
        img.className = 'team-logo';
        homeName.appendChild(img);
      }
      
      const homeText = document.createElement('span');
      homeText.textContent =
        (match.homeTeam &&
          (match.homeTeam.shortName || match.homeTeam.name)) ||
        '?';
      homeName.appendChild(homeText);

      // Away Team
      const awayName = document.createElement('div');
      awayName.className = 'team-name';

      if (match.awayTeam?.crest) {
        const img = document.createElement('img');
        img.src = match.awayTeam.crest;
        img.className = 'team-logo';
        awayName.appendChild(img);
      }

      const awayText = document.createElement('span');
      awayText.textContent =
        (match.awayTeam &&
          (match.awayTeam.shortName || match.awayTeam.name)) ||
        '?';
      awayName.appendChild(awayText);

      const homeScore = document.createElement('div');
      homeScore.className = 'score';
      homeScore.textContent = match.score?.fullTime?.home ?? 0;

      const awayScore = document.createElement('div');
      awayScore.className = 'score';
      awayScore.textContent = match.score?.fullTime?.away ?? 0;

      homeRow.appendChild(homeName);
      homeRow.appendChild(homeScore);

      awayRow.appendChild(awayName);
      awayRow.appendChild(awayScore);

      teams.appendChild(homeRow);
      teams.appendChild(awayRow);

      const meta = document.createElement('div');
      meta.className = 'meta';

      const minuteEl = document.createElement('div');
      const statusText = match.status;
      if (statusText === 'IN_PLAY' && match.minute != null) {
        minuteEl.textContent = `${match.minute}'`;
        minuteEl.classList.add('live-minute');
      } else if (statusText === 'PAUSED') {
        minuteEl.textContent = 'Half-time';
      } else {
        try {
          const dt = new Date(match.utcDate);
          minuteEl.textContent = dt.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch {
          minuteEl.textContent = match.utcDate;
        }
      }

      const kickoffEl = document.createElement('div');
      try {
        const dt = new Date(match.utcDate);
        const dateStr = dt.toLocaleDateString([], {
          month: 'short',
          day: 'numeric'
        });
        const timeStr = dt.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
        kickoffEl.textContent = `${dateStr} • ${timeStr}`;
      } catch {
        kickoffEl.textContent = '';
      }

      meta.appendChild(minuteEl);
      meta.appendChild(kickoffEl);

      if (match.venue) {
        const venueEl = document.createElement('div');
        venueEl.className = 'match-venue';
        venueEl.textContent = match.venue;
        venueEl.style.fontSize = '0.65rem';
        venueEl.style.opacity = '0.7';
        venueEl.style.marginTop = '0.1rem';
        meta.appendChild(venueEl);
      }

      if (match.stage || match.group) {
        const extraEl = document.createElement('div');
        extraEl.className = 'match-extra';
        // Normalize stage string (e.g. REGULAR_SEASON -> Regular Season)
        const formatStr = (s) => s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
        
        let text = '';
        if (match.stage) text += formatStr(match.stage);
        if (match.group) text += (text ? ' • ' : '') + formatStr(match.group);
        
        extraEl.textContent = text;
        extraEl.style.fontSize = '0.65rem';
        extraEl.style.opacity = '0.7';
        meta.appendChild(extraEl);
      }

      body.appendChild(teams);
      body.appendChild(meta);

      card.appendChild(header);
      card.appendChild(body);

      footballList.appendChild(card);
    });
  }

  function renderCricket(matches) {
    if (!matches || !matches.length) {
      cricketEmpty.classList.remove('hidden');
      cricketList.classList.add('hidden');
      cricketList.innerHTML = '';
      return;
    }

    cricketEmpty.classList.add('hidden');
    cricketList.classList.remove('hidden');
    cricketList.innerHTML = '';

    matches.forEach((match) => {
      const card = document.createElement('div');
      card.className = 'match-card';

      const header = document.createElement('div');
      header.className = 'match-header';

      const comp = document.createElement('div');
      comp.className = 'match-competition';
      comp.textContent = match.matchType || 'Cricket';

      const actionsWrapper = document.createElement('div');
      actionsWrapper.className = 'match-actions';

      // Cricket API doesn't always guarantee a stable 'id' in the free tier, 
      // but let's assume 'id' exists or use a fallback if needed.
      const pinBtn = createPinButton(match.id, 'cricket');
      actionsWrapper.appendChild(pinBtn);

      const statusWrapper = document.createElement('div');
      statusWrapper.className = 'match-status';

      const statusPill = document.createElement('span');
      statusPill.className = 'status-pill';
      const status = (match.status || '').toLowerCase();

      if (status.includes('live')) {
        statusPill.classList.add('status-live');
        statusPill.textContent = 'LIVE';
      } else if (
        status.includes('innings break') ||
        status.includes('break')
      ) {
        statusPill.classList.add('status-paused');
        statusPill.textContent = 'BREAK';
      } else {
        statusPill.classList.add('status-upcoming');
        statusPill.textContent = match.status || '';
      }

      statusWrapper.appendChild(statusPill);
      actionsWrapper.appendChild(statusWrapper);

      header.appendChild(comp);
      header.appendChild(actionsWrapper);

      const body = document.createElement('div');
      body.className = 'match-body';

      const teams = document.createElement('div');
      teams.className = 'teams';

      const team1Row = document.createElement('div');
      team1Row.className = 'team-row';

      const team2Row = document.createElement('div');
      team2Row.className = 'team-row';

      const team1NameEl = document.createElement('div');
      team1NameEl.className = 'team-name home';
      const team2NameEl = document.createElement('div');
      team2NameEl.className = 'team-name';

      const team1Name =
        match.team1?.name ||
        (match.teams && match.teams[0]?.name) ||
        'Team 1';
      const team2Name =
        match.team2?.name ||
        (match.teams && match.teams[1]?.name) ||
        'Team 2';

      // Logo logic for Cricket
      const t1Logo = findCricketLogo(match, team1Name);
      if (t1Logo) {
         const img = document.createElement('img');
         img.src = t1Logo;
         img.className = 'team-logo';
         team1NameEl.appendChild(img);
      }
      const t1Text = document.createElement('span');
      t1Text.textContent = team1Name;
      team1NameEl.appendChild(t1Text);

      const t2Logo = findCricketLogo(match, team2Name);
      if (t2Logo) {
         const img = document.createElement('img');
         img.src = t2Logo;
         img.className = 'team-logo';
         team2NameEl.appendChild(img);
      }
      const t2Text = document.createElement('span');
      t2Text.textContent = team2Name;
      team2NameEl.appendChild(t2Text);


      const team1ScoreEl = document.createElement('div');
      team1ScoreEl.className = 'score';
      const team2ScoreEl = document.createElement('div');
      team2ScoreEl.className = 'score';

      if (Array.isArray(match.score) && match.score.length > 0) {
        const s0 = match.score[0];
        const s1 = match.score[1];

        team1ScoreEl.textContent = formatCricketScoreLine(s0);
        team2ScoreEl.textContent = s1 ? formatCricketScoreLine(s1) : '';
      } else {
        // fallback: team1.score / team2.score as simple text
        team1ScoreEl.textContent = match.team1?.score || '';
        team2ScoreEl.textContent = match.team2?.score || '';
      }

      team1Row.appendChild(team1NameEl);
      team1Row.appendChild(team1ScoreEl);

      team2Row.appendChild(team2NameEl);
      team2Row.appendChild(team2ScoreEl);

      teams.appendChild(team1Row);
      teams.appendChild(team2Row);

      const meta = document.createElement('div');
      meta.className = 'meta';

      const nameEl = document.createElement('div');
      nameEl.textContent = match.name || '';

      const statusEl = document.createElement('div');
      statusEl.textContent = match.status || '';

      meta.appendChild(nameEl);
      meta.appendChild(statusEl);

      body.appendChild(teams);
      body.appendChild(meta);

      card.appendChild(header);
      card.appendChild(body);

      cricketList.appendChild(card);
    });
  }

  function findCricketLogo(match, teamName) {
    if (!match.teamInfo || !Array.isArray(match.teamInfo)) return null;
    // Normalize for comparison
    const target = teamName.toLowerCase();
    const found = match.teamInfo.find(t => {
      const tName = (t.name || '').toLowerCase();
      const tShort = (t.shortname || '').toLowerCase();
      return tName === target || tShort === target || tName.includes(target) || target.includes(tName);
    });
    return found ? found.img : null;
  }

  function formatCricketScoreLine(score) {
    if (!score) return '';
    const r = score.r ?? 0;
    const w = score.w ?? 0;
    const o = score.o ?? 0;
    return `${r}/${w} (${o})`;
  }
})();
