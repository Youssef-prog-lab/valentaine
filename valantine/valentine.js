const OPTIONS = {
  where: [['☕','Coffee','The good little place'],['🍽️','Dinner','Somewhere with candles'],['🎬','Movie night','You pick, I\'ll allow it'],['🚶','A long walk','Until we\'re cold']],
  bring: [['🌷','Flowers','Obviously'],['🍰','Something sweet','For the walk after'],['🎵','A playlist','Made this morning'],['🤍','Just me','Not yet, anyway']],
  then:  [['🍨','Dessert','Obviously'],['✨','Stargazing','If it stays clear'],['🚗','A drive','Windows down'],['🏠','Not going home','Not yet, anyway']]
};
const TIMES = [['Morning',10,0,'10:00'],['Afternoon',15,0,'3:00'],['Evening',19,0,'7:00'],['Late night',21,30,'9:30']];

const state = { step: 0, date: null, time: null, where: null, bring: null, then: null };
const $ = (s, r = document) => r.querySelector(s);
const steps = [...document.querySelectorAll('.step')];
const LAST_PROGRESS = 5;

// progress bars
$('#bars').innerHTML = '<i></i>'.repeat(LAST_PROGRESS);

function go(n) {
  state.step = n;
  steps.forEach(s => { const on = +s.dataset.step === n; s.classList.toggle('is-active', on); s.inert = !on; });
  [...$('#bars').children].forEach((b, i) => b.classList.toggle('on', i < n));
  $('#back').hidden = n === 0 || n >= 5;
  if (n === 5) fillTicket();
  if (n === 6) fillCalendar();
}
$('#back').onclick = () => go(state.step - 1);

// step 0: No never accepts a no. It bolts, shrinks, and argues.
const yes = $('#yes'), no = $('#no');
const LINES = ['No', 'Think again...', 'Really?', 'Last chance...', 'Pretty please?', 'Okay, the answer is yes.'];
let dodges = 0;
function dodge() {
  dodges++;
  no.textContent = LINES[Math.min(dodges, LINES.length - 1)];
  yes.style.setProperty('--grow', 1 + dodges * .08);
  const x = Math.random() * (innerWidth - no.offsetWidth);
  const y = Math.random() * (innerHeight - no.offsetHeight);
  const shrink = Math.max(.5, 1 - dodges * .08);
  no.classList.add('is-loose');
  no.style.transform = `translate(${x}px, ${y}px) scale(${shrink})`;
}
no.addEventListener('pointerenter', dodge);
no.addEventListener('click', dodge);
$('#yes').onclick = () => go(1);

