// ============================================================
//  Voyage Europa — SPA logic (v2)
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

// ---------- i18n ----------
let currentLang = localStorage.getItem('ve_lang') || 'ru';
if (!I18N[currentLang]) currentLang = 'ru';

const t = (key, vars) => {
  const dict = I18N[currentLang] || I18N.ru;
  const path = key.split('.');
  let v = dict;
  for (const p of path) v = v ? v[p] : undefined;
  if (v == null) v = I18N.ru;
  for (const p of path) if (v && typeof v === 'object') v = v[p];
  if (v == null) return key;
  if (vars) for (const k in vars) v = v.replace('{' + k + '}', vars[k]);
  return v;
};

const localCity = (name) => currentLang === 'ru' ? name : (CITY_LATIN[name] || name);
const localCountry = (id) => t('countries.' + id);

// ---------- Cart state ----------
const CART_KEY = 've_cart_v2';
let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');

const saveCart = () => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  cartCountEl.textContent = cart.length;
};
saveCart();

const addToCart = (excursionId, cityId, countryId, date, people) => {
  if (cart.find(i => i.excursionId === excursionId)) {
    toast(t('already_in_cart'));
    return;
  }
  cart.push({ excursionId, cityId, countryId, date, people: people || 1 });
  saveCart();
  toast(t('added'));
};

const removeFromCart = (excursionId) => {
  cart = cart.filter(i => i.excursionId !== excursionId);
  saveCart();
  renderCart();
};

const openCart = () => { renderCart(); cartModal.classList.add('active'); };
const closeCart = () => cartModal.classList.remove('active');
cartModal.addEventListener('click', (e) => { if (e.target === cartModal) closeCart(); });
excModal.addEventListener('click', (e) => { if (e.target === excModal) closeExc(); });

const toast = (msg) => {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toastEl.classList.remove('show'), 2200);
};

// ---------- Image generator (SVG postcards) ----------
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
  cathedral: '⛪', palace: '🏰', river: '🚤', old: '🏘️', bus: '🚌',
  default: '📍'
};

