'use strict';
(() => {
  const data = window.SF_DATA;
  const matchData = window.SF_MATCHES || {matches:data.matches};
  const dateTime = (m) => new Date(`${m.date}T${m.time}:00+03:00`);
  const isUpcoming = (m) => !m.score && m.status !== 'pending' && dateTime(m) > new Date();
  const matchStatus = (m) => m.score ? 'played' : isUpcoming(m) ? 'future' : 'pending';
  const formattedDate = (iso, options) => new Date(iso).toLocaleDateString('ru-RU', {timeZone:'Europe/Moscow',...options});
  const $ = (s) => document.querySelector(s);
  const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = (s) => s.toLocaleLowerCase('ru').replace(/ё/g, 'е').trim();
  const shortPosition = {'Нападающий':'НАПАДЕНИЕ','Защитник':'ЗАЩИТА','Вратарь':'ВРАТАРЬ'};
  let position = 'all';
  let expanded = false;
  let query = '';
  const dialog = $('#player-dialog');
  const initials = (name) => name.split(' ').map((s) => s[0]).slice(0,2).join('');
  const portrait = (p) => p.photo
    ? `<img src="${escape(p.photo)}" alt="${escape(p.name)}" loading="lazy">`
    : `<div class="initials" aria-hidden="true">${escape(initials(p.name))}</div>`;
  const sfIcon = '<img class="mini-sf" src="assets/south-family-logo.png" alt="">';

  function renderMatches(filter = 'all') {
    const matches = matchData.matches.filter((m) => filter === 'all' || (filter === 'upcoming' ? isUpcoming(m) : Boolean(m.score)));
    $('#match-list').innerHTML = matches.map((m) => {
      const win = m.score && (m.home === 'S.F.' ? m.score[0] > m.score[1] : m.score[1] > m.score[0]);
      const date = new Date(`${m.date}T12:00:00+03:00`).toLocaleDateString('ru-RU', {day:'numeric',month:'long',timeZone:'Europe/Moscow'});
      const result = !m.score ? (matchStatus(m) === 'future' ? 'ВПЕРЕДИ' : 'ЖДЁМ ПРОТОКОЛ') : m.score[0] === m.score[1] ? 'НИЧЬЯ' : win ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ';
      return `<a class="match-row" href="${escape(m.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(`${date}, ${m.home} — ${m.away}, ${m.score ? m.score.join(':') : m.time+' мск'}. Страница матча в РХЛ`)}"><span class="match-date">${escape(date)}<small>${escape(m.time)} МСК</small></span><span class="match-kind">РХЛ · СТАРТ</span><span class="team-name home">${m.home === 'S.F.' ? sfIcon : m.home_logo ? '<img class="mini-sf team-logo" src="'+escape(m.home_logo)+'" alt="">' : ''}${escape(m.home)}</span><strong class="match-score ${!m.score ? 'pending' : ''}">${m.score ? m.score.join(' : ') : matchStatus(m) === 'future' ? m.time : '—'}</strong><span class="team-name away">${m.away === 'S.F.' ? sfIcon : m.away_logo ? '<img class="mini-sf team-logo" src="'+escape(m.away_logo)+'" alt="">' : ''}${escape(m.away)}</span><span class="result-tag ${!m.score ? 'upcoming' : win ? 'win' : ''}">${result}</span></a>`;
    }).join('') || '<p class="empty-state">Матчи пока не опубликованы.</p>';
  }

  function renderPlayers() {
    const filtered = data.players.filter((p) => (position === 'all' || p.position === position) && normalize(p.name).includes(normalize(query)));
    const visible = expanded ? filtered : filtered.slice(0,8);
    $('#players-grid').innerHTML = visible.map((p) => {
      const [first, ...last] = p.name.split(' ');
      const stats = p.position === 'Вратарь'
        ? `<span><b>${p.games}</b> И</span><span>ВРАТАРЬ</span>`
        : `<span><b>${p.games}</b> И</span><span><b>${p.goals}</b> Г</span><span><b>${p.assists}</b> П</span>`;
      return `<button class="player-card" data-player-id="${p.id}" aria-label="Открыть карточку: ${escape(p.name)}"><div class="player-photo"><span class="position-tag">${shortPosition[p.position]}</span>${portrait(p)}</div><div class="player-info"><h3><span>${escape(first)}</span>${escape(last.join(' '))}</h3><div class="player-stats">${stats}<span class="card-open" aria-hidden="true">+</span></div></div></button>`;
    }).join('') || '<p class="empty-state">Игрок не найден. Попробуйте другое имя или амплуа.</p>';
    $('#player-count').textContent = `Показано ${visible.length} из ${filtered.length} игроков`;
    $('#show-more').hidden = filtered.length <= 8;
    $('#show-more').textContent = expanded ? 'Свернуть состав' : `Показать весь состав (${filtered.length})`;
  }

  function renderMatchOverview() {
    const next = matchData.matches.filter(isUpcoming).sort((a,b)=>dateTime(a)-dateTime(b))[0];
    const card = $('[data-next-match]');
    if (next) {
      const team = (name, logo) => `<div class="next-team"><span class="team-mark ${name === 'S.F.' ? 'sf' : 'opponent'}">${name === 'S.F.' ? '<img src="assets/south-family-logo.png" alt="">' : logo ? '<img class="team-logo" src="'+escape(logo)+'" alt="">' : escape(name.slice(0,2).toUpperCase())}</span><strong>${escape(name)}</strong><small>МОСКВА</small></div>`;
      const date = formattedDate(dateTime(next),{day:'numeric',month:'long',weekday:'short'});
      card.querySelector('.next-match').innerHTML = `${team(next.home,next.home_logo)}<div class="next-date"><span>${escape(date.toUpperCase())}</span><strong>${next.time}</strong><span>МСК${next.arena ? ' · '+escape(next.arena) : ''}</span></div>${team(next.away,next.away_logo)}`;
      card.querySelector('.next-round').textContent = `РХЛ · ${matchData.division || 'Старт'}`;
      card.querySelector('.button').href = next.url;
    } else {
      $('#next-heading').textContent = 'Ждём новые игры.';
      card.querySelector('.next-round').textContent = 'РАСПИСАНИЕ РХЛ';
      card.querySelector('.next-match').innerHTML = '<p class="schedule-empty">Новые матчи пока не опубликованы. Следим за расписанием РХЛ.</p>';
      card.querySelector('.button').href = matchData.source || 'https://mos.rhl.su/team/94/?season=65';
      card.querySelector('.button').textContent = 'Расписание в РХЛ';
    }
    if (matchData.standings) {
      const t = matchData.standings;
      const values = [t.games,t.wins,`${t.goals_for} : ${t.goals_against}`,`${t.place} / ${t.teams}`];
      $('[data-season-summary]').querySelectorAll('div > strong').forEach((n,i)=>{n.textContent=values[i]});
      $('[data-season-summary]').querySelector('div > span').textContent = 'СЫГРАНО МАТЧЕЙ';
      $('[data-season-summary]').querySelectorAll('div > span')[1].textContent = 'ПОБЕДЫ';
    }
    const checked = matchData.checked_at ? formattedDate(matchData.checked_at,{day:'2-digit',month:'2-digit',year:'numeric'}) : data.updated;
    $('.next-section .data-note').textContent = `РХЛ проверена ${checked}. Перед поездкой проверьте страницу матча.`;
  }

  function openPlayer(id) {
    const p = data.players.find((player) => player.id === id);
    if (!p) return;
    const goalkeeper = p.position === 'Вратарь';
    const birth = p.birth_date ? p.birth_date.split('.').map(Number) : null;
    const today = new Date();
    const age = birth ? today.getFullYear()-birth[2]-(today.getMonth()+1<birth[1] || (today.getMonth()+1===birth[1] && today.getDate()<birth[0]) ? 1 : 0) : null;
    const cells = (stats) => goalkeeper
      ? `<span><strong>${stats.games}</strong>Матчи</span>`
      : `<span><strong>${stats.games}</strong>Матчи</span><span><strong>${stats.goals}</strong>Голы</span><span><strong>${stats.assists}</strong>Передачи</span><span><strong>${stats.points}</strong>Очки</span>`;
    const career = p.club_stats ? `<section class="profile-section"><h3>За клуб в РХЛ</h3><p class="profile-period">Все сезоны · архив клуба на ${data.updated}</p><div class="dialog-stats">${cells(p.club_stats)}</div></section>` : '';
    const details = birth ? `<span>Дата рождения <b>${escape(p.birth_date)}</b></span><span>Возраст <b>${age}</b></span>` : '';
    $('#dialog-content').innerHTML = `<div class="profile-header"><div class="dialog-photo">${portrait(p)}</div><div class="profile-intro"><div class="eyebrow">SOUTH FAMILY · ${escape(p.position)}</div><h2 id="dialog-name">${escape(p.name)}</h2><div class="profile-details">${details}</div></div></div><div class="dialog-body"><section class="profile-section"><h3>Текущий сезон</h3><p class="profile-period">2026/2027 · РХЛ Москва · Старт</p><div class="dialog-stats">${cells(p)}</div></section>${career}<a class="button gold" href="${escape(p.profile_url)}" target="_blank" rel="noopener noreferrer">Полный профиль в РХЛ</a><p class="dialog-note">Статистика игрока на ${data.updated}.${goalkeeper ? ' Полная вратарская статистика в источнике не подтверждена.' : ''}</p></div>`;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  }
  document.querySelectorAll('[data-match-filter]').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('[data-match-filter]').forEach((b) => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
    renderMatches(button.dataset.matchFilter);
  }));
  document.querySelectorAll('[data-position]').forEach((button) => button.addEventListener('click', () => {
    position = button.dataset.position;
    expanded = false;
    document.querySelectorAll('[data-position]').forEach((b) => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
    renderPlayers();
  }));
  $('#player-search').addEventListener('input', (event) => { query = event.target.value; expanded = false; renderPlayers(); });
  $('#show-more').addEventListener('click', () => { expanded = !expanded; renderPlayers(); if (!expanded) $('#roster').scrollIntoView({block:'start'}); });
  $('#players-grid').addEventListener('click', (event) => { const card = event.target.closest('[data-player-id]'); if (card) openPlayer(card.dataset.playerId); });
  $('#close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; });
  // Local fallback keeps the roster readable when a downloaded photo is damaged.
  document.addEventListener('error', (event) => { const image = event.target; if (image instanceof HTMLImageElement && image.classList.contains('team-logo')) { image.remove(); return; } if (image instanceof HTMLImageElement && image.closest('.player-photo, .dialog-photo')) { const replacement = document.createElement('div'); replacement.className = 'initials'; replacement.textContent = initials(image.alt); replacement.setAttribute('aria-hidden','true'); image.replaceWith(replacement); } }, true);
  renderMatches();
  renderMatchOverview();
  renderPlayers();
})();