// step 1: days + times
const fmt = (d, o) => d.toLocaleDateString('en-US', o);
const today = new Date(); today.setHours(0, 0, 0, 0);
const addDays = n => { const d = new Date(today); d.setDate(d.getDate() + n); return d; };
const dayChoices = [
  ['Today', addDays(0)], ['Tomorrow', addDays(1)],
  [fmt(addDays(((6 - today.getDay() + 7) % 7) || 7), { weekday: 'short' }), addDays(((6 - today.getDay() + 7) % 7) || 7)],
  [fmt(addDays(((7 - today.getDay()) % 7) || 7), { weekday: 'short' }), addDays(((7 - today.getDay()) % 7) || 7)],
  ['Mon', addDays(((8 - today.getDay()) % 7) || 7)],
  ['Surprise me', addDays(3 + Math.floor(Math.random() * 6))]
];
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function choose(container, btn) {
  container.querySelectorAll('[role=radio]').forEach(o => o.setAttribute('aria-checked', 'false'));
  btn.setAttribute('aria-checked', 'true');
}
function radio(b) { b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false'); return b; }
document.querySelectorAll('.grid').forEach(g => g.setAttribute('role', 'radiogroup'));
dayChoices.forEach(([label, date], i) => {
  const b = document.createElement('button');
  radio(b).className = 'opt';
  b.dataset.iso = iso(date);
  b.innerHTML = `<b>${label}</b><small>${i === 5 ? 'you choose' : fmt(date, { month: 'short', day: 'numeric' })}</small>`;
  b.onclick = () => { choose($('#days'), b); state.date = date; maybeNext(); };
  $('#days').append(b);
});
TIMES.forEach(([label, h, m, shown]) => {
  const b = document.createElement('button');
  radio(b).className = 'opt';
  b.innerHTML = `<b>${label}</b><small>${shown}</small>`;
  b.onclick = () => { choose($('#times'), b); state.time = { label, h, m }; maybeNext(); };
  $('#times').append(b);
});
function maybeNext() { if (state.date && state.time) setTimeout(() => go(2), 350); }

// steps 2-4: simple choice grids
document.querySelectorAll('[data-key]').forEach(grid => {
  const key = grid.dataset.key;
  OPTIONS[key].forEach(([ic, title, hint]) => {
    const b = document.createElement('button');
    radio(b).className = 'opt';
    b.innerHTML = `<span class="ic">${ic}</span><b>${title}</b><small>${hint}</small>`;
    b.onclick = () => { choose(grid, b); state[key] = title; setTimeout(() => go(state.step + 1), 300); };
    grid.append(b);
  });
});

// step 5: ticket + countdown
function when() {
  const d = new Date(state.date);
  d.setHours(state.time.h, state.time.m, 0, 0);
  return d;
}
function fillTicket() {
  const d = when();
  const rows = [
    ['WHEN', fmt(d, { weekday: 'long', month: 'short', day: 'numeric' })],
    ['TIME', `${state.time.label} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`],
    ['WHERE', state.where], ['BRING', state.bring], ['THEN', state.then]
  ];
  $('#ticket').innerHTML = rows.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
  tick();
}
function tick() {
  if (state.step !== 5) return;
  let s = Math.max(0, Math.floor((when() - Date.now()) / 1000));
  const dd = Math.floor(s / 86400); s %= 86400;
  const p = n => String(n).padStart(2, '0');
  $('#count').textContent = `${dd}D ${p(Math.floor(s / 3600))}:${p(Math.floor(s % 3600 / 60))}:${p(s % 60)}`;
}
setInterval(tick, 1000);

// share + calendar file
$('#share').onclick = async () => {
  const text = `It's a date! ${fmt(when(), { weekday: 'long', month: 'short', day: 'numeric' })}, ${state.where}.`;
  try { navigator.share ? await navigator.share({ title: 'Our date', text }) : await navigator.clipboard.writeText(text); } catch (e) {}
  $('#share').textContent = navigator.share ? 'Share' : 'Copied';
};
$('#add').onclick = () => {
  const d = when(), end = new Date(d.getTime() + 2 * 3600e3);
  const z = x => x.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `DTSTART:${z(d)}`, `DTEND:${z(end)}`,
    'SUMMARY:Our date 💌', `DESCRIPTION:${state.where} · bring ${state.bring} · then ${state.then}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = 'our-date.ics';
  a.click();
  go(6);
};

// step 6: month calendar
function fillCalendar() {
  const d = when(), y = d.getFullYear(), m = d.getMonth();
  $('#month').textContent = fmt(d, { month: 'long', year: 'numeric' });
  const first = new Date(y, m, 1).getDay(), total = new Date(y, m + 1, 0).getDate();
  let html = 'MTWTFSS'.split('').map(c => `<span class="h">${c}</span>`).join('');
  html += '<span></span>'.repeat((first + 6) % 7);
  for (let i = 1; i <= total; i++) html += `<span class="d${i === d.getDate() ? ' hit' : ''}">${i}</span>`;
  $('#cal').innerHTML = html;
  $('#final').innerHTML = `It's <b style="color:var(--soft)">${fmt(d, { weekday: 'long', month: 'short', day: 'numeric' })}</b>, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.<br>I'll be counting down with you.`;
}
$('#see').onclick = () => {
  state.date = state.time = null;
  document.querySelectorAll('[aria-checked=true]').forEach(e => e.setAttribute('aria-checked', 'false'));
  dodges = 0; no.textContent = LINES[0]; no.className = 'btn ghost'; no.style.transform = ''; yes.style.removeProperty('--grow');
  go(0);
};

// floating hearts
const hearts = $('#hearts');
for (let i = 0; i < 14; i++) {
  const h = document.createElement('i');
  h.textContent = '♥';
  h.style.cssText = `left:${Math.random() * 100}%;font-size:${10 + Math.random() * 16}px;animation-duration:${12 + Math.random() * 14}s;animation-delay:${-Math.random() * 20}s`;
  hearts.append(h);
}