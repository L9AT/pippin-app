/* ===== PIPPIN NFT — main.js ===== */



/* ----- Navbar scroll ----- */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });



/* ----- Mobile menu ----- */
function toggleMobileMenu() {
  const m = document.getElementById('mobileMenu');
  const nav = document.getElementById('navbar');
  if (m) m.classList.toggle('open');
  if (nav) nav.classList.toggle('menu-open');
}

/* ----- FAQ ----- */
function toggleFaq(el) {
  const wasOpen = el.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!wasOpen) el.classList.add('open');
}

/* ----- Wallet (removed — stubs kept to avoid reference errors) ----- */
function connectWallet() { }
function closeWalletModal() { }
function closeWalletModalBtn() { }
function connectMetaMask() { }
function connectCoinbase() { }
function connectWalletConnect() { }

/* ----- Toast ----- */
function showToast(msg) {
  let toast = document.getElementById('pippinToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'pippinToast';
    toast.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%) translateY(20px);background:#1c1c28;border:1px solid rgba(192,132,252,0.3);color:#f5f5f7;padding:0.8rem 1.5rem;border-radius:100px;font-size:0.88rem;font-weight:500;z-index:9999;opacity:0;transition:opacity 0.3s,transform 0.3s;pointer-events:none;white-space:nowrap;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, 3500);
}

/* ----- Animate Stats Counter ----- */
function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target'));
  const duration = 1200; // 1.2s duration
  const start = 0;
  let startTime = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const current = Math.floor(progress * (target - start) + start);
    el.textContent = current.toLocaleString();
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  }
  window.requestAnimationFrame(step);
}
const statsObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const nums = e.target.querySelectorAll('[data-target]');
      nums.forEach(animateCounter);
      statsObs.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObs.observe(heroStats);

/* ----- Scroll reveal ----- */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('revealed'); revealObs.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.process-step, .trait-category, .team-card, .nft-preview-card, .social-card, .faq-item, .about-prev-inner').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(32px)';
  el.style.transition = 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
  revealObs.observe(el);
});
document.head.insertAdjacentHTML('beforeend', '<style>.revealed { opacity: 1 !important; transform: translateY(0) !important; }</style>');

/* ----- Filter Group Toggle ----- */
function toggleFilter(id) {
  const opts = document.getElementById(id);
  if (!opts) return;
  const arrow = opts.previousElementSibling?.querySelector('.filter-arrow');
  opts.classList.toggle('open');
  if (arrow) arrow.classList.toggle('open');
}

window.filterCategorySearch = function (event, containerId) {
  const term = event.target.value.toLowerCase();
  const container = document.getElementById(containerId);
  if (!container) return;
  const labels = container.querySelectorAll('.filter-opt');
  labels.forEach(lbl => {
    const labelText = lbl.getAttribute('data-label') || '';
    if (labelText.includes(term)) {
      lbl.style.display = 'flex';
    } else {
      lbl.style.display = 'none';
    }
  });
};

