// ============================================================
//  Voyage Europa — SPA (v3: booking wizard, cookies, EN default)
// ============================================================

const app = document.getElementById('app');
const nav = document.getElementById('nav');
const footerCountries = document.getElementById('footer-countries');
const cartCountEl = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const cartBody = document.getElementById('cart-body');
const excModal = document.getElementById('exc-modal');
const excBody = document.getElementById('exc-body');
const toastEl = document.getElementById('toast');
const cookieEl = document.getElementById('cookie-banner');

// ---------- i18n ----------
let currentLang = localStorage.getItem('ve_lang') || 'en';
if (!I18N[currentLang]) currentLang = 'en';

const t = (key, vars) => {
  const dict = I18N[currentLang] || I18N.en;
  const path = key.split('.');
  let v = dict;
  for (const p of path) v = (v == null) ? undefined : v[p];
  if (v == null) {
    // Fallback to English
    v = I18N.en;
    for (const p of path) v = (v == null) ? undefined : v[p];
  }
  if (v == null) return key;
  if (vars) for (const k in vars) v = String(v).replace('{' + k + '}', vars[k]);
  return v;
};

const localCountry = (id) => t('countries.' + id);
// City names are already in the local European spelling in data.js
const localCity = (name) => name;

// ---------- Cookie consent ----------
const COOKIE_KEY = 've_cookie_v1';
function ensureCookieBanner() {
  if (localStorage.getItem(COOKIE_KEY)) { cookieEl.classList.remove('open'); return; }
  cookieEl.innerHTML = `
    <div class="cookie-inner">
      <div class="cookie-copy">
        <strong>${t('cookie_title')}</strong>
        <p>${t('cookie_text')} <a href="#/privacy" onclick="closeCookieAndGo(event, '#/privacy')">${t('cookie_learn')}</a></p>
      </div>
      <div class="cookie-actions">
        <button class="btn btn-ghost" onclick="setCookieConsent('essential')">${t('cookie_essential')}</button>
        <button class="btn btn-primary" onclick="setCookieConsent('all')">${t('cookie_accept')}</button>
      </div>
    </div>`;
  cookieEl.classList.add('open');
}
function setCookieConsent(level) {
  localStorage.setItem(COOKIE_KEY, JSON.stringify({ level, ts: Date.now() }));
  cookieEl.classList.remove('open');
}
function closeCookieAndGo(e, hash) {
  e.preventDefault();
  setCookieConsent('essential');
  location.hash = hash;
}

// ---------- Cart state ----------
const CART_KEY = 've_cart_v3';
let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
const saveCart = () => { localStorage.setItem(CART_KEY, JSON.stringify(cart)); cartCountEl.textContent = cart.length; };
saveCart();

const removeFromCart = (excursionId) => {
  cart = cart.filter(i => i.excursionId !== excursionId);
  saveCart(); renderCart();
};
const openCart = () => { renderCart(); cartModal.classList.add('active'); };
const closeCart = () => cartModal.classList.remove('active');
cartModal.addEventListener('click', (e) => { if (e.target === cartModal) closeCart(); });
excModal.addEventListener('click', (e) => { if (e.target === excModal) closeExc(); });

const toast = (msg) => {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toastEl.classList.remove('show'), 2400);
};

