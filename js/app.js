// ============================================================
//  Voyage Europa — SPA logic
// ============================================================

const app = document.getElementById('app');
const nav = document.getElementById('nav');
const footerCountries = document.getElementById('footer-countries');
const cartCountEl = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const cartBody = document.getElementById('cart-body');
const toastEl = document.getElementById('toast');

// ---------- Cart state ----------
const CART_KEY = 've_cart_v1';
let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');

const saveCart = () => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  cartCountEl.textContent = cart.length;
};
saveCart();

const addToCart = (excursionId, cityId, countryId) => {
  if (cart.find(i => i.excursionId === excursionId)) {
    toast('Экскурсия уже в корзине');
    return;
  }
  cart.push({ excursionId, cityId, countryId });
  saveCart();
  toast('Добавлено в корзину ✓');
  render();
};

const removeFromCart = (excursionId) => {
  cart = cart.filter(i => i.excursionId !== excursionId);
  saveCart();
  renderCart();
  render();
};

const openCart = () => { renderCart(); cartModal.classList.add('active'); };
const closeCart = () => cartModal.classList.remove('active');
cartModal.addEventListener('click', (e) => { if (e.target === cartModal) closeCart(); });

const toast = (msg) => {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toastEl.classList.remove('show'), 2200);
};