function toggleMobileSidebar() {
  const sidebar = document.getElementById('exploreSidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

/* =====================================================
   NFT COLLECTION DATA
   Images live in the nfts/ folder.
   Metadata is loaded from nfts/metadata.json.
   ===================================================== */

const BG_GRADIENTS = {
  Pink: 'linear-gradient(135deg,#ffd6e7,#ffb3c6)',
  Blue: 'linear-gradient(135deg,#c7f2ff,#7dd3fc)',
  Yellow: 'linear-gradient(135deg,#fff9c4,#ffe082)',
  Purple: 'linear-gradient(135deg,#e9d5ff,#c084fc)',
  Green: 'linear-gradient(135deg,#d1fae5,#6ee7b7)',
  Cosmic: 'linear-gradient(135deg,#1e1b4b,#312e81)',
  default: 'linear-gradient(135deg,#2d2d2d,#1c1c28)',
};

let floorPriceETH = null;

/**
 * Fetch collection stats from OpenSea v2 API.
 * NOTE: OpenSea v2 API often requires an 'x-api-key' header for successful production requests.
 * Without a key, this might fall back to 0.000 or fail due to rate limits/CORS.
 */
async function fetchOpenSeaPrice() {
  try {
    const res = await fetch('https://api.opensea.io/api/v2/collections/pippinnft/stats', {
      headers: {
        'accept': 'application/json',
        // 'x-api-key': 'YOUR_OPENSEA_API_KEY_HERE' 
      }
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.total && data.total.floor_price) {
      floorPriceETH = data.total.floor_price;
    }
  } catch (err) {
    console.warn('OpenSea API unreachable without key or due to CORS:', err);
  }
}
fetchOpenSeaPrice();

/* ----- EXPLORE PAGE ----- */
let allNFTs = [];
let displayed = 0;
const PAGE_SIZE = 30;
let currentView = 'grid';
let filteredNFTs = [];

/**
 * Load your collection from nfts/metadata.json
 * Each entry should look like:
 * {
 *   "id": 1,
 *   "name": "Pippin #0001",
 *   "image": "nfts/1.png",     <-- path relative to this HTML file
 *   "rarity": "Legendary",
 *   "bg": "Pink",
 *   "skin": "Golden",
 *   "head": "Crown"
 * }
 */
async function initExplore() {
  const grid = document.getElementById('nftGrid');
  if (!grid) return;

  // Show a loading indicator
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:4rem;color:rgba(245,245,247,0.4);font-size:1rem;">Loading collection…</div>';

  if (!supabaseClient) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:4rem;color:rgba(245,245,247,0.4);font-size:1rem;">Supabase not configured.</div>';
    return;
  }

  try {
    let allData = [];
    let from = 0;
    const step = 1000;

    while (true) {
      const { data, error } = await supabaseClient
        .from('nfts')
        .select('*')
        .order('id', { ascending: true })
        .range(from, from + step - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;

      allData.push(...data);

      if (data.length < step) break;
      from += step;

      const loadingText = document.querySelector('#nftGrid div');
      if (loadingText) loadingText.textContent = `Loading collection... (${allData.length} items)`;
    }

    allNFTs = allData;
  } catch (err) {
    console.warn('Could not load nfts from Supabase:', err.message);
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:4rem;">
        <p style="color:#c084fc;font-size:1.1rem;margin-bottom:0.75rem;">📂 No collection loaded yet</p>
        <p style="color:rgba(245,245,247,0.5);font-size:0.9rem;">
          Make sure your Supabase table <code>nfts</code> is populated and storage is set up.
        </p>
      </div>`;
    return;
  }

  filteredNFTs = [...allNFTs];
  setupDynamicFilters();

  // Handle URL Search Param
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get('search');
  if (searchParam) {
    const gs = document.getElementById('globalSearch');
    if (gs) {
      gs.value = searchParam;
      filterNFTs();
      return; // filterNFTs calls displayNFTs(true)
    }
  }

  displayNFTs(true);
}

function setupDynamicFilters() {
  const container = document.getElementById('dynamicFilters');
  if (!container) return;

  const traitKeys = ['1/1', 'rarity', 'background', 'body', 'clothes', 'eyes', 'mouth', 'head'];
  container.innerHTML = '';

  traitKeys.forEach(key => {
    const valuesMap = {};
    allNFTs.forEach(n => {
      // Look at top-level attribute directly (since we updated db)
      let v = n[key];
      // Fallback to traits JSON if missing
      if (!v && n.traits && typeof n.traits === 'object') {
        v = n.traits[key];
      }

      // Remove the fallback that shows "None X"
      if (key === '1/1') {
        if (!v || String(v).trim().toLowerCase() !== 'yes') return;
        v = n.name || `Pippin #${n.id}`;
      } else {
        if (!v || String(v).trim() === '' || String(v).trim().toLowerCase() === 'none') {
          return;
        }
      }

      valuesMap[v] = (valuesMap[v] || 0) + 1;
    });

    const uniqueValues = Object.keys(valuesMap).sort();
    if (uniqueValues.length === 0) return;

    const group = document.createElement('div');
    group.className = 'filter-group';
    group.id = 'filter-' + key;

    const isOpen = key === 'rarity'; // Open rarity by default
    const label = key.charAt(0).toUpperCase() + key.slice(1);

    group.innerHTML = `
      <div class="filter-group-header" onclick="toggleFilter('${key}-opts')">
        <span>${label} <small style="font-size:0.65rem;font-weight:500;color:rgba(179,136,255,0.4);margin-left:2px;">${uniqueValues.length}</small></span>
        <svg class="filter-arrow ${isOpen ? 'open' : ''}" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <div class="filter-options ${isOpen ? 'open' : ''}" id="${key}-opts">
        <div class="filter-options-inner">
          <div class="filter-cat-search-wrap">
             <input type="text" class="filter-cat-search" placeholder="Search ${label}..." oninput="filterCategorySearch(event, '${key}-opts')" />
          </div>
          <div class="filter-values-container">
            ${uniqueValues.map(v => `
              <label class="filter-opt" data-label="${(v || '').toLowerCase()}">
                <input type="checkbox" data-key="${key}" value="${String(v).replace(/"/g, '&quot;')}" onchange="filterNFTs()" />
                <span>${v}</span>
                <span class="opt-count">${valuesMap[v]}</span>
              </label>
            `).join('')}
          </div>
        </div>
      </div>`;
    container.appendChild(group);
  });
}

