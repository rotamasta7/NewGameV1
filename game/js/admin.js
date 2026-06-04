// Admin panel — dev tool, password-protected
// Displays session stats and provides test triggers

const ADMIN_PASSWORD = 'taitsisahomo';

const adminEl = {};
let adminUnlocked = false;
let adminRefreshTimer = null;

function adminCacheDom() {
  ['adminTrigger','adminPanel','adminLogin','adminPwd','adminLoginBtn',
   'adminContent','adminStats'].forEach(id => {
    const e = document.getElementById(id);
    if (e) adminEl[id] = e;
  });
}

function adminToggle() {
  if (!adminEl.adminPanel) return;
  const hidden = adminEl.adminPanel.classList.toggle('hidden');
  if (!hidden) {
    if (!adminUnlocked) adminEl.adminPwd.focus();
    else adminRefreshStats();
  }
}

function adminLogin() {
  if (adminEl.adminPwd.value === ADMIN_PASSWORD) {
    adminUnlocked = true;
    adminEl.adminLogin.classList.add('hidden');
    adminEl.adminContent.classList.remove('hidden');
    adminRefreshStats();
  } else {
    adminEl.adminPwd.value = '';
    adminEl.adminPwd.placeholder = 'wrong password';
  }
}

function adminRefreshStats() {
  if (!adminEl.adminStats || !adminUnlocked) return;
  const s = state;
  const rtp = s.session.wagered > 0
    ? ((s.session.won / s.session.wagered) * 100).toFixed(1) : '—';
  let rows = `
    <div class="as-row"><span>Spins</span><span>${s.session.spins}</span></div>
    <div class="as-row"><span>Wagered</span><span>${s.session.wagered.toLocaleString()}</span></div>
    <div class="as-row"><span>Won</span><span>${s.session.won.toLocaleString()}</span></div>
    <div class="as-row"><span>Session RTP</span><span>${rtp}%</span></div>
    <div class="as-row"><span>Biggest Win</span><span>${s.session.biggestWin.toLocaleString()}</span></div>
    <div class="as-row"><span>Features</span><span>${s.session.features}</span></div>
    <div class="as-row"><span>Credits</span><span>${s.credits.toLocaleString()}</span></div>
    <div class="as-row"><span>Mode</span><span>${s.mode}</span></div>
  `;
  if (s.mode === 'feature') {
    rows += `
    <div class="as-row"><span>Free Left</span><span>${s.freeGames}</span></div>
    <div class="as-row"><span>Collected</span><span>${s.collected}</span></div>
    <div class="as-row"><span>Wild Reels</span><span>${s.wildReels.length ? s.wildReels.map(r => r+1).join(', ') : 'none'}</span></div>
    <div class="as-row"><span>Feature Won</span><span>${s.featureWonTotal.toLocaleString()}</span></div>
    `;
  }
  adminEl.adminStats.innerHTML = rows;
}

function adminAction(action) {
  switch (action) {
    case 'scatter3':
      if (state.mode !== 'base' || state.spinning) break;
      state.session.features++;
      triggerFeature(3);
      break;
    case 'scatter4':
      if (state.mode !== 'base' || state.spinning) break;
      state.session.features++;
      triggerFeature(4);
      break;
    case 'scatter5':
      if (state.mode !== 'base' || state.spinning) break;
      state.session.features++;
      triggerFeature(5);
      break;
    case 'credits':
      state.credits += 1000;
      if (el.credits) el.credits.textContent = state.credits.toLocaleString();
      break;
    case 'bigwin':
      showBigWinSequence(state.credits > 0 ? Math.round(state.credits * 0.1) : 9999, 50, null);
      break;
    case 'thresh1': {
      if (state.mode !== 'feature') break;
      const before1 = state.collected;
      state.collected = Math.max(state.collected, 8);
      state.collected++;
      bumpCollect();
      checkThresholds(before1, nextFreeGame);
      break;
    }
    case 'thresh2': {
      if (state.mode !== 'feature') break;
      const before2 = state.collected;
      state.collected = Math.max(state.collected, 14);
      bumpCollect();
      checkThresholds(before2, nextFreeGame);
      break;
    }
    case 'thresh3': {
      if (state.mode !== 'feature') break;
      const before3 = state.collected;
      state.collected = Math.max(state.collected, 30);
      bumpCollect();
      checkThresholds(before3, nextFreeGame);
      break;
    }
    case 'endfeature':
      if (state.mode !== 'feature') break;
      state.freeGames = 0;
      endFeature();
      break;
    case 'reset':
      location.reload();
      return;
  }
  adminRefreshStats();
}

function adminInit() {
  adminCacheDom();
  if (!adminEl.adminTrigger) return;

  adminEl.adminTrigger.addEventListener('click', adminToggle);
  adminEl.adminLoginBtn.addEventListener('click', adminLogin);
  adminEl.adminPwd.addEventListener('keydown', e => {
    if (e.key === 'Enter') adminLogin();
  });

  document.querySelectorAll('[data-admin-action]').forEach(btn => {
    btn.addEventListener('click', () => adminAction(btn.dataset.adminAction));
  });

  // Auto-refresh stats while panel is open
  setInterval(() => {
    if (adminUnlocked && adminEl.adminPanel && !adminEl.adminPanel.classList.contains('hidden')) {
      adminRefreshStats();
    }
  }, 1000);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', adminInit);
else adminInit();