const hash = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const iconFor = (name) => {
  const s = (name || '').toLowerCase();
  const map = [
    ['собор|базилик|церк|монастыр|храм|капелл', 'cathedral'],
    ['замок|крепост|дворец|цитадел', 'castle'],
    ['музе|галере|эрмитаж|лувр', 'museum'],
    ['парк|сад|ботан|альгамбра', 'garden'],
    ['вин|дегустац|винодел', 'wine'],
    ['еда|кухн|гастроном|ужин|обед|тапас|паст|пиво|бир', 'food'],
    ['лодк|корабл|круиз|яхт', 'boat'],
    ['велосипед|байк', 'bike'],
    ['трамва|поезд|фуникул', 'tram'],
    ['ноч|вечер|огн|бар', 'night'],
    ['гор|альп|пик|верш|скал', 'mountain'],
    ['пляж|мор|остров', 'beach'],
    ['мост|виадук', 'bridge'],
    ['башн|тауэр|минарет|эйф', 'tower'],
    ['театр|опер|филарм', 'theater'],
    ['площад|плаза', 'square'],
    ['шопинг|магазин|рынок|базар', 'shop'],
    ['спа|терм|ванн|курорт', 'spa'],
    ['река|канал', 'river'],
    ['стар|истор|квартал|прогулк', 'old'],
    ['автобус|экскурс|обзор', 'bus'],
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
      const x = i * 55;
      const barH = 60 + ((h >> i) % 100);
      const w = 40 + ((h >> (i + 3)) % 15);
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
    <defs>
      <linearGradient id="g${h}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${c1}"/>
        <stop offset="1" stop-color="${c2}"/>
      </linearGradient>
    </defs>
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
    <defs>
      <linearGradient id="gh${country.id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${c1}"/>
        <stop offset="0.6" stop-color="${c2}"/>
        <stop offset="1" stop-color="${c3}"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="400" fill="url(#gh${country.id})"/>
    <circle cx="1000" cy="90" r="70" fill="#fff" opacity="0.25"/>
    <path d="M0,340 L150,240 L280,300 L440,180 L600,290 L780,220 L920,300 L1080,240 L1200,320 L1200,400 L0,400 Z" fill="${c3}" opacity="0.6"/>
    <path d="M0,360 L200,290 L380,340 L560,270 L740,350 L920,300 L1200,380 L1200,400 L0,400 Z" fill="${c3}" opacity="0.9"/>
  </svg>`;
};

const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

// ---------- Reviews generator ----------
const REVIEW_NAMES = [
  'Анна', 'Михаил', 'Елена', 'Дмитрий', 'Ольга', 'Сергей', 'Наталья', 'Андрей',
  'Ирина', 'Александр', 'Мария', 'Владимир', 'Татьяна', 'Николай', 'Юлия', 'Павел',
  'Екатерина', 'Артём', 'Валентина', 'Иван', 'Светлана', 'Роман', 'Ксения', 'Максим'
];
const REVIEW_TEMPLATES = [
  'Отличная экскурсия! Гид {guide} рассказал массу интересных фактов, время пролетело незаметно. Однозначно рекомендую.',
  'Всё прошло на высшем уровне. {guide} — настоящий профессионал, отвечал на все вопросы и подстроился под нашу группу.',
  'Прекрасное соотношение цены и качества. За {price}€ получили полноценную программу, а не поверхностную обзорку.',
  'Забронировали накануне, всё чётко: подтверждение пришло сразу, гид встретил у отеля вовремя. Спасибо!',
  'Впечатления только положительные. Особенно понравилось, что группа была небольшая — все всё видели и слышали.',
  'Экскурсия оправдала все ожидания. Много исторических деталей, но подано живо, а не как в учебнике.',
  'Брали для семьи с детьми — маршрут был адаптирован, никто не устал. Огромное спасибо {guide}!',
  'Уже вторая наша экскурсия с Voyage Europa и снова всё безупречно. Возвращаемся сюда снова.',
  'Единственный минус — очень не хотелось, чтобы это заканчивалось. Три часа как один миг.',
  'Гид говорит на прекрасном русском, юмор в тему, знает местные секретные места. Топ.',
  'Именно то, что было в описании — без сюрпризов и разочарований. Всё чётко.',
  'Отдельное спасибо за фотографии, которые {guide} сделал для нас в конце тура. Осталось на память.',
];
const GUIDES = ['Мария', 'Хосе', 'Джулия', 'Стефан', 'Марта', 'Пётр', 'Анна', 'Никола'];

const buildReviews = (exc) => {
  const count = 3 + (hash(exc.id + '-cnt') % 3); // 3-5
  const out = [];
  const usedTpl = new Set();
  const usedName = new Set();
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
    const date = d.toLocaleDateString(LOCALE_TAG[currentLang] || 'ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    out.push({ name: REVIEW_NAMES[nameI], text, stars, date });
  }
  return out;
};

const initials = (name) => {
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
};

// ---------- Router ----------
window.addEventListener('hashchange', render);
window.addEventListener('load', () => {
  buildHeader();
  buildFooter();
  render();
});

const parseRoute = () => {
  const h = (location.hash || '#/').slice(2);
  const parts = h.split('/').filter(Boolean).map(decodeURIComponent);
  return parts;
};

const setActiveNav = (countryId) => {
  nav.querySelectorAll('a').forEach(a => {
    a.classList.toggle('active', a.dataset.country === countryId);
  });
};

function buildHeader() {
  document.getElementById('logo-sub').textContent = t('logo_sub');
  document.getElementById('cart-label').textContent = t('cart');

  nav.innerHTML = DATA.countries.map(c =>
    `<a href="#/country/${c.id}" data-country="${c.id}">${localCountry(c.id)}</a>`
  ).join('');

  // Lang switcher
  const cur = LANG_LIST.find(l => l.code === currentLang);
  const langSwitch = document.getElementById('lang-switch');
  langSwitch.innerHTML = `
    <button class="lang-btn" onclick="toggleLangMenu()">
      <span>${cur.flag}</span>
      <span class="lang-code">${currentLang.toUpperCase()}</span>
      <span class="lang-caret">▾</span>
    </button>
    <div class="lang-menu" id="lang-menu">
      ${LANG_LIST.map(l => `
        <button class="lang-opt ${l.code === currentLang ? 'active' : ''}" onclick="setLang('${l.code}')">
          <span>${l.flag}</span>
          <span>${I18N[l.code].lang_name}</span>
        </button>
      `).join('')}
    </div>
  `;
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
    <li><a href="#/blog">${t('f_blog')}</a></li>
  `;
  document.getElementById('footer-links-sup').innerHTML = `
    <li><a href="#/faq">${t('f_faq')}</a></li>
    <li><a href="#/terms">${t('f_terms')}</a></li>
    <li><a href="#/privacy">${t('f_privacy')}</a></li>
    <li><a href="mailto:hello@voyage-europa.eu">hello@voyage-europa.eu</a></li>
  `;
  footerCountries.innerHTML = DATA.countries.map(c =>
    `<li><a href="#/country/${c.id}">${c.flag} ${localCountry(c.id)}</a></li>`
  ).join('');
}

function toggleLangMenu() {
  document.getElementById('lang-menu').classList.toggle('open');
}

function setLang(code) {
  if (!I18N[code]) return;
  currentLang = code;
  localStorage.setItem('ve_lang', code);
  document.documentElement.lang = code;
  buildHeader();
  buildFooter();
  render();
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
    const country = DATA.countries.find(c => c.id === args[0]);
    if (country) return renderCountry(country);
  }
  if (route === 'city' && args[0] && args[1]) {
    const country = DATA.countries.find(c => c.id === args[0]);
    const city = country?.cities.find(x => x.id === args[1]);
    if (country && city) return renderCity(country, city);
  }
  if (route === 'search') return renderSearch(args[0] || '');
  renderHome();
}