function createNFTCard(nft) {
  const rarityClass = 'r-' + (nft.rarity || 'common').toLowerCase();

  // Use trait for background if available
  let bgValue = '';
  if (nft.traits && typeof nft.traits === 'object') {
    bgValue = nft.traits.background || '';
  } else {
    bgValue = nft.background || '';
  }
  const bgKey = bgValue.charAt(0).toUpperCase() + bgValue.slice(1).toLowerCase();
  const fallback = BG_GRADIENTS[bgKey] || BG_GRADIENTS.default;

  const isOneOfOne = ((nft.traits && nft.traits['1/1']) || nft['1/1'] || '').toLowerCase() === 'yes';

  // Use public Supabase URL for grid images (low res)
  let imgUrl = `https://xzkbbgbsnkocirthyuei.supabase.co/storage/v1/object/public/nfts/low/${nft.id}.png`;
  if (isOneOfOne && nft.name) {
    const oneOfOneName = nft.name === 'Tema' ? 'tema' : nft.name;
    imgUrl = `https://xzkbbgbsnkocirthyuei.supabase.co/storage/v1/object/public/nfts/hq/${encodeURIComponent(oneOfOneName)}.webp`;
  }

  const card = document.createElement('a');
  card.className = 'nft-card';
  card.href = `nft.html?id=${nft.id}`;
  card.setAttribute('data-id', nft.id);
  card.innerHTML = `
    <div class="nft-card-img" style="background:${fallback};">
      <img
        src="${imgUrl}"
        alt="${nft.name || 'Pippin #' + nft.id}"
        loading="lazy"
        onerror="this.src='https://via.placeholder.com/400?text=Pippin+NFT'"
      />
      <div class="nft-overlay">
        <a href="https://opensea.io/assets/ethereum/0x77db1c96cdc18f82390ab349a8b33b4fb9d5ea87/${nft.id}" target="_blank" class="overlay-btn buy" onclick="event.stopPropagation()">
          <svg width="16" height="16" viewBox="0 0 360 360" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M181.6 0C80.9-.8-.8 80.9 0 181.6c.8 97.7 80.7 177.6 178.4 178.4 100.7.9 182.4-80.9 181.6-181.6C359.2 80.7 279.3.8 181.6 0Zm-53.9 89.6c11.5 14.6 18.4 33.2 18.4 53.2 0 17.4-5.2 33.6-14 47.2H69.7l58-100.4ZM318 199.2v13c0 .8-.4 1.5-1.2 1.9-4.2 1.8-18.2 8.3-24 16.3-15 20.9-26.4 53.6-52 53.6H134.2c-37.8 0-69.4-30-69.3-69.9 0-1 .8-1.8 1.8-1.8h50.5c1.8 0 3.1 1.4 3.1 3.1v9.8c0 5.2 4.2 9.4 9.4 9.4h38.3v-22.3h-26.2c15.1-19.1 24-43.2 24-69.4 0-29.2-11.2-55.9-29.6-75.9 11.1 1.3 21.7 3.5 31.7 6.4v-6.2c0-6.4 5.2-11.7 11.7-11.7 6.4 0 11.7 5.2 11.7 11.7v15c35.8 16.7 59.2 44.4 59.2 75.8 0 18.4-8 35.5-21.9 49.9-2.7 2.8-6.4 4.3-10.2 4.3h-27.1v22.3H225.4c7.3 0 20.4-13.9 26.7-22.3 0 0 .3-.4 1-.6.7-.2 62.4-14.4 62.4-14.4 1.3-.4 2.6.6 2.6 1.9Z" fill="#2081E2"/></svg>
          Buy on OpenSea
        </a>
        <a href="nft.html?id=${nft.id}" class="overlay-btn view" onclick="event.stopPropagation()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          Internal Details
        </a>
      </div>
    </div>
    <div class="nft-card-body">
      <span class="nft-card-name">${nft.name || 'Pippin #' + String(nft.id).padStart(4, '0')}</span>

      <div class="nft-card-badges">
        <span class="rarity-badge ${rarityClass}">${nft.rarity || 'Common'}</span>
        <span class="rank-badge">#${nft.rank || '—'}</span>
        ${isOneOfOne ? '<span class="one-of-one-badge" style="padding: 0.2rem 0.6rem; font-size: 0.7rem;">1/1</span>' : ''}
      </div>
    </div>
    <div class="list-actions">
      <a href="https://opensea.io/assets/ethereum/0x77db1c96cdc18f82390ab349a8b33b4fb9d5ea87/${nft.id}" target="_blank" class="list-action-btn list-buy" onclick="event.stopPropagation(); event.preventDefault(); window.open(this.href, '_blank');">
        <svg width="14" height="14" viewBox="0 0 360 360" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M181.6 0C80.9-.8-.8 80.9 0 181.6c.8 97.7 80.7 177.6 178.4 178.4 100.7.9 182.4-80.9 181.6-181.6C359.2 80.7 279.3.8 181.6 0Zm-53.9 89.6c11.5 14.6 18.4 33.2 18.4 53.2 0 17.4-5.2 33.6-14 47.2H69.7l58-100.4ZM318 199.2v13c0 .8-.4 1.5-1.2 1.9-4.2 1.8-18.2 8.3-24 16.3-15 20.9-26.4 53.6-52 53.6H134.2c-37.8 0-69.4-30-69.3-69.9 0-1 .8-1.8 1.8-1.8h50.5c1.8 0 3.1 1.4 3.1 3.1v9.8c0 5.2 4.2 9.4 9.4 9.4h38.3v-22.3h-26.2c15.1-19.1 24-43.2 24-69.4 0-29.2-11.2-55.9-29.6-75.9 11.1 1.3 21.7 3.5 31.7 6.4v-6.2c0-6.4 5.2-11.7 11.7-11.7 6.4 0 11.7 5.2 11.7 11.7v15c35.8 16.7 59.2 44.4 59.2 75.8 0 18.4-8 35.5-21.9 49.9-2.7 2.8-6.4 4.3-10.2 4.3h-27.1v22.3H225.4c7.3 0 20.4-13.9 26.7-22.3 0 0 .3-.4 1-.6.7-.2 62.4-14.4 62.4-14.4 1.3-.4 2.6.6 2.6 1.9Z" fill="#2081E2"/></svg>
        Buy
      </a>
      <a href="nft.html?id=${nft.id}" class="list-action-btn list-view-btn" onclick="event.stopPropagation();">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
        Details
      </a>
    </div>`;
  return card;
}