// ---------- Image generator (SVG postcards) ----------
// Each excursion gets a unique themed SVG "postcard".
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
    // Mountains
    layers.push(`<path d="M0,220 L120,120 L200,180 L320,80 L440,180 L520,140 L640,220 Z" fill="${c3}" opacity="0.55"/>`);
    layers.push(`<path d="M0,240 L100,180 L220,220 L340,150 L480,220 L640,190 L640,240 Z" fill="${c3}" opacity="0.85"/>`);
  } else if (pattern === 1) {
    // City skyline
    let sky = '';
    for (let i = 0; i < 12; i++) {
      const x = i * 55;
      const barH = 60 + ((h >> i) % 100);
      const w = 40 + ((h >> (i + 3)) % 15);
      sky += `<rect x="${x}" y="${240 - barH}" width="${w}" height="${barH}" fill="${c3}" opacity="${0.55 + (i % 3) * 0.1}"/>`;
    }
    layers.push(sky);
  } else if (pattern === 2) {
    // Arches / waves
    layers.push(`<path d="M0,240 Q160,140 320,240 T640,240 Z" fill="${c3}" opacity="0.5"/>`);
    layers.push(`<path d="M0,260 Q160,180 320,260 T640,260 Z" fill="${c3}" opacity="0.85"/>`);
  } else {
    // Cathedral silhouette
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

// ---------- Router ----------
window.addEventListener('hashchange', render);
window.addEventListener('load', () => {
  buildNav();
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

function buildNav() {
  nav.innerHTML = DATA.countries.map(c =>
    `<a href="#/country/${c.id}" data-country="${c.id}">${c.name}</a>`
  ).join('');
  footerCountries.innerHTML = DATA.countries.map(c =>
    `<li><a href="#/country/${c.id}">${c.flag} ${c.name}</a></li>`
  ).join('');
}

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
        <span class="eyebrow">Экскурсии по Европе</span>
        <h1>Откройте Европу через <em>авторские маршруты</em></h1>
        <p class="hero-sub">Более ${totalExc} экскурсий в ${totalCities} городах с проверенными русскоязычными гидами. Бронирование за 60 секунд.</p>
        <form class="search" onsubmit="event.preventDefault(); location.hash='#/search/'+encodeURIComponent(this.q.value);">
          <input name="q" placeholder="Куда поедем? Барселона, Рим, Прага…" autocomplete="off">
          <button class="search-btn" type="submit">Найти</button>
        </form>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">Направления</span>
            <h2>Восемь стран, одна страсть</h2>
            <p>От гауди-фасадов Барселоны до альпийских панорам Люцерна.</p>
          </div>
        </div>
        <div class="country-grid">
          ${DATA.countries.map(c => `
            <div class="country-card" onclick="location.hash='#/country/${c.id}'">
              <div class="card-bg">${svgCountryHero(c)}</div>
              <div class="card-overlay"></div>
              <div class="card-content">
                <div class="flag">${c.flag}</div>
                <h3>${c.name}</h3>
                <div class="card-meta">
                  <span>${c.cities.length} городов</span>
                  <span>·</span>
                  <span>${c.cities.reduce((s, ci) => s + ci.excursions.length, 0)} экскурсий</span>
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
            <span class="eyebrow">Почему Voyage Europa</span>
            <h2>Путешествия без забот</h2>
          </div>
        </div>
        <div class="features">
          <div class="feature">
            <div class="feature-icon">✓</div>
            <h4>Проверенные гиды</h4>
            <p>Каждый гид проходит трёхуровневую проверку. Средний рейтинг — 4.8.</p>
          </div>
          <div class="feature">
            <div class="feature-icon">↺</div>
            <h4>Отмена за 24 часа</h4>
            <p>Планы поменялись? Мы вернём 100% стоимости до начала тура.</p>
          </div>
          <div class="feature">
            <div class="feature-icon">☎</div>
            <h4>Поддержка 24/7</h4>
            <p>Русскоязычная поддержка круглосуточно в WhatsApp и Telegram.</p>
          </div>
          <div class="feature">
            <div class="feature-icon">€</div>
            <h4>Цена без наценок</h4>
            <p>Оплата напрямую гидам, никаких скрытых комиссий.</p>
          </div>
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
        <a href="#/">Главная</a> / <span>${country.name}</span>
      </div>
      <div class="page-hero">
        <div class="card-bg">${svgCountryHero(country)}</div>
        <div class="card-overlay"></div>
        <div class="content">
          <div class="flag">${country.flag}</div>
          <h1>${country.name}</h1>
          <p>${country.description}</p>
        </div>
      </div>
    </div>

    <section class="section" style="padding-top:20px;">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">Города</span>
            <h2>Куда отправимся?</h2>
            <p>${country.cities.length} городов · ${country.cities.reduce((s, c) => s + c.excursions.length, 0)} экскурсий</p>
          </div>
        </div>
        <div class="city-grid">
          ${country.cities.map(city => `
            <div class="city-card" onclick="location.hash='#/city/${country.id}/${city.id}'">
              <div class="card-bg">${svgPostcard(city.name, city.name, city.id + country.id)}</div>
              <div class="card-overlay"></div>
              <div class="card-content">
                <h4>${city.name}</h4>
                <div class="card-meta">${city.excursions.length} экскурсий · от €${Math.min(...city.excursions.map(e => e.price))}</div>
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
        <a href="#/">Главная</a> /
        <a href="#/country/${country.id}">${country.name}</a> /
        <span>${city.name}</span>
      </div>
      <div class="page-hero">
        <div class="card-bg">${svgPostcard(city.name, country.name, city.id + '-hero')}</div>
        <div class="card-overlay"></div>
        <div class="content">
          <h1>${city.name}</h1>
          <p>${city.description}</p>
        </div>
      </div>
    </div>

    <section class="section" style="padding-top:20px;">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">Экскурсии</span>
            <h2>${city.excursions.length} авторских маршрутов</h2>
            <p>Выберите тур, добавьте в корзину и оплатите онлайн.</p>
          </div>
        </div>
        <div class="excursion-grid">
          ${city.excursions.map(e => `
            <article class="excursion-card">
              <div class="card-img">
                ${svgPostcard(e.name, city.name, e.id)}
                <span class="badge">${e.duration}</span>
              </div>
              <div class="card-body">
                <div class="card-meta">
                  <span class="rating">${e.rating.toFixed(1)}</span>
                  <span>·</span>
                  <span>${e.reviews} отзывов</span>
                </div>
                <h4>${e.name}</h4>
                <p class="card-desc">${e.description}</p>
                <div class="card-footer">
                  <div class="price">€${e.price}<small>с человека</small></div>
                  <button class="book-btn ${inCart(e.id) ? 'in-cart' : ''}"
                    onclick="addToCart('${e.id}','${city.id}','${country.id}')">
                    ${inCart(e.id) ? 'В корзине' : 'Забронировать'}
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
        const hay = `${country.name} ${city.name} ${exc.name} ${exc.description}`.toLowerCase();
        if (!q || hay.includes(q)) {
          results.push({ country, city, exc });
        }
      });
    });
  });

  app.innerHTML = `
    <div class="container">
      <div class="crumbs"><a href="#/">Главная</a> / <span>Поиск: «${escapeHTML(query)}»</span></div>
    </div>
    <section class="section" style="padding-top:20px;">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">Результаты поиска</span>
            <h2>Найдено экскурсий: ${results.length}</h2>
          </div>
          <form class="search" style="max-width:420px;margin:0;" onsubmit="event.preventDefault(); location.hash='#/search/'+encodeURIComponent(this.q.value);">
            <input name="q" placeholder="Новый поиск…" value="${escapeHTML(query)}">
            <button class="search-btn" type="submit">Найти</button>
          </form>
        </div>
        ${results.length === 0 ? `
          <div class="no-results">Ничего не нашлось. Попробуйте другой запрос — например, «Барселона» или «замок».</div>
        ` : `
          <div class="excursion-grid">
            ${results.slice(0, 60).map(({ country, city, exc }) => `
              <article class="excursion-card">
                <div class="card-img">
                  ${svgPostcard(exc.name, city.name, exc.id)}
                  <span class="badge">${exc.duration}</span>
                </div>
                <div class="card-body">
                  <div class="card-meta">
                    <span class="rating">${exc.rating.toFixed(1)}</span>
                    <span>·</span>
                    <span>${country.flag} ${city.name}</span>
                  </div>
                  <h4>${exc.name}</h4>
                  <p class="card-desc">${exc.description}</p>
                  <div class="card-footer">
                    <div class="price">€${exc.price}<small>с человека</small></div>
                    <button class="book-btn" onclick="addToCart('${exc.id}','${city.id}','${country.id}')">Забронировать</button>
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

function renderCart() {
  if (cart.length === 0) {
    cartBody.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🧳</div>
        <p>Корзина пуста. Выберите экскурсию — и в путь!</p>
      </div>
    `;
    return;
  }
  const items = cart.map(({ excursionId, cityId, countryId }) => {
    const country = DATA.countries.find(c => c.id === countryId);
    const city = country?.cities.find(x => x.id === cityId);
    const exc = city?.excursions.find(e => e.id === excursionId);
    return { country, city, exc };
  }).filter(x => x.exc);

  const total = items.reduce((s, i) => s + i.exc.price, 0);
  cartBody.innerHTML = `
    ${items.map(({ country, city, exc }) => `
      <div class="cart-item">
        <div class="cart-item-img">${svgPostcard(exc.name, city.name, exc.id)}</div>
        <div class="cart-item-body">
          <h5>${exc.name}</h5>
          <small>${country.flag} ${city.name} · ${exc.duration}</small>
          <div class="cart-item-price">€${exc.price}</div>
        </div>
        <button class="cart-remove" onclick="removeFromCart('${exc.id}')" title="Удалить">×</button>
      </div>
    `).join('')}
    <div class="cart-total">
      <span style="font-weight:600;">Итого:</span>
      <div class="price">€${total}</div>
    </div>
    <button class="checkout-btn" onclick="toast('Демо: оформление заказа не подключено'); closeCart();">Оформить бронирование</button>
  `;
}

// Expose for onclick handlers
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.openCart = openCart;
window.closeCart = closeCart;