// ---------- SVG generator ----------
const PALETTES = [
  ['#F4A261', '#E76F51', '#264653'],
  ['#8ECAE6', '#219EBC', '#023047'],
  ['#FFB4A2', '#E5989B', '#6D6875'],
  ['#B5C99A', '#468189', '#031D44'],
  ['#F7B267', '#F25C54', '#7A0B23'],
  ['#A8DADC', '#457B9D', '#1D3557'],
  ['#FFD97D', '#EE964B', '#F95738'],
  ['#CDB4DB', '#FFC8DD', '#A2D2FF'],
  ['#FFBE0B', '#FB5607', '#3A0CA3'],
  ['#95D5B2', '#52B788', '#2D6A4F'],
  ['#F8AD9D', '#FEE4CE', '#F79D65'],
  ['#B8B8FF', '#FFB4E1', '#FFDC93'],
];
const ICONS = {
  church: '⛪', museum: '🏛️', castle: '🏰', park: '🌳', wine: '🍷',
  food: '🍽️', boat: '⛵', bike: '🚲', tram: '🚋', walk: '🚶',
  night: '🌃', mountain: '⛰️', beach: '🏖️', bridge: '🌉', tower: '🗼',
  garden: '🌸', theater: '🎭', square: '🏛️', shop: '🛍️', spa: '💆',
  river: '🚤', old: '🏘️', bus: '🚌', default: '📍'
};
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return Math.abs(h); };
const iconFor = (name) => {
  const s = (name || '').toLowerCase();
  const map = [
    ['cathedral|basilica|church|monastery|chapel|abbey', 'church'],
    ['castle|palace|fortress|citadel|château|schloss', 'castle'],
    ['museum|gallery|louvre|uffizi|prado', 'museum'],
    ['park|garden|alhambra|generalife|zwinger', 'garden'],
    ['wine|vineyard|winery|tasting|beaujolais|chianti|tokaj|rioja', 'wine'],
    ['food|tapas|pasta|pizza|beer|brewery|bouillabaisse|dumpling', 'food'],
    ['boat|cruise|yacht|ferry|rafting|catamaran', 'boat'],
    ['bike|cycling|cycle', 'bike'],
    ['tram|funicular|cogwheel|train|golden pass', 'tram'],
    ['night|sunset|evening|bar', 'night'],
    ['mountain|alp|peak|matterhorn|jungfrau|pilatus|rigi|hike', 'mountain'],
    ['beach|coast|island|riviera', 'beach'],
    ['bridge|pont|viaduct', 'bridge'],
    ['tower|eiffel|minaret|belfry', 'tower'],
    ['theatre|opera|philharmonie|scala|kunstverein', 'theater'],
    ['square|plaza|piazza', 'square'],
    ['shop|market|bazaar|outlet', 'shop'],
    ['spa|therm|bath|caracalla', 'spa'],
    ['river|canal', 'river'],
    ['old town|historic|quarter|walking', 'old'],
    ['day trip|panorama|tour', 'bus'],
  ];
  for (const [rx, key] of map) if (new RegExp(rx).test(s)) return ICONS[key];
  return ICONS.default;
};
const svgPostcard = (title, subtitle, seed) => {
  const h = hash(seed || title);
  const [c1, c2, c3] = PALETTES[h % PALETTES.length];
  const icon = iconFor(title);
  const pattern = h % 4;
  const layers = [];
  if (pattern === 0) {
    layers.push(`<path d="M0,220 L120,120 L200,180 L320,80 L440,180 L520,140 L640,220 Z" fill="${c3}" opacity="0.55"/>`);
    layers.push(`<path d="M0,240 L100,180 L220,220 L340,150 L480,220 L640,190 L640,240 Z" fill="${c3}" opacity="0.85"/>`);
  } else if (pattern === 1) {
    let sky = '';
    for (let i = 0; i < 12; i++) {
      const x = i * 55, barH = 60 + ((h >> i) % 100), w = 40 + ((h >> (i + 3)) % 15);
      sky += `<rect x="${x}" y="${240 - barH}" width="${w}" height="${barH}" fill="${c3}" opacity="${0.55 + (i % 3) * 0.1}"/>`;
    }
    layers.push(sky);
  } else if (pattern === 2) {
    layers.push(`<path d="M0,240 Q160,140 320,240 T640,240 Z" fill="${c3}" opacity="0.5"/>`);
    layers.push(`<path d="M0,260 Q160,180 320,260 T640,260 Z" fill="${c3}" opacity="0.85"/>`);
  } else {
    layers.push(`<path d="M0,240 L200,240 L200,150 L220,150 L240,110 L260,150 L280,150 L280,240 L360,240 L360,180 L640,180 L640,240 Z" fill="${c3}" opacity="0.75"/>`);
    layers.push(`<circle cx="500" cy="80" r="34" fill="${c1}" opacity="0.7"/>`);
  }
  return `<svg viewBox="0 0 640 240" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;">
    <defs><linearGradient id="g${h}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
    <rect width="640" height="240" fill="url(#g${h})"/>
    <circle cx="${100 + (h % 400)}" cy="60" r="24" fill="#fff" opacity="0.35"/>
    ${layers.join('')}
    <text x="30" y="60" font-family="serif" font-size="52" fill="#fff" opacity="0.92">${icon}</text>
    ${subtitle ? `<text x="30" y="220" font-family="Manrope, sans-serif" font-size="14" font-weight="600" fill="#fff" opacity="0.9" letter-spacing="2">${escapeHTML(subtitle.toUpperCase())}</text>` : ''}
  </svg>`;
};
const svgCountryHero = (country) => {
  const [c1, c2, c3] = PALETTES[hash(country.id) % PALETTES.length];
  return `<svg viewBox="0 0 1200 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;">
    <defs><linearGradient id="gh${country.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="0.6" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient></defs>
    <rect width="1200" height="400" fill="url(#gh${country.id})"/>
    <circle cx="1000" cy="90" r="70" fill="#fff" opacity="0.25"/>
    <path d="M0,340 L150,240 L280,300 L440,180 L600,290 L780,220 L920,300 L1080,240 L1200,320 L1200,400 L0,400 Z" fill="${c3}" opacity="0.6"/>
    <path d="M0,360 L200,290 L380,340 L560,270 L740,350 L920,300 L1200,380 L1200,400 L0,400 Z" fill="${c3}" opacity="0.9"/>
  </svg>`;
};
const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

// ---------- Reviews (procedurally generated in English) ----------
const REVIEW_NAMES = [
  'Emma T.', 'Lucas M.', 'Sophie R.', 'Ethan K.', 'Olivia B.', 'Noah G.', 'Chloe H.', 'Liam P.',
  'Isabella F.', 'Mason C.', 'Amelia D.', 'Oliver S.', 'Charlotte V.', 'James W.', 'Mia N.', 'Henry L.',
  'Ava J.', 'Leo B.', 'Grace A.', 'Nathan O.', 'Zoe D.', 'Adrian E.', 'Alice R.', 'Marco P.',
];
const REVIEW_TEMPLATES = [
  'Fantastic experience! Our guide {guide} shared so many fascinating facts — time flew by. Highly recommended.',
  'Absolutely worth it. {guide} was a real professional, answered every question and adapted the pace to our group.',
  'Great value for money. For €{price} we got a proper programme, not just a superficial overview.',
  'Booked the day before, all smooth: confirmation came instantly, guide met us at the hotel on time. Thank you!',
  'Only positive impressions. The group was small, so everyone could see and hear everything.',
  'The tour lived up to expectations. Plenty of historical details, but delivered in a lively way — not like a textbook.',
  'We took it for the whole family with kids — the route was adapted, nobody got tired. Big thanks to {guide}!',
  'Second time booking with Voyage Europa and again everything went smoothly. We’ll be back.',
  'Only downside — I didn’t want it to end. Three hours felt like a moment.',
  'Guide speaks excellent English, humour on point, knows the local hidden spots. Top.',
  'Exactly what was described — no surprises, no disappointments. Everything on schedule.',
  'Special thanks for the photos {guide} took for us at the end of the tour. Nice keepsake.',
];
const GUIDES = ['Maria', 'Jose', 'Julia', 'Stefan', 'Marta', 'Peter', 'Anna', 'Nikola'];

const buildReviews = (exc) => {
  const count = 3 + (hash(exc.id + '-cnt') % 3);
  const out = [];
  const usedTpl = new Set(), usedName = new Set();
  for (let i = 0; i < count; i++) {
    let tplI = hash(exc.id + '-tpl-' + i) % REVIEW_TEMPLATES.length;
    while (usedTpl.has(tplI)) tplI = (tplI + 1) % REVIEW_TEMPLATES.length;
    usedTpl.add(tplI);
    let nameI = hash(exc.id + '-name-' + i) % REVIEW_NAMES.length;
    while (usedName.has(nameI)) nameI = (nameI + 1) % REVIEW_NAMES.length;
    usedName.add(nameI);
    const guideI = hash(exc.id + '-gd-' + i) % GUIDES.length;
    const daysAgo = 3 + (hash(exc.id + '-d-' + i) % 120);
    const stars = 4 + (hash(exc.id + '-s-' + i) % 100 < 75 ? 1 : 0);
    const text = REVIEW_TEMPLATES[tplI].replace('{guide}', GUIDES[guideI]).replace('{price}', exc.price);
    const d = new Date(Date.now() - daysAgo * 86400000);
    const date = d.toLocaleDateString(LOCALE_TAG[currentLang] || 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    out.push({ name: REVIEW_NAMES[nameI], text, stars, date });
  }
  return out;
};
const initials = (name) => {
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
};

// ---------- Router ----------
window.addEventListener('hashchange', () => {
  // Close any open modal when navigating.
  if (excModal.classList.contains('active')) closeExc();
  if (cartModal.classList.contains('active')) closeCart();
  render();
});
window.addEventListener('load', () => {
  document.documentElement.lang = currentLang;
  buildHeader();
  buildFooter();
  render();
  ensureCookieBanner();
});

const parseRoute = () => {
  const h = (location.hash || '#/').slice(2);
  return h.split('/').filter(Boolean).map(decodeURIComponent);
};
const setActiveNav = (id) => nav.querySelectorAll('a').forEach(a => a.classList.toggle('active', a.dataset.country === id));

function buildHeader() {
  document.getElementById('logo-sub').textContent = t('logo_sub');
  document.getElementById('cart-label').textContent = t('cart');
  nav.innerHTML = DATA.countries.map(c => `<a href="#/country/${c.id}" data-country="${c.id}">${localCountry(c.id)}</a>`).join('');
  const cur = LANG_LIST.find(l => l.code === currentLang);
  document.getElementById('lang-switch').innerHTML = `
    <button class="lang-btn" onclick="toggleLangMenu()">
      <span>${cur.flag}</span><span class="lang-code">${currentLang.toUpperCase()}</span><span class="lang-caret">▾</span>
    </button>
    <div class="lang-menu" id="lang-menu">
      ${LANG_LIST.map(l => `
        <button class="lang-opt ${l.code === currentLang ? 'active' : ''}" onclick="setLang('${l.code}')">
          <span>${l.flag}</span><span>${I18N[l.code].lang_name}</span>
        </button>`).join('')}
    </div>`;
}

function buildFooter() {
  document.getElementById('footer-desc').textContent = t('footer_desc');
  document.getElementById('footer-copy').textContent = t('copyright');
  document.getElementById('footer-h-dir').textContent = t('f_directions');
  document.getElementById('footer-h-co').textContent = t('f_company');
  document.getElementById('footer-h-sup').textContent = t('f_support');
  document.getElementById('footer-links-co').innerHTML = `
    <li><a href="#/about">${t('f_about')}</a></li>
    <li><a href="#/contacts">${t('f_contacts')}</a></li>
    <li><a href="#/reviews">${t('f_reviews')}</a></li>
    <li><a href="#/blog">${t('f_blog')}</a></li>`;
  document.getElementById('footer-links-sup').innerHTML = `
    <li><a href="#/faq">${t('f_faq')}</a></li>
    <li><a href="#/terms">${t('f_terms')}</a></li>
    <li><a href="#/privacy">${t('f_privacy')}</a></li>
    <li><a href="mailto:${COMPANY.email}">${COMPANY.email}</a></li>`;
  footerCountries.innerHTML = DATA.countries.map(c => `<li><a href="#/country/${c.id}">${c.flag} ${localCountry(c.id)}</a></li>`).join('');
}

function toggleLangMenu() { document.getElementById('lang-menu').classList.toggle('open'); }
function setLang(code) {
  if (!I18N[code]) return;
  currentLang = code;
  localStorage.setItem('ve_lang', code);
  document.documentElement.lang = code;
  buildHeader(); buildFooter(); render();
  if (!localStorage.getItem(COOKIE_KEY)) ensureCookieBanner();
}
document.addEventListener('click', (e) => {
  const menu = document.getElementById('lang-menu');
  const btn = e.target.closest('.lang-btn');
  if (menu && !btn && !e.target.closest('.lang-menu')) menu.classList.remove('open');
});

function render() {
  window.scrollTo({ top: 0, behavior: 'instant' });
  const [route, ...args] = parseRoute();
  if (!route) return renderHome();
  if (route === 'country' && args[0]) {
    const c = DATA.countries.find(x => x.id === args[0]);
    if (c) return renderCountry(c);
  }
  if (route === 'city' && args[0] && args[1]) {
    const c = DATA.countries.find(x => x.id === args[0]);
    const city = c?.cities.find(x => x.id === args[1]);
    if (c && city) return renderCity(c, city);
  }
  if (route === 'search') return renderSearch(args[0] || '');
  if (route === 'privacy') return renderPrivacy();
  if (route === 'contacts') return renderContacts();
  if (route === 'terms') return renderTerms();
  if (route === 'order') return renderOrderStatus(args[0] || 'unknown');
  renderHome();
}

// ---------- Home ----------
function renderHome() {
  setActiveNav(null);
  const totalExc = DATA.countries.reduce((n, c) => n + c.cities.reduce((s, ci) => s + ci.excursions.length, 0), 0);
  const totalCities = DATA.countries.reduce((n, c) => n + c.cities.length, 0);
  app.innerHTML = `
    <section class="hero">
      <div class="container">
        <span class="eyebrow">${t('hero_eyebrow')}</span>
        <h1>${escapeHTML(t('hero_pre'))} <em>${escapeHTML(t('hero_em'))}</em></h1>
        <p class="hero-sub">${t('hero_sub', { n: totalExc, c: totalCities })}</p>
        <form class="search" onsubmit="event.preventDefault(); location.hash='#/search/'+encodeURIComponent(this.q.value);">
          <input name="q" placeholder="${escapeHTML(t('search_ph'))}" autocomplete="off">
          <button class="search-btn" type="submit">${t('search')}</button>
        </form>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="section-head"><div>
          <span class="eyebrow">${t('directions_eye')}</span>
          <h2>${t('directions_t')}</h2>
          <p>${t('directions_d')}</p>
        </div></div>
        <div class="country-grid">
          ${DATA.countries.map(c => `
            <div class="country-card" onclick="location.hash='#/country/${c.id}'">
              <div class="card-bg">${svgCountryHero(c)}</div>
              <div class="card-overlay"></div>
              <div class="card-content">
                <div class="flag">${c.flag}</div><h3>${localCountry(c.id)}</h3>
                <div class="card-meta">
                  <span>${t('n_cities', { n: c.cities.length })}</span><span>·</span>
                  <span>${t('n_excursions', { n: c.cities.reduce((s, ci) => s + ci.excursions.length, 0) })}</span>
                </div>
              </div>
            </div>`).join('')}
        </div>
      </div>
    </section>
    <section class="section" style="background:var(--color-surface-alt);">
      <div class="container">
        <div class="section-head"><div><span class="eyebrow">${t('why_eye')}</span><h2>${t('why_t')}</h2></div></div>
        <div class="features">
          ${[1, 2, 3, 4].map(i => `
            <div class="feature">
              <div class="feature-icon">${['✓', '↺', '☎', '€'][i - 1]}</div>
              <h4>${t('feat' + i + '_t')}</h4>
              <p>${t('feat' + i + '_d')}</p>
            </div>`).join('')}
        </div>
      </div>
    </section>`;
}

function renderCountry(country) {
  setActiveNav(country.id);
  app.innerHTML = `
    <div class="container">
      <div class="crumbs"><a href="#/">${t('nav_home')}</a> / <span>${localCountry(country.id)}</span></div>
      <div class="page-hero">
        <div class="card-bg">${svgCountryHero(country)}</div>
        <div class="card-overlay"></div>
        <div class="content">
          <div class="flag">${country.flag}</div><h1>${localCountry(country.id)}</h1>
          <p>${country.description}</p>
        </div>
      </div>
    </div>
    <section class="section" style="padding-top:20px;">
      <div class="container">
        <div class="section-head"><div>
          <span class="eyebrow">${t('cities_eye')}</span>
          <h2>${t('cities_t')}</h2>
          <p>${t('n_cities', { n: country.cities.length })} · ${t('n_excursions', { n: country.cities.reduce((s, c) => s + c.excursions.length, 0) })}</p>
        </div></div>
        <div class="city-grid">
          ${country.cities.map(city => `
            <div class="city-card" onclick="location.hash='#/city/${country.id}/${city.id}'">
              <div class="card-bg">${svgPostcard(city.name, city.name, city.id + country.id)}</div>
              <div class="card-overlay"></div>
              <div class="card-content">
                <h4>${localCity(city.name)}</h4>
                <div class="card-meta">${t('n_excursions', { n: city.excursions.length })} · ${t('from_price', { p: Math.min(...city.excursions.map(e => e.price)) })}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>
    </section>`;
}

function renderCity(country, city) {
  setActiveNav(country.id);
  const inCart = (id) => cart.find(i => i.excursionId === id);
  app.innerHTML = `
    <div class="container">
      <div class="crumbs">
        <a href="#/">${t('nav_home')}</a> /
        <a href="#/country/${country.id}">${localCountry(country.id)}</a> /
        <span>${localCity(city.name)}</span>
      </div>
      <div class="page-hero">
        <div class="card-bg">${svgPostcard(city.name, localCountry(country.id), city.id + '-hero')}</div>
        <div class="card-overlay"></div>
        <div class="content"><h1>${localCity(city.name)}</h1><p>${city.description}</p></div>
      </div>
    </div>
    <section class="section" style="padding-top:20px;">
      <div class="container">
        <div class="section-head"><div>
          <span class="eyebrow">${t('excursions_eye')}</span>
          <h2>${t('n_routes', { n: city.excursions.length })}</h2>
          <p>${t('routes_sub')}</p>
        </div></div>
        <div class="excursion-grid">
          ${city.excursions.map(e => `
            <article class="excursion-card" onclick="openExc('${country.id}','${city.id}','${e.id}')">
              <div class="card-img">${svgPostcard(e.name, localCity(city.name), e.id)}<span class="badge">${e.duration}</span></div>
              <div class="card-body">
                <div class="card-meta">
                  <span class="rating">${e.rating.toFixed(1)}</span><span>·</span>
                  <span>${e.reviews} ${t('reviews')}</span>
                </div>
                <h4>${e.name}</h4>
                <p class="card-desc">${e.description}</p>
                <div class="card-footer">
                  <div class="price">€${e.price}<small>${t('per_person')}</small></div>
                  <button class="book-btn ${inCart(e.id) ? 'in-cart' : ''}" onclick="event.stopPropagation(); openExc('${country.id}','${city.id}','${e.id}')">
                    ${inCart(e.id) ? t('in_cart') : t('book')}
                  </button>
                </div>
              </div>
            </article>`).join('')}
        </div>
      </div>
    </section>`;
}

function renderSearch(query) {
  setActiveNav(null);
  const q = query.toLowerCase().trim();
  const results = [];
  DATA.countries.forEach(country => country.cities.forEach(city => city.excursions.forEach(exc => {
    const hay = `${country.name} ${localCountry(country.id)} ${city.name} ${exc.name} ${exc.description}`.toLowerCase();
    if (!q || hay.includes(q)) results.push({ country, city, exc });
  })));
  app.innerHTML = `
    <div class="container">
      <div class="crumbs"><a href="#/">${t('nav_home')}</a> / <span>${t('search_results')}: «${escapeHTML(query)}»</span></div>
    </div>
    <section class="section" style="padding-top:20px;">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">${t('search_results')}</span>
            <h2>${t('found_n', { n: results.length })}</h2>
          </div>
          <form class="search" style="max-width:420px;margin:0;" onsubmit="event.preventDefault(); location.hash='#/search/'+encodeURIComponent(this.q.value);">
            <input name="q" placeholder="${escapeHTML(t('search_ph'))}" value="${escapeHTML(query)}">
            <button class="search-btn" type="submit">${t('search')}</button>
          </form>
        </div>
        ${results.length === 0 ? `<div class="no-results">${t('no_results')}</div>` : `
          <div class="excursion-grid">
            ${results.slice(0, 60).map(({ country, city, exc }) => `
              <article class="excursion-card" onclick="openExc('${country.id}','${city.id}','${exc.id}')">
                <div class="card-img">${svgPostcard(exc.name, localCity(city.name), exc.id)}<span class="badge">${exc.duration}</span></div>
                <div class="card-body">
                  <div class="card-meta"><span class="rating">${exc.rating.toFixed(1)}</span><span>·</span><span>${country.flag} ${localCity(city.name)}</span></div>
                  <h4>${exc.name}</h4>
                  <p class="card-desc">${exc.description}</p>
                  <div class="card-footer">
                    <div class="price">€${exc.price}<small>${t('per_person')}</small></div>
                    <button class="book-btn" onclick="event.stopPropagation(); openExc('${country.id}','${city.id}','${exc.id}')">${t('book')}</button>
                  </div>
                </div>
              </article>`).join('')}
          </div>`}
      </div>
    </section>`;
}

// ---------- Excursion + Booking wizard ----------
let currentExcCtx = null;

function openExc(countryId, cityId, excursionId) {
  const country = DATA.countries.find(c => c.id === countryId);
  const city = country?.cities.find(x => x.id === cityId);
  const exc = city?.excursions.find(e => e.id === excursionId);
  if (!exc) return;
  currentExcCtx = {
    country, city, exc,
    reviews: buildReviews(exc), showAllReviews: false,
    step: 0,
    date: '', people: 1,
    form: { firstName: '', lastName: '', email: '', phone: '', address: '', city: '', postcode: '', country: '' },
    errors: {},
  };
  renderExc();
  excModal.classList.add('active');
}
function closeExc() { excModal.classList.remove('active'); currentExcCtx = null; }

function tomorrowISO() {
  const d = new Date(Date.now() + 86400000);
  return d.toISOString().slice(0, 10);
}

function excSetDate(v) { if (currentExcCtx) { currentExcCtx.date = v; renderExc(); } }
function excSetPeople(delta) {
  if (!currentExcCtx) return;
  currentExcCtx.people = Math.max(1, Math.min(20, currentExcCtx.people + delta));
  renderExc();
}
function excSetField(name, value) {
  if (!currentExcCtx) return;
  currentExcCtx.form[name] = value;
  if (currentExcCtx.errors[name]) { delete currentExcCtx.errors[name]; renderExc(); }
}
function excToggleReviews() { currentExcCtx.showAllReviews = !currentExcCtx.showAllReviews; renderExc(); }

function excGoStep(target) {
  if (!currentExcCtx) return;
  const ctx = currentExcCtx;
  if (target > ctx.step) {
    if (ctx.step === 0 && !ctx.date) { toast(t('field_required')); return; }
    if (ctx.step === 2) {
      const errs = validateForm(ctx.form);
      if (Object.keys(errs).length) { ctx.errors = errs; renderExc(); return; }
    }
  }
  ctx.step = target;
  renderExc();
}

function validateForm(f) {
  const e = {};
  ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'postcode', 'country'].forEach(k => { if (!f[k] || !f[k].trim()) e[k] = 'required'; });
  if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) e.email = 'email';
  if (f.phone && !/^[+\d][\d\s()\-.]{6,}$/.test(f.phone)) e.phone = 'phone';
  return e;
}

// Order matches the payment gateway's documented example URL.
const PAYMENT_PARAM_ORDER = [
  'site', 'icon', 'image', 'amount', 'symbol', 'vat',
  'riderect_success', 'riderect_failed', 'riderect_back',
  'order_id',
  'billing_first_name', 'billing_last_name', 'billing_address_1',
  'billing_city', 'billing_state', 'billing_postcode', 'billing_country',
  'billing_email', 'billing_phone',
];

function excCheckout() {
  if (!currentExcCtx) return;
  const { exc, form, people, date, country } = currentExcCtx;
  const total = (exc.price * people).toFixed(2);
  // Numeric only — some gateways parse order_id strictly.
  const orderId = String(Date.now()) + String(Math.floor(1000 + Math.random() * 8999));
  const fields = {
    site: PAYMENT_STATIC.site,
    icon: PAYMENT_STATIC.icon,
    image: PAYMENT_STATIC.image,
    amount: total,
    symbol: PAYMENT_STATIC.symbol,
    vat: PAYMENT_STATIC.vat,
    riderect_success: PAYMENT_STATIC.riderect_success,
    riderect_failed: PAYMENT_STATIC.riderect_failed,
    riderect_back: PAYMENT_STATIC.riderect_back,
    order_id: orderId,
    billing_first_name: form.firstName,
    billing_last_name: form.lastName,
    billing_address_1: form.address,
    billing_city: form.city,
    // Fallback to country code / country name when we don't have a state.
    billing_state: (form.country || form.city).slice(0, 2).toUpperCase(),
    billing_postcode: form.postcode,
    billing_country: form.country,
    billing_email: form.email,
    billing_phone: form.phone,
  };
  cart.push({
    excursionId: exc.id, cityId: currentExcCtx.city.id, countryId: country.id,
    date, people, orderId, status: 'pending',
  });
  saveCart();
  closeExc();
  redirectToPayment(fields);
}

// Build the query string manually so spaces are %20 (not +) and params
// stay in the exact order the payment gateway documents.
function buildPaymentQuery(fields) {
  return PAYMENT_PARAM_ORDER
    .filter(k => fields[k] != null && fields[k] !== '')
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(fields[k])}`)
    .join('&');
}