let isLoadingMore = false;
let infiniteObserver = null;

function displayNFTs(reset = false) {
  const grid = document.getElementById('nftGrid');
  if (!grid) return;
  if (reset) { grid.innerHTML = ''; displayed = 0; }
  const slice = filteredNFTs.slice(displayed, displayed + PAGE_SIZE);
  slice.forEach(nft => grid.appendChild(createNFTCard(nft)));
  displayed += slice.length;
  const count = document.getElementById('resultCount');
  if (count) count.textContent = `Showing ${Math.min(displayed, filteredNFTs.length).toLocaleString()} of ${filteredNFTs.length.toLocaleString()} NFTs`;
  isLoadingMore = false;
  setupInfiniteScroll();
}

function setupInfiniteScroll() {
  // Clean up previous observer
  if (infiniteObserver) { infiniteObserver.disconnect(); infiniteObserver = null; }

  // Don't observe if all items are shown
  if (displayed >= filteredNFTs.length) {
    const sentinel = document.getElementById('infiniteScrollSentinel');
    if (sentinel) sentinel.style.display = 'none';
    return;
  }

  // Create or show sentinel element
  let sentinel = document.getElementById('infiniteScrollSentinel');
  if (!sentinel) {
    sentinel = document.createElement('div');
    sentinel.id = 'infiniteScrollSentinel';
    sentinel.style.cssText = 'width:100%;height:1px;';
    const grid = document.getElementById('nftGrid');
    if (grid && grid.parentNode) grid.parentNode.insertBefore(sentinel, grid.nextSibling);
  }
  sentinel.style.display = 'block';

  infiniteObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !isLoadingMore && displayed < filteredNFTs.length) {
        isLoadingMore = true;
        displayNFTs(false);
      }
    });
  }, { rootMargin: '400px' });

  infiniteObserver.observe(sentinel);
}