// ---------- Views ----------
function renderHome() {
  setActiveNav(null);
  const totalExc = DATA.countries.reduce((n, c) =>
    n + c.cities.reduce((s, ci) => s + ci.excursions.length, 0), 0);
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
        <div class="section-head">
          <div>
            <span class="eyebrow">${t('directions_eye')}</span>
            <h2>${t('directions_t')}</h2>
            <p>${t('directions_d')}</p>
          </div>
        </div>
        <div class="country-grid">
          ${DATA.countries.map(c => `
            <div class="country-card" onclick="location.hash='#/country/${c.id}'">
              <div class="card-bg">${svgCountryHero(c)}</div>
              <div class="card-overlay"></div>
              <div class="card-content">
                <div class="flag">${c.flag}</div>
                <h3>${localCountry(c.id)}</h3>
                <div class="card-meta">
                  <span>${t('n_cities', { n: c.cities.length })}</span>
                  <span>·</span>
                  <span>${t('n_excursions', { n: c.cities.reduce((s, ci) => s + ci.excursions.length, 0) })}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section class="section" style="background:var(--color-surface-alt);">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">${t('why_eye')}</span>
            <h2>${t('why_t')}</h2>
          </div>
        </div>
        <div class="features">
          ${[1, 2, 3, 4].map(i => `
            <div class="feature">
              <div class="feature-icon">${['✓', '↺', '☎', '€'][i - 1]}</div>
              <h4>${t('feat' + i + '_t')}</h4>
              <p>${t('feat' + i + '_d')}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderCountry(country) {
  setActiveNav(country.id);
  app.innerHTML = `
    <div class="container">
      <div class="crumbs">
        <a href="#/">${t('nav_home')}</a> / <span>${localCountry(country.id)}</span>
      </div>
      <div class="page-hero">
        <div class="card-bg">${svgCountryHero(country)}</div>
        <div class="card-overlay"></div>
        <div class="content">
          <div class="flag">${country.flag}</div>
          <h1>${localCountry(country.id)}</h1>
          <p>${country.description}</p>
        </div>
      </div>
    </div>

    <section class="section" style="padding-top:20px;">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">${t('cities_eye')}</span>
            <h2>${t('cities_t')}</h2>
            <p>${t('n_cities', { n: country.cities.length })} · ${t('n_excursions', { n: country.cities.reduce((s, c) => s + c.excursions.length, 0) })}</p>
          </div>
        </div>
        <div class="city-grid">
          ${country.cities.map(city => `
            <div class="city-card" onclick="location.hash='#/city/${country.id}/${city.id}'">
              <div class="card-bg">${svgPostcard(city.name, localCity(city.name), city.id + country.id)}</div>
              <div class="card-overlay"></div>
              <div class="card-content">
                <h4>${localCity(city.name)}</h4>
                <div class="card-meta">${t('n_excursions', { n: city.excursions.length })} · ${t('from_price', { p: Math.min(...city.excursions.map(e => e.price)) })}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
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
        <div class="content">
          <h1>${localCity(city.name)}</h1>
          <p>${city.description}</p>
        </div>
      </div>
    </div>

    <section class="section" style="padding-top:20px;">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">${t('excursions_eye')}</span>
            <h2>${t('n_routes', { n: city.excursions.length })}</h2>
            <p>${t('routes_sub')}</p>
          </div>
        </div>
        <div class="excursion-grid">
          ${city.excursions.map(e => `
            <article class="excursion-card" onclick="openExc('${country.id}','${city.id}','${e.id}')">
              <div class="card-img">
                ${svgPostcard(e.name, localCity(city.name), e.id)}
                <span class="badge">${e.duration}</span>
              </div>
              <div class="card-body">
                <div class="card-meta">
                  <span class="rating">${e.rating.toFixed(1)}</span>
                  <span>·</span>
                  <span>${e.reviews} ${t('reviews')}</span>
                </div>
                <h4>${e.name}</h4>
                <p class="card-desc">${e.description}</p>
                <div class="card-footer">
                  <div class="price">€${e.price}<small>${t('per_person')}</small></div>
                  <button class="book-btn ${inCart(e.id) ? 'in-cart' : ''}"
                    onclick="event.stopPropagation(); openExc('${country.id}','${city.id}','${e.id}')">
                    ${inCart(e.id) ? t('in_cart') : t('book')}
                  </button>
                </div>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderSearch(query) {
  setActiveNav(null);
  const q = query.toLowerCase().trim();
  const results = [];
  DATA.countries.forEach(country => {
    country.cities.forEach(city => {
      city.excursions.forEach(exc => {
        const hay = `${country.name} ${localCountry(country.id)} ${city.name} ${localCity(city.name)} ${exc.name} ${exc.description}`.toLowerCase();
        if (!q || hay.includes(q)) {
          results.push({ country, city, exc });
        }
      });
    });
  });

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
        ${results.length === 0 ? `
          <div class="no-results">${t('no_results')}</div>
        ` : `
          <div class="excursion-grid">
            ${results.slice(0, 60).map(({ country, city, exc }) => `
              <article class="excursion-card" onclick="openExc('${country.id}','${city.id}','${exc.id}')">
                <div class="card-img">
                  ${svgPostcard(exc.name, localCity(city.name), exc.id)}
                  <span class="badge">${exc.duration}</span>
                </div>
                <div class="card-body">
                  <div class="card-meta">
                    <span class="rating">${exc.rating.toFixed(1)}</span>
                    <span>·</span>
                    <span>${country.flag} ${localCity(city.name)}</span>
                  </div>
                  <h4>${exc.name}</h4>
                  <p class="card-desc">${exc.description}</p>
                  <div class="card-footer">
                    <div class="price">€${exc.price}<small>${t('per_person')}</small></div>
                    <button class="book-btn" onclick="event.stopPropagation(); openExc('${country.id}','${city.id}','${exc.id}')">${t('book')}</button>
                  </div>
                </div>
              </article>
            `).join('')}
          </div>
        `}
      </div>
    </section>
  `;
}

// ---------- Excursion detail modal ----------
let currentExcCtx = null;
let showAllReviews = false;

function openExc(countryId, cityId, excursionId) {
  const country = DATA.countries.find(c => c.id === countryId);
  const city = country?.cities.find(x => x.id === cityId);
  const exc = city?.excursions.find(e => e.id === excursionId);
  if (!exc) return;
  currentExcCtx = { country, city, exc, reviews: buildReviews(exc), date: tomorrowISO(), people: 1 };
  showAllReviews = false;
  renderExc();
  excModal.classList.add('active');
}

function closeExc() {
  excModal.classList.remove('active');
  currentExcCtx = null;
}

function tomorrowISO() {
  const d = new Date(Date.now() + 86400000);
  return d.toISOString().slice(0, 10);
}

function setExcDate(v) { if (currentExcCtx) { currentExcCtx.date = v; renderExc(); } }
function setExcPeople(delta) {
  if (!currentExcCtx) return;
  currentExcCtx.people = Math.max(1, Math.min(20, currentExcCtx.people + delta));
  renderExc();
}
function toggleAllReviews() { showAllReviews = !showAllReviews; renderExc(); }

function bookExc() {
  if (!currentExcCtx) return;
  const { exc, city, country, date, people } = currentExcCtx;
  addToCart(exc.id, city.id, country.id, date, people);
  closeExc();
}

function renderExc() {
  if (!currentExcCtx) return;
  const { country, city, exc, reviews, date, people } = currentExcCtx;
  const total = exc.price * people;
  const inCart = cart.find(i => i.excursionId === exc.id);
  const shown = showAllReviews ? reviews : reviews.slice(0, 2);
  excBody.innerHTML = `
    <div class="exc-hero">
      ${svgPostcard(exc.name, localCity(city.name), exc.id)}
      <span class="exc-hero-badge">${exc.duration}</span>
    </div>
    <div class="exc-content">
      <div class="exc-meta">
        <span class="rating">${exc.rating.toFixed(1)}</span>
        <span>·</span>
        <span>${exc.reviews} ${t('reviews')}</span>
        <span>·</span>
        <span>${country.flag} ${localCity(city.name)}, ${localCountry(country.id)}</span>
      </div>
      <h2 class="exc-title">${exc.name}</h2>

      <div class="exc-section">
        <h4>${t('description')}</h4>
        <p>${exc.description}</p>
      </div>

      <div class="booking-card">
        <div class="booking-row">
          <label for="exc-date">${t('select_date')}</label>
          <input type="date" id="exc-date" value="${date}" min="${tomorrowISO()}" onchange="setExcDate(this.value)">
        </div>
        <div class="booking-row">
          <label>${t('people')}</label>
          <div class="stepper">
            <button onclick="setExcPeople(-1)" ${people <= 1 ? 'disabled' : ''}>−</button>
            <span class="stepper-value">${people}</span>
            <button onclick="setExcPeople(1)" ${people >= 20 ? 'disabled' : ''}>+</button>
          </div>
        </div>
        <div class="booking-total">
          <span>${t('total')}</span>
          <div class="price">€${total}<small>${people}× €${exc.price}</small></div>
        </div>
        <button class="book-cta ${inCart ? 'in-cart' : ''}" onclick="bookExc()" ${inCart ? 'disabled' : ''}>
          ${inCart ? '✓ ' + t('in_cart') : t('add_to_cart')}
        </button>
      </div>

      <div class="exc-section">
        <h4>${t('reviews_heading')}</h4>
        <div class="reviews">
          ${shown.map(r => `
            <div class="review">
              <div class="review-avatar">${initials(r.name)}</div>
              <div class="review-body">
                <div class="review-head">
                  <span class="review-name">${r.name}</span>
                  <span class="review-date">${r.date}</span>
                </div>
                <div class="review-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
                <p class="review-text">${r.text}</p>
              </div>
            </div>
          `).join('')}
        </div>
        ${reviews.length > 2 ? `
          <button class="reviews-toggle" onclick="toggleAllReviews()">
            ${showAllReviews ? t('hide_reviews') : t('all_reviews', { n: reviews.length })}
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

// ---------- Cart ----------
function renderCart() {
  const cartTitle = cartModal.querySelector('.modal-header h3');
  if (cartTitle) cartTitle.textContent = t('your_cart');
  if (cart.length === 0) {
    cartBody.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🧳</div>
        <p>${t('empty_cart')}</p>
      </div>
    `;
    return;
  }
  const items = cart.map(({ excursionId, cityId, countryId, date, people }) => {
    const country = DATA.countries.find(c => c.id === countryId);
    const city = country?.cities.find(x => x.id === cityId);
    const exc = city?.excursions.find(e => e.id === excursionId);
    return { country, city, exc, date, people: people || 1 };
  }).filter(x => x.exc);

  const total = items.reduce((s, i) => s + i.exc.price * i.people, 0);
  cartBody.innerHTML = `
    ${items.map(({ country, city, exc, date, people }) => `
      <div class="cart-item">
        <div class="cart-item-img">${svgPostcard(exc.name, localCity(city.name), exc.id)}</div>
        <div class="cart-item-body">
          <h5>${exc.name}</h5>
          <small>${country.flag} ${localCity(city.name)} · ${exc.duration}</small>
          <div class="cart-item-details">
            ${date ? `<span>📅 ${formatDate(date)}</span>` : ''}
            <span>👤 ${people} ${t('cart_people')}</span>
          </div>
          <div class="cart-item-price">€${exc.price * people} <small>(${people}× €${exc.price})</small></div>
        </div>
        <button class="cart-remove" onclick="removeFromCart('${exc.id}')" title="${t('remove')}">×</button>
      </div>
    `).join('')}
    <div class="cart-total">
      <span style="font-weight:600;">${t('total')}:</span>
      <div class="price">€${total}</div>
    </div>
    <button class="checkout-btn" onclick="toast(t('demo_checkout')); closeCart();">${t('checkout')}</button>
  `;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(LOCALE_TAG[currentLang] || 'ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (_) { return iso; }
}

// Expose
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.openCart = openCart;
window.closeCart = closeCart;
window.openExc = openExc;
window.closeExc = closeExc;
window.setExcDate = setExcDate;
window.setExcPeople = setExcPeople;
window.toggleAllReviews = toggleAllReviews;
window.bookExc = bookExc;
window.setLang = setLang;
window.toggleLangMenu = toggleLangMenu;
window.t = t;