function redirectToPayment(fields) {
  const url = PAYMENT_BASE + '?' + buildPaymentQuery(fields);
  // Direct top-frame assignment — instant on the hosted site.
  try {
    window.top.location.href = url;
    return;
  } catch (_) {
    // Cross-origin/sandbox — assignment threw. Fall through to form submit.
  }
  // Form submit with target=_top — accepted by sandboxed preview iframes
  // that carry allow-top-navigation-by-user-activation.
  const f = document.createElement('form');
  f.method = 'GET';
  f.action = PAYMENT_BASE;
  f.target = '_top';
  for (const [k, v] of Object.entries(fields)) {
    const inp = document.createElement('input');
    inp.type = 'hidden'; inp.name = k; inp.value = v;
    f.appendChild(inp);
  }
  document.body.appendChild(f);
  f.submit();
}

function renderExc() {
  if (!currentExcCtx) return;
  const ctx = currentExcCtx;
  const { country, city, exc, reviews, showAllReviews, step, date, people, form, errors } = ctx;
  const total = exc.price * people;
  const shown = showAllReviews ? reviews : reviews.slice(0, 2);
  const stepper = `
    <div class="wiz-steps">
      ${['step_date', 'step_people', 'step_details', 'step_confirm'].map((k, i) => `
        <div class="wiz-step ${step >= i ? 'active' : ''} ${step > i ? 'done' : ''}">
          <span class="wiz-step-num">${step > i ? '✓' : i + 1}</span>
          <span class="wiz-step-label">${t(k)}</span>
        </div>${i < 3 ? '<div class="wiz-connector"></div>' : ''}`).join('')}
    </div>`;

  let stepBody = '';
  if (step === 0) {
    stepBody = `
      <div class="wiz-body">
        <label class="wiz-label">${t('select_date')}</label>
        <input type="date" class="wiz-input wiz-date" value="${date}" min="${tomorrowISO()}" onchange="excSetDate(this.value)">
        <p class="wiz-hint">${t('step_of', { i: 1, n: 4 })}</p>
      </div>
      <div class="wiz-actions">
        <button class="btn btn-ghost" onclick="closeExc()">${t('close')}</button>
        <button class="btn btn-primary" onclick="excGoStep(1)" ${!date ? 'disabled' : ''}>${t('next')} →</button>
      </div>`;
  } else if (step === 1) {
    stepBody = `
      <div class="wiz-body">
        <label class="wiz-label">${t('people')}</label>
        <div class="stepper wiz-stepper">
          <button onclick="excSetPeople(-1)" ${people <= 1 ? 'disabled' : ''}>−</button>
          <span class="stepper-value">${people}</span>
          <button onclick="excSetPeople(1)" ${people >= 20 ? 'disabled' : ''}>+</button>
        </div>
        <div class="wiz-price-row">
          <span>${t('total')}</span>
          <div class="price">€${total}<small>${people}× €${exc.price}</small></div>
        </div>
        <p class="wiz-hint">${t('step_of', { i: 2, n: 4 })}</p>
      </div>
      <div class="wiz-actions">
        <button class="btn btn-ghost" onclick="excGoStep(0)">← ${t('back')}</button>
        <button class="btn btn-primary" onclick="excGoStep(2)">${t('next')} →</button>
      </div>`;
  } else if (step === 2) {
    const err = (k) => errors[k] ? `<div class="wiz-err">${t(errors[k] === 'email' ? 'field_email_invalid' : errors[k] === 'phone' ? 'field_phone_invalid' : 'field_required')}</div>` : '';
    const inp = (k, type = 'text', autocomplete = k) => `
      <label class="wiz-field">
        <span class="wiz-label">${t('form_' + k)}</span>
        <input type="${type}" autocomplete="${autocomplete}" class="wiz-input ${errors[toCamel(k)] ? 'has-err' : ''}"
          value="${escapeHTML(form[toCamel(k)])}"
          oninput="excSetField('${toCamel(k)}', this.value)">
        ${err(toCamel(k))}
      </label>`;
    stepBody = `
      <div class="wiz-body">
        <div class="wiz-grid">
          ${inp('first_name', 'text', 'given-name')}
          ${inp('last_name', 'text', 'family-name')}
          ${inp('email', 'email', 'email')}
          ${inp('phone', 'tel', 'tel')}
          <div class="wiz-grid-full">${inp('address', 'text', 'street-address')}</div>
          ${inp('city', 'text', 'address-level2')}
          ${inp('postcode', 'text', 'postal-code')}
          <div class="wiz-grid-full">${inp('country', 'text', 'country-name')}</div>
        </div>
        <p class="wiz-hint">${t('step_of', { i: 3, n: 4 })}</p>
      </div>
      <div class="wiz-actions">
        <button class="btn btn-ghost" onclick="excGoStep(1)">← ${t('back')}</button>
        <button class="btn btn-primary" onclick="excGoStep(3)">${t('next')} →</button>
      </div>`;
  } else if (step === 3) {
    stepBody = `
      <div class="wiz-body">
        <h4 class="wiz-sum-h">${t('summary_heading')}</h4>
        <div class="wiz-sum">
          <div class="wiz-sum-row"><span>${exc.name}</span><span>€${exc.price} × ${people}</span></div>
          <div class="wiz-sum-row"><span>${t('cart_date')}</span><span>${formatDate(date)}</span></div>
          <div class="wiz-sum-row"><span>${localCity(city.name)}, ${localCountry(country.id)}</span><span>${exc.duration}</span></div>
          <div class="wiz-sum-row wiz-sum-total"><span>${t('total')}</span><span class="price">€${total}</span></div>
        </div>
        <div class="wiz-sum-contact">
          <strong>${form.firstName} ${form.lastName}</strong><br>
          <small>${form.email} · ${form.phone}</small><br>
          <small>${form.address}, ${form.postcode} ${form.city}, ${form.country}</small>
        </div>
        <p class="wiz-hint">${t('step_of', { i: 4, n: 4 })}</p>
      </div>
      <div class="wiz-actions">
        <button class="btn btn-ghost" onclick="excGoStep(2)">← ${t('back')}</button>
        <button class="btn btn-primary btn-cta" onclick="excCheckout()">${t('to_checkout')} →</button>
      </div>`;
  }

  excBody.innerHTML = `
    <div class="exc-hero">${svgPostcard(exc.name, localCity(city.name), exc.id)}<span class="exc-hero-badge">${exc.duration}</span></div>
    <div class="exc-content">
      <div class="exc-meta">
        <span class="rating">${exc.rating.toFixed(1)}</span><span>·</span>
        <span>${exc.reviews} ${t('reviews')}</span><span>·</span>
        <span>${country.flag} ${localCity(city.name)}, ${localCountry(country.id)}</span>
      </div>
      <h2 class="exc-title">${exc.name}</h2>
      <div class="exc-section"><h4>${t('description')}</h4><p>${exc.description}</p></div>
      <div class="booking-card wizard-card">
        ${stepper}
        ${stepBody}
      </div>
      <div class="exc-section">
        <h4>${t('reviews_heading')}</h4>
        <div class="reviews">
          ${shown.map(r => `
            <div class="review">
              <div class="review-avatar">${initials(r.name)}</div>
              <div class="review-body">
                <div class="review-head"><span class="review-name">${r.name}</span><span class="review-date">${r.date}</span></div>
                <div class="review-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
                <p class="review-text">${r.text}</p>
              </div>
            </div>`).join('')}
        </div>
        ${reviews.length > 2 ? `<button class="reviews-toggle" onclick="excToggleReviews()">${showAllReviews ? t('hide_reviews') : t('all_reviews', { n: reviews.length })}</button>` : ''}
      </div>
    </div>`;
}
function toCamel(s) { return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase()); }