function loadMore() { displayNFTs(false); }

function filterNFTs() {
  const search = (document.getElementById('globalSearch')?.value || '').toLowerCase();

  // Collect all checked filters by key
  const activeFilters = {};
  document.querySelectorAll('#dynamicFilters input[type=checkbox]:checked').forEach(input => {
    const key = input.getAttribute('data-key');
    if (!activeFilters[key]) activeFilters[key] = [];
    activeFilters[key].push(input.value);
  });

  filteredNFTs = allNFTs.filter(nft => {
    const idStr = String(nft.id).padStart(4, '0');
    // Search
    if (search) {
      const cardText = `${nft.name} ${idStr} ${nft['1/1']} ${nft.rarity} ${nft.background} ${nft.body} ${nft.clothes} ${nft.head}`.toLowerCase();
      if (!cardText.includes(search)) return false;
    }

    // Traits
    for (const [key, selectedValues] of Object.entries(activeFilters)) {
      let nftValue = nft[key];
      if (!nftValue && nft.traits && typeof nft.traits === 'object') {
        nftValue = nft.traits[key];
      }

      if (key === '1/1') {
        if (!nftValue || String(nftValue).trim().toLowerCase() !== 'yes') return false;
        const actualValue = nft.name || `Pippin #${nft.id}`;
        if (!selectedValues.includes(actualValue)) return false;
      } else {
        if (!nftValue) return false;
        if (!selectedValues.includes(nftValue)) return false;
      }
    }

    return true;
  });

  sortNFTsArray();
  displayNFTs(true);
  updateActiveFilters();
}

function sortNFTs() { sortNFTsArray(); displayNFTs(true); }
function sortNFTsArray() {
  const s = document.getElementById('sortSelect')?.value || 'id-asc';
  const order = { Legendary: 0, Epic: 1, Rare: 2, Uncommon: 3, Common: 4 };
  if (s === 'id-asc') filteredNFTs.sort((a, b) => a.id - b.id);
  else if (s === 'id-desc') filteredNFTs.sort((a, b) => b.id - a.id);
  else if (s === 'rank-asc') filteredNFTs.sort((a, b) => a.rank - b.rank);
  else if (s === 'rank-desc') filteredNFTs.sort((a, b) => b.rank - a.rank);
  else if (s === 'rarity') filteredNFTs.sort((a, b) => order[a.rarity] - order[b.rarity]);
  else if (s === 'name') filteredNFTs.sort((a, b) => a.id - b.id);
}

function clearAllFilters() {
  document.querySelectorAll('.explore-sidebar input[type=checkbox]').forEach(i => i.checked = false);
  const gs = document.getElementById('globalSearch'); if (gs) gs.value = '';
  const ti = document.getElementById('tokenIdInput'); if (ti) ti.value = '';
  filteredNFTs = [...allNFTs];
  displayNFTs(true);
  updateActiveFilters();
}

function updateActiveFilters() {
  const wrap = document.getElementById('activeFilters');
  if (!wrap) return;
  wrap.innerHTML = '';
  const checked = [...document.querySelectorAll('.explore-sidebar input[type=checkbox]:checked')];
  checked.forEach(i => {
    const tag = document.createElement('div');
    tag.className = 'active-filter-tag';
    tag.innerHTML = `${i.value}<button onclick="removeFilter(this,'${i.value}')" aria-label="Remove filter">×</button>`;
    wrap.appendChild(tag);
  });
}

function removeFilter(btn, val) {
  const checkbox = [...document.querySelectorAll('#dynamicFilters input[type=checkbox]')].find(i => i.value === val);
  if (checkbox) { checkbox.checked = false; filterNFTs(); }
}

function goToToken() {
  const id = parseInt(document.getElementById('tokenIdInput')?.value);
  if (!isNaN(id) && id >= 1) {
    filteredNFTs = allNFTs.filter(n => n.id === id);
    displayNFTs(true);
    if (filteredNFTs.length === 0) showToast('Token #' + id + ' not found');
  }
}

function setView(view) {
  currentView = view;
  const grid = document.getElementById('nftGrid');
  if (!grid) return;
  if (view === 'list') {
    grid.classList.add('list-view');
    document.getElementById('listViewBtn')?.classList.add('active');
    document.getElementById('gridViewBtn')?.classList.remove('active');
  } else {
    grid.classList.remove('list-view');
    document.getElementById('gridViewBtn')?.classList.add('active');
    document.getElementById('listViewBtn')?.classList.remove('active');
  }
}