// ---------- Cart ----------
function renderCart() {
  const h = cartModal.querySelector('.modal-header h3');
  if (h) h.textContent = t('your_cart');
  if (cart.length === 0) {
    cartBody.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">🧳</div><p>${t('empty_cart')}</p></div>`;
    return;
  }
  const items = cart.map(({ excursionId, cityId, countryId, date, people, orderId, status }) => {
    const country = DATA.countries.find(c => c.id === countryId);
    const city = country?.cities.find(x => x.id === cityId);
    const exc = city?.excursions.find(e => e.id === excursionId);
    return { country, city, exc, date, people: people || 1, orderId, status };
  }).filter(x => x.exc);
  const total = items.reduce((s, i) => s + i.exc.price * i.people, 0);
  cartBody.innerHTML = `
    ${items.map(({ country, city, exc, date, people, orderId, status }) => `
      <div class="cart-item">
        <div class="cart-item-img">${svgPostcard(exc.name, localCity(city.name), exc.id)}</div>
        <div class="cart-item-body">
          <h5>${exc.name}</h5>
          <small>${country.flag} ${localCity(city.name)} · ${exc.duration}</small>
          <div class="cart-item-details">
            ${date ? `<span>📅 ${formatDate(date)}</span>` : ''}
            <span>👤 ${people} ${t('cart_people')}</span>
            ${orderId ? `<span title="${orderId}">#${orderId.slice(-6)}</span>` : ''}
          </div>
          <div class="cart-item-price">€${exc.price * people} <small>(${people}× €${exc.price})</small></div>
        </div>
        <button class="cart-remove" onclick="removeFromCart('${exc.id}')" title="${t('remove')}">×</button>
      </div>`).join('')}
    <div class="cart-total"><span style="font-weight:600;">${t('total')}:</span><div class="price">€${total}</div></div>
    <button class="checkout-btn" onclick="toast(t('demo_checkout')); closeCart();">${t('checkout')}</button>`;
}
function formatDate(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString(LOCALE_TAG[currentLang] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch (_) { return iso; }
}

// ---------- Legal pages ----------
function renderPrivacy() {
  setActiveNav(null);
  app.innerHTML = `
    <div class="container">
      <div class="crumbs"><a href="#/">${t('nav_home')}</a> / <span>${t('privacy_title')}</span></div>
      <article class="doc">
        <h1>${t('privacy_title')}</h1>
        <p class="doc-meta">Effective date: ${COMPANY.effectiveDate} · Last updated: ${COMPANY.effectiveDate}</p>

        <h2>1. Who we are</h2>
        <p>This Privacy Policy explains how <strong>${COMPANY.name}</strong> ("we", "us", "our") collects, uses and protects personal data of visitors and customers of the website <strong>voyage-europa.eu</strong>. We are the data controller for the purposes of the General Data Protection Regulation (EU) 2016/679 (GDPR).</p>
        <p><strong>Registered office:</strong> ${COMPANY.address}<br>
          <strong>Registration number:</strong> ${COMPANY.regNo}<br>
          <strong>VAT:</strong> ${COMPANY.vat}<br>
          <strong>Data Protection contact:</strong> <a href="mailto:${COMPANY.dpo}">${COMPANY.dpo}</a></p>

        <h2>2. Personal data we collect</h2>
        <ul>
          <li><strong>Booking data</strong> — first name, last name, email, phone number, billing address, city, postal code, country, tour selection, date, number of travellers.</li>
          <li><strong>Payment data</strong> — processed directly by our payment provider; we do not store card numbers on our servers.</li>
          <li><strong>Usage data</strong> — IP address (truncated), browser and device type, pages visited, referrer, timestamps.</li>
          <li><strong>Cookies and local storage</strong> — language preference, cart contents and consent status.</li>
          <li><strong>Communications</strong> — the content of any message you send us via forms or email.</li>
        </ul>

        <h2>3. Purposes and legal bases</h2>
        <ul>
          <li><strong>To process your booking and payment</strong> — Article 6(1)(b) GDPR (performance of a contract).</li>
          <li><strong>To communicate with you about your booking</strong> — Article 6(1)(b) GDPR.</li>
          <li><strong>To comply with tax, accounting and consumer-law obligations</strong> — Article 6(1)(c) GDPR.</li>
          <li><strong>To ensure website security and prevent fraud</strong> — Article 6(1)(f) GDPR (legitimate interest).</li>
          <li><strong>To improve the website through analytics</strong> — Article 6(1)(a) GDPR (your consent via the cookie banner).</li>
          <li><strong>To send marketing messages</strong> — Article 6(1)(a) GDPR (your explicit consent, which you can withdraw at any time).</li>
        </ul>

        <h2>4. Cookies and similar technologies</h2>
        <p>We use two categories of cookies:</p>
        <ul>
          <li><strong>Strictly necessary cookies</strong> — required for the cart, language switcher and security. They cannot be disabled.</li>
          <li><strong>Analytics and marketing cookies</strong> — set only if you click "Accept all" in the cookie banner. You can withdraw consent at any time by clearing your browser storage for this site.</li>
        </ul>

        <h2>5. Sharing your data</h2>
        <p>We share personal data only with the following categories of recipients, acting as our processors under a data-processing agreement:</p>
        <ul>
          <li>Payment service providers to process card payments.</li>
          <li>Local tour operators and guides — strictly the minimum necessary to deliver the booked tour (name and party size).</li>
          <li>Cloud hosting and email delivery providers located in the EU/EEA.</li>
          <li>Public authorities where required by law.</li>
        </ul>
        <p>We do not sell personal data. Any transfer outside the EU/EEA is protected by Standard Contractual Clauses approved by the European Commission.</p>

        <h2>6. Retention</h2>
        <p>Booking and invoicing data are retained for 7 years to meet EU accounting obligations. Marketing consent records are kept for the duration of the consent plus 3 years. Anonymised analytics are retained for up to 24 months.</p>

        <h2>7. Your rights under the GDPR</h2>
        <p>You have the right to: access, rectify, erase, restrict or object to processing, receive your data in a portable format, and withdraw consent at any time. To exercise any of these rights, contact <a href="mailto:${COMPANY.dpo}">${COMPANY.dpo}</a>. You may also lodge a complaint with your local data-protection authority.</p>

        <h2>8. Children</h2>
        <p>Our service is not directed at children under 16. We do not knowingly collect personal data from minors. If you believe a minor has provided us with personal data, please contact us and we will delete it.</p>

        <h2>9. Security</h2>
        <p>We use TLS encryption in transit, encrypted storage at rest, access controls and regular security reviews. Despite reasonable technical and organisational measures, no method of transmission over the Internet is 100% secure.</p>

        <h2>10. Changes to this policy</h2>
        <p>We may update this Privacy Policy from time to time. Material changes will be communicated by a prominent notice on this page. The "Last updated" date at the top will reflect any changes.</p>

        <h2>11. Contact</h2>
        <p>For any privacy question, write to <a href="mailto:${COMPANY.dpo}">${COMPANY.dpo}</a> or to the postal address above.</p>
      </article>
    </div>`;
}

function renderContacts() {
  setActiveNav(null);
  app.innerHTML = `
    <div class="container">
      <div class="crumbs"><a href="#/">${t('nav_home')}</a> / <span>${t('contacts_title')}</span></div>
      <article class="doc">
        <h1>${t('contacts_title')}</h1>
        <p class="doc-lead">${t('contact_intro')}</p>
        <div class="contact-grid">
          <div class="contact-card">
            <h3>${t('company_info')}</h3>
            <p><strong>${COMPANY.name}</strong><br>
              ${COMPANY.address}<br>
              ${t('reg_no')}: ${COMPANY.regNo}<br>
              ${t('vat')}: ${COMPANY.vat}</p>
            <p>📧 <a href="mailto:${COMPANY.email}">${COMPANY.email}</a><br>
              📞 <a href="tel:${COMPANY.phone.replace(/\s/g, '')}">${COMPANY.phone}</a></p>
            <h4>${t('business_hours')}</h4>
            <p>${t('hours_value')}</p>
          </div>

          <div class="contact-card">
            <h3>${t('contact_form_heading')}</h3>
            <form id="contact-form" onsubmit="submitContact(event)">
              <label class="wiz-field"><span class="wiz-label">${t('form_first_name')}</span>
                <input required name="first_name" class="wiz-input" autocomplete="given-name"></label>
              <label class="wiz-field"><span class="wiz-label">${t('form_email')}</span>
                <input required type="email" name="email" class="wiz-input" autocomplete="email"></label>
              <label class="wiz-field"><span class="wiz-label">${t('contact_form_subject')}</span>
                <input required name="subject" class="wiz-input"></label>
              <label class="wiz-field"><span class="wiz-label">${t('contact_form_message')}</span>
                <textarea required name="message" rows="5" class="wiz-input wiz-textarea"></textarea></label>
              <button type="submit" class="btn btn-primary btn-block">${t('contact_form_send')}</button>
            </form>
          </div>
        </div>
      </article>
    </div>`;
}

function submitContact(e) {
  e.preventDefault();
  e.target.reset();
  toast(t('contact_sent'));
}

function renderTerms() {
  setActiveNav(null);
  app.innerHTML = `
    <div class="container">
      <div class="crumbs"><a href="#/">${t('nav_home')}</a> / <span>${t('f_terms')}</span></div>
      <article class="doc">
        <h1>${t('f_terms')}</h1>
        <p class="doc-meta">Effective date: ${COMPANY.effectiveDate}</p>
        <h2>1. Booking and confirmation</h2>
        <p>Your booking is confirmed once payment is successfully processed. You will receive an email confirmation with tour details and meeting-point instructions.</p>
        <h2>2. Cancellation and refund</h2>
        <p>Free cancellation up to 24 hours before the start of the tour, refunded to the original payment method within 5-10 business days. Cancellations within 24 hours are non-refundable.</p>
        <h2>3. Changes</h2>
        <p>Tour operators may make minor changes to itineraries due to weather, safety or availability. Material changes give you the right to a full refund.</p>
        <h2>4. Liability</h2>
        <p>Voyage Europa acts as an intermediary between you and independent tour operators. Their terms and insurance apply to the delivery of the tour.</p>
        <h2>5. Contact</h2>
        <p>Questions? Email <a href="mailto:${COMPANY.supportEmail}">${COMPANY.supportEmail}</a>.</p>
      </article>
    </div>`;
}

function renderOrderStatus(status) {
  setActiveNav(null);
  const success = status === 'success';
  app.innerHTML = `
    <div class="container">
      <div class="doc doc-center">
        <div class="order-icon ${success ? 'ok' : 'fail'}">${success ? '✓' : '×'}</div>
        <h1>${success ? 'Payment successful' : 'Payment failed'}</h1>
        <p>${success
          ? 'Thank you — your booking is confirmed. A confirmation email is on its way.'
          : 'Something went wrong. Your card has not been charged. Please try again or contact support.'}</p>
        <p><a class="btn btn-primary" href="#/">← ${t('nav_home')}</a></p>
      </div>
    </div>`;
}

// Expose
Object.assign(window, {
  removeFromCart, openCart, closeCart, openExc, closeExc,
  excSetDate, excSetPeople, excSetField, excToggleReviews, excGoStep, excCheckout,
  setLang, toggleLangMenu, setCookieConsent, closeCookieAndGo,
  submitContact, t, toast,
});