function randomNFT() {
  const nft = allNFTs[Math.floor(Math.random() * allNFTs.length)];
  window.location.href = `nft.html?id=${nft.id}`;
}

/* ----- NFT MODAL (REMOVED - Redirecting to nft.html) ----- */
function closeNFTModalBtn() { }


/* ----- Home Slider ----- */
function initHomeSlider() {
  const track = document.getElementById('sliderTrack');
  const container = document.querySelector('.slider-container');
  if (!track || !container) return;

  const TOTAL_PIPPINS = 3333;
  const PROJECT_ID = "xzkbbgbsnkocirthyuei";
  const BASE_URL = `https://${PROJECT_ID}.supabase.co/storage/v1/object/public/nfts/low/`;

  const allIds = Array.from({ length: TOTAL_PIPPINS }, (_, i) => i + 1);
  for (let i = allIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allIds[i], allIds[j]] = [allIds[j], allIds[i]];
  }

  const selectedIds = allIds.slice(0, 16);
  const createPreviewCardHTML = (id) => {
    const name = `Pippin #${String(id).padStart(4, '0')}`;
    const imgUrl = `${BASE_URL}${id}.png`;
    return `
      <a href="nft.html?id=${id}" class="nft-preview-card">
        <div class="nft-img-wrap" style="background:${BG_GRADIENTS.default};">
          <img src="${imgUrl}" alt="${name}" loading="lazy" onerror="this.parentElement.parentElement.remove()" />
        </div>
        <div class="nft-info">
          <span class="nft-name">${name}</span>
        </div>
      </a>
    `;
  };

  track.innerHTML = selectedIds.map(createPreviewCardHTML).join('') + selectedIds.map(createPreviewCardHTML).join('');

  // Interaction Logic with Inertia
  let currentX = 0;
  let isDragging = false;
  let startX = 0;
  let baseSpeed = 1.25;
  let dragX = 0;
  let isHovered = false;

  // Inertia variables
  let velocity = 0;
  let lastX = 0;
  let lastTime = 0;
  const friction = 0.95; // Decay factor

  const update = () => {
    if (isDragging) {
      // While dragging, velocity is handled by pointermove
    } else {
      // Apply momentum or base speed
      if (Math.abs(velocity) > 0.1) {
        currentX += velocity;
        velocity *= friction;
      } else {
        velocity = 0;
        if (!isHovered) {
          currentX -= baseSpeed;
        }
      }

      const trackWidth = track.scrollWidth / 2;
      if (currentX <= -trackWidth) {
        currentX += trackWidth;
      } else if (currentX > 0) {
        currentX -= trackWidth;
      }
    }

    track.style.transform = `translateX(${currentX}px)`;
    requestAnimationFrame(update);
  };

  // Drag Support
  container.addEventListener('pointerdown', (e) => {
    isDragging = true;
    startX = e.pageX;
    dragX = currentX;
    lastX = e.pageX;
    lastTime = Date.now();
    velocity = 0; // Reset inertia on click
    container.style.cursor = 'grabbing';
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const now = Date.now();
    const dt = now - lastTime;
    if (dt > 0) {
      const dx = e.pageX - lastX;
      velocity = dx; // Simple velocity tracking
      lastX = e.pageX;
      lastTime = now;
    }

    const x = e.pageX;
    const walk = (x - startX) * 1.5;
    currentX = dragX + walk;
  });

  window.addEventListener('pointerup', () => {
    isDragging = false;
    container.style.cursor = 'grab';
  });

  // Wheel Support (adds to velocity for smooth interaction)
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    velocity -= e.deltaY * 0.5; // Add wheel movement to velocity pool
  }, { passive: false });

  // Hover Support
  container.addEventListener('mouseenter', () => isHovered = true);
  container.addEventListener('mouseleave', () => isHovered = false);

  // Initialize
  container.style.cursor = 'grab';
  track.style.animation = 'none';
  requestAnimationFrame(update);
}

/* ----- Init on page load ----- */
window.addEventListener('DOMContentLoaded', () => {
  // initExplore is async — it fetches nfts/metadata.json
  initExplore();
  // initHomeSlider handles the landing page slider
  initHomeSlider();
  // Close modals on ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeNFTModalBtn();
  });
});
