/**
 * CRISTEL MAE LACEA — PORTFOLIO MAIN JAVASCRIPT
 * Filmmaker & Multimedia Creator
 * Dynamically populates the 3 requested categories: Films, Advertisements, and Posters
 */

let allProjects = (typeof window !== 'undefined' && window.PROJECTS_DATA) ? window.PROJECTS_DATA : [];
let posterProjects = [];
let currentPosterIndex = 0;

function bootstrapPortfolio() {
  initAmbientCanvas();
  initNavbar();
  loadAndDistributeProjects();
  initPosterLightbox();
  initVideoModal();
  initContactForm();
  initClipboard();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapPortfolio);
} else {
  bootstrapPortfolio();
}

/* ==========================================================================
   1. AMBIENT KINETIC CANVAS (Cyan Cyber Glow & Floating Dust)
   ========================================================================== */
function initAmbientCanvas() {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const PARTICLE_COUNT = 45;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.speedY = (Math.random() - 0.5) * 0.4;
      this.alpha = Math.random() * 0.5 + 0.15;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
        this.reset();
      }
    }
    draw() {
      ctx.fillStyle = `rgba(0, 240, 255, ${this.alpha})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00f0ff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 110) {
          ctx.strokeStyle = `rgba(0, 240, 255, ${0.12 * (1 - dist / 110)})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
      particles[i].update();
      particles[i].draw();
    }

    requestAnimationFrame(animate);
  }
  animate();
}

/* ==========================================================================
   2. NAVBAR SCROLL & ACTIVE STATE
   ========================================================================== */
function initNavbar() {
  const nav = document.querySelector('.site-nav');
  const toggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });

  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      if (navLinks.style.display === 'flex') {
        navLinks.style.display = 'none';
      } else {
        navLinks.style.display = 'flex';
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '80px';
        navLinks.style.left = '0';
        navLinks.style.width = '100%';
        navLinks.style.background = 'rgba(7, 8, 11, 0.98)';
        navLinks.style.padding = '2rem';
        navLinks.style.borderBottom = '1px solid var(--border-cyan)';
      }
    });
  }
}

/* ==========================================================================
   3. LOAD PROJECTS & POPULATE 3 CATEGORIES: FILMS, ADVERTISEMENTS, POSTERS
   ========================================================================== */
async function loadAndDistributeProjects() {
  // If preloaded projects data exists, render immediately with zero delay
  if (allProjects && allProjects.length > 0) {
    renderAllCategories();
  }

  // Attempt API fetch in background to sync any fresh updates
  try {
    const res = await fetch('/api/projects');
    if (res.ok) {
      const fresh = await res.json();
      if (Array.isArray(fresh) && fresh.length > 0) {
        allProjects = fresh;
        renderAllCategories();
        return;
      }
    }
  } catch (err) {
    // Attempt local file fetch if API failed
    try {
      const fallback = await fetch('data/projects.json');
      if (fallback.ok) {
        const freshFallback = await fallback.json();
        if (Array.isArray(freshFallback) && freshFallback.length > 0) {
          allProjects = freshFallback;
          renderAllCategories();
          return;
        }
      }
    } catch (fallbackErr) {
      // Ignored: already rendered from preloaded PROJECTS_DATA
    }
  }

  // Final fallback render if not yet rendered
  renderAllCategories();
}

function renderAllCategories() {
  renderFilmsSection();
  renderAdsSection();
  renderPostersSection();
  bindMediaTriggers();
}

function renderFilmsSection() {
  const container = document.getElementById('films-container');
  if (!container) return;

  const films = allProjects.filter(p => p.category === 'films');
  if (films.length === 0) return;

  // If cards are already pre-rendered in HTML, just bind the interactions
  if (container.children.length > 0 && container.querySelector('.film-showcase-card')) {
    initFilmInteractions(films);
    return;
  }

  container.innerHTML = '';

  films.forEach((item, filmIdx) => {
    const stills = item.stills || [];
    const stillsCount = stills.length;
    const toolsHtml = (item.tools || []).map(t => `<span class="tool-pill">${t}</span>`).join('');
    
    const card = document.createElement('article');
    card.className = `film-showcase-card ${filmIdx === 0 ? 'is-expanded' : ''}`;
    card.id = `film-card-${item.id}`;

    // Generate horizontal scene still cards
    const scenesCardsHtml = stills.map((still, sIdx) => {
      return `
        <div class="film-scene-card" data-film-idx="${filmIdx}" data-still-idx="${sIdx}" title="Tap for high-definition look">
          <div class="scene-media-wrap">
            <span class="scene-badge-pill">SCENE 0${sIdx + 1}</span>
            <img src="${still.src}" alt="${still.title}" loading="lazy">
            <div class="scene-hover-curtain">
              <div class="scene-zoom-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="11" y1="8" x2="11" y2="14"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              </div>
              <span class="scene-curtain-text">TAP FOR BETTER LOOK</span>
            </div>
          </div>
          <div class="scene-footer-bar">
            <span class="scene-label-title">${still.label || still.title}</span>
            <span class="scene-tap-hint">[TAP TO INSPECT]</span>
          </div>
        </div>
      `;
    }).join('');

    card.innerHTML = `
      <!-- Top Presentation: Cover Thumbnail & Project Details -->
      <div class="film-main-presentation">
        
        <!-- Film Cover Thumbnail (Clean, unobstructed artwork) -->
        <div class="film-cover-box" data-zoom-cover="${filmIdx}" title="${item.title} (Click to view full cover artwork)">
          <img src="${item.thumbnail}" alt="${item.title} Cover Thumbnail" loading="lazy">
          
          <div class="film-cover-overlay">
            <div class="film-cover-top-bar">
              <span class="film-badge-cat">${item.category_label || 'Film'}</span>
              <span class="film-badge-count">🎬 ${stillsCount} Scenes</span>
            </div>
          </div>
        </div>

        <!-- Film Information Column -->
        <div class="film-info-column">
          <div class="film-meta-header">
            <span class="film-genre-tag">${item.sub_type || 'Narrative Film'}</span>
            <span>YEAR: ${item.year}</span>
          </div>

          <h3 class="film-title-text">${item.title}</h3>
          <span class="film-role-badge">// ${item.role}</span>
          <p class="film-summary-text">${item.description}</p>

          <div class="film-software-pills">
            ${toolsHtml}
          </div>

          <div class="film-action-buttons">
            <button type="button" class="btn-toggle-slider" data-toggle-film="${item.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                <line x1="7" y1="2" x2="7" y2="22" stroke="#000" stroke-width="2"/>
                <line x1="17" y1="2" x2="17" y2="22" stroke="#000" stroke-width="2"/>
              </svg>
              <span class="btn-toggle-text">${filmIdx === 0 ? 'Hide Scenes Reel' : `Explore Scenes Reel (${stillsCount})`}</span>
              <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
            </button>

            <button type="button" class="btn btn-outline btn-sm" data-zoom-cover="${filmIdx}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              View Cover Fullscreen
            </button>
          </div>
        </div>

      </div>

      <!-- Horizontal Slidebar Tray -->
      <div class="film-scenes-tray ${filmIdx === 0 ? '' : 'is-hidden'}" id="tray-${item.id}">
        <div class="tray-header-bar">
          <div class="tray-header-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
            <span>${item.title} // HORIZONTAL SCENE SLIDER (${stillsCount} STILLS)</span>
          </div>

          <div class="tray-nav-controls">
            <button type="button" class="tray-nav-btn btn-slide-prev" data-track-id="track-${item.id}" aria-label="Slide Left">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button type="button" class="tray-nav-btn btn-slide-next" data-track-id="track-${item.id}" aria-label="Slide Right">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>

        <!-- Horizontal Track with Custom Cyber Scrollbar -->
        <div class="film-slider-track" id="track-${item.id}">
          ${scenesCardsHtml}
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  initFilmInteractions(films);
}

let filmInteractionsInitialized = false;

function toggleFilmScenesTray(filmId) {
  const card = document.getElementById(`film-card-${filmId}`);
  const tray = document.getElementById(`tray-${filmId}`);
  if (!card || !tray) return;

  const isCurrentlyHidden = tray.classList.contains('is-hidden');
  const toggleBtnText = card.querySelector('.btn-toggle-slider .btn-toggle-text');
  const films = allProjects.filter(p => p.category === 'films');
  const film = films.find(p => p.id === filmId);
  const stillCount = (film && film.stills) ? film.stills.length : 3;

  if (isCurrentlyHidden) {
    tray.classList.remove('is-hidden');
    card.classList.add('is-expanded');
    if (toggleBtnText) toggleBtnText.textContent = 'Hide Scenes Reel';
    setTimeout(() => {
      tray.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
  } else {
    tray.classList.add('is-hidden');
    card.classList.remove('is-expanded');
    if (toggleBtnText) toggleBtnText.textContent = `Explore Scenes Reel (${stillCount})`;
  }
}

function openFilmSceneLightbox(filmIdx, stillIdx) {
  const films = allProjects.filter(p => p.category === 'films');
  const film = films[filmIdx];
  if (!film) return;

  const galleryItems = (film.stills || []).map((still, idx) => ({
    tag: `// ${film.title.toUpperCase()} • SCENE 0${idx + 1}`,
    src: still.src,
    title: still.title,
    clientLabel: 'FILM TITLE / CATEGORY',
    client: `${film.title} (${film.category_label})`,
    year: film.year,
    resLabel: 'CINEMATIC RESOLUTION',
    res: film.resolution || '16:9 Cinematic HD',
    hideDesc: true, // REMOVE SCENE CONTEXT & RATIONALE
    desc: '',
    tools: film.tools || []
  }));

  openGalleryModal(galleryItems, stillIdx);
}

function openFilmCoverLightbox(filmIdx) {
  const films = allProjects.filter(p => p.category === 'films');
  const film = films[filmIdx];
  if (!film) return;

  const galleryItems = [
    {
      tag: `// ${film.title.toUpperCase()} • OFFICIAL COVER`,
      src: film.thumbnail,
      title: `${film.title} — Official Cover Poster Artwork`,
      clientLabel: 'FILM / PRODUCTION',
      client: `${film.title} (${film.category_label})`,
      year: film.year,
      resLabel: 'COVER SPECS',
      res: film.resolution || '16:9 High-Definition Poster',
      hideDesc: true, // REMOVE SCENE CONTEXT & RATIONALE
      desc: '',
      tools: film.tools || []
    },
    ...(film.stills || []).map((still, idx) => ({
      tag: `// ${film.title.toUpperCase()} • SCENE 0${idx + 1}`,
      src: still.src,
      title: still.title,
      clientLabel: 'FILM TITLE / CATEGORY',
      client: `${film.title} (${film.category_label})`,
      year: film.year,
      resLabel: 'CINEMATIC RESOLUTION',
      res: film.resolution || '16:9 Cinematic HD',
      hideDesc: true, // REMOVE SCENE CONTEXT & RATIONALE
      desc: '',
      tools: film.tools || []
    }))
  ];

  openGalleryModal(galleryItems, 0);
}

function initFilmInteractions(films) {
  if (filmInteractionsInitialized) return;
  filmInteractionsInitialized = true;

  // Single global delegated listener for all film actions
  document.addEventListener('click', (e) => {
    // 1. Toggle slider button
    const toggleBtn = e.target.closest('.btn-toggle-slider');
    if (toggleBtn) {
      e.preventDefault();
      const filmId = toggleBtn.getAttribute('data-toggle-film');
      if (filmId) toggleFilmScenesTray(filmId);
      return;
    }

    // 2. Slide left button
    const prevBtn = e.target.closest('.btn-slide-prev');
    if (prevBtn) {
      e.preventDefault();
      const trackId = prevBtn.getAttribute('data-track-id');
      const track = document.getElementById(trackId);
      if (track) track.scrollBy({ left: -360, behavior: 'smooth' });
      return;
    }

    // 3. Slide right button
    const nextBtn = e.target.closest('.btn-slide-next');
    if (nextBtn) {
      e.preventDefault();
      const trackId = nextBtn.getAttribute('data-track-id');
      const track = document.getElementById(trackId);
      if (track) track.scrollBy({ left: 360, behavior: 'smooth' });
      return;
    }

    // 4. Scene card click (tap for high-definition look)
    const sceneCard = e.target.closest('.film-scene-card');
    if (sceneCard) {
      e.preventDefault();
      const filmIdx = parseInt(sceneCard.getAttribute('data-film-idx'), 10);
      const stillIdx = parseInt(sceneCard.getAttribute('data-still-idx'), 10);
      openFilmSceneLightbox(filmIdx, stillIdx);
      return;
    }

    // 5. Fullscreen Cover Artwork button / cover box click
    const zoomCoverTrigger = e.target.closest('[data-zoom-cover]');
    if (zoomCoverTrigger) {
      e.preventDefault();
      const filmIdx = parseInt(zoomCoverTrigger.getAttribute('data-zoom-cover'), 10);
      openFilmCoverLightbox(filmIdx);
      return;
    }
  });

  // Smooth horizontal mouse wheel scroll on scene tracks
  document.addEventListener('wheel', (e) => {
    const track = e.target.closest('.film-slider-track');
    if (track && e.deltaY !== 0) {
      e.preventDefault();
      track.scrollLeft += e.deltaY;
    }
  }, { passive: false });
}

function renderAdsSection() {
  const container = document.getElementById('ads-container');
  if (!container) return;

  const ads = allProjects.filter(p => p.category === 'advertisements');
  if (ads.length === 0) return;

  if (container.children.length > 0 && container.querySelector('.project-card')) {
    return;
  }

  container.innerHTML = '';

  ads.forEach(item => {
    const toolsHtml = item.tools.map(t => `<span class="tool-pill">${t}</span>`).join('');
    const isPortrait = item.aspect_ratio === '9-16';
    const aspectClass = isPortrait ? 'aspect-16-9 portrait-card-wrap' : 'aspect-16-9';

    const card = document.createElement('article');
    card.className = 'project-card';
    card.innerHTML = `
      <div class="project-media-wrap ${aspectClass}"
           data-open-video
           data-video-url="${item.video_url}"
           data-title="${item.title}"
           data-role="${item.role}"
           data-aspect="${item.aspect_ratio || '16-9'}">
        ${isPortrait ? `<div class="portrait-blur-backdrop" style="background-image: url('${item.thumbnail}');"></div><img src="${item.thumbnail}" alt="${item.title}" class="portrait-centered-thumb" loading="lazy">` : `<img src="${item.thumbnail}" alt="${item.title}" loading="lazy">`}
        
        <div class="card-category-badge">${item.category_label}</div>
        <div class="card-duration-badge">${item.duration}${isPortrait ? ' • 📱 9:16' : ''}</div>

        <div class="media-hover-overlay">
          <div class="play-action-icon" title="Watch Commercial Ad">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6 4 20 12 6 20 6 4"></polygon>
            </svg>
          </div>
        </div>
      </div>

      <div class="project-details">
        <div class="project-header">
          <div class="project-client-year">
            <span>CAMPAIGN: ${item.client}</span>
            <span>${item.year}</span>
          </div>
          <h3 class="project-title">${item.title}</h3>
        </div>

        <div class="project-caption-box">
          <strong>DELIVERABLES &amp; TOOLS:</strong>
          ${item.caption}
        </div>

        <p class="project-desc">${item.description}</p>

        <div class="project-tools">
          ${toolsHtml}
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderPostersSection() {
  const container = document.getElementById('posters-container');
  if (!container) return;

  const posters = allProjects.filter(p => p.category === 'posters');
  if (posters.length === 0) return;

  if (container.children.length > 0 && container.querySelector('.poster-card')) {
    return;
  }

  container.innerHTML = '';

  posters.forEach((item, index) => {
    const card = document.createElement('article');
    card.className = 'poster-card';
    card.innerHTML = `
      <div class="poster-media-frame"
           data-open-poster
           data-poster-idx="${index}"
           data-img-src="${item.full_image || item.thumbnail}"
           data-title="${item.title}"
           data-client="${item.client}"
           data-year="${item.year}"
           data-res="${item.resolution || 'High-Resolution Art'}"
           title="${item.title} (Click to inspect in fullscreen)">
        <div class="poster-blur-backdrop" style="background-image: url('${item.thumbnail}');"></div>
        <img src="${item.thumbnail}" alt="${item.title}" loading="lazy">
        <div class="poster-hover-curtain">
          <div class="poster-zoom-pill">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
            <span>TAP FOR BETTER LOOK</span>
          </div>
        </div>
      </div>
      <div class="poster-footer-caption">
        <span class="poster-title-label">${item.title.split('//')[0].trim()}</span>
        <span class="poster-action-hint">[TAP TO INSPECT]</span>
      </div>
    `;
    container.appendChild(card);
  });
}

let currentGalleryItems = [];
let currentGalleryIndex = 0;

let mediaTriggersBound = false;

function bindMediaTriggers() {
  if (mediaTriggersBound) return;
  mediaTriggersBound = true;

  // Posters Lightbox
  const posterTriggers = document.querySelectorAll('[data-open-poster]');
  posterProjects = Array.from(posterTriggers).map((el, index) => {
    return {
      index,
      tag: '// KEY ART & POSTER SPEC',
      src: el.getAttribute('data-img-src') || (el.querySelector('img') ? el.querySelector('img').src : ''),
      title: el.getAttribute('data-title') || 'Poster Artwork',
      clientLabel: 'PUBLICATION / SERIES',
      client: el.getAttribute('data-client') || 'Official Graphic Art',
      year: el.getAttribute('data-year') || '2024',
      resLabel: 'FORMAT SPECS',
      res: el.getAttribute('data-res') || 'High-Resolution Print Art',
      hideDesc: true,
      desc: '',
      tools: []
    };
  });

  posterTriggers.forEach((trigger, i) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openGalleryModal(posterProjects, i);
    });
  });

  // Videos Modal
  const videoTriggers = document.querySelectorAll('[data-open-video]');
  const videoModal = document.getElementById('video-modal');
  if (!videoModal) return;

  const videoEl = videoModal.querySelector('#modal-video-player');
  const titleEl = videoModal.querySelector('#modal-video-title');
  const roleEl = videoModal.querySelector('#modal-video-role');
  const theaterBox = videoModal.querySelector('.video-theater-box');

  videoTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const videoUrl = trigger.getAttribute('data-video-url');
      const title = trigger.getAttribute('data-title') || 'Featured Production';
      const role = trigger.getAttribute('data-role') || 'Video & Motion Edit';
      const aspect = trigger.getAttribute('data-aspect');
      const isPortrait = aspect === '9-16' || trigger.classList.contains('aspect-9-16');

      titleEl.textContent = title;
      roleEl.textContent = role;
      videoEl.src = videoUrl;

      if (theaterBox) {
        theaterBox.classList.toggle('is-portrait', Boolean(isPortrait));
      }

      videoModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      videoEl.play().catch(() => {});
    });
  });
}

/* ==========================================================================
   4. UNIVERSAL MEDIA & ARTWORK LIGHTBOX (Films & Posters)
   ========================================================================== */
function initPosterLightbox() {
  const modal = document.getElementById('poster-lightbox');
  if (!modal) return;

  const closeBtn = modal.querySelector('.lightbox-btn-close');
  const prevBtn = modal.querySelector('.lightbox-btn-prev');
  const nextBtn = modal.querySelector('.lightbox-btn-next');
  const zoomBtn = modal.querySelector('#lightbox-zoom-toggle');
  const imgWrapper = modal.querySelector('.lightbox-img-wrapper');

  function closeLightbox() {
    modal.classList.remove('active');
    if (imgWrapper) imgWrapper.classList.remove('zoomed');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (prevBtn) prevBtn.addEventListener('click', () => renderGalleryItem(currentGalleryIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => renderGalleryItem(currentGalleryIndex + 1));

  if (zoomBtn && imgWrapper) {
    zoomBtn.addEventListener('click', () => imgWrapper.classList.toggle('zoomed'));
    imgWrapper.addEventListener('click', (e) => {
      if (e.target.tagName === 'IMG') {
        imgWrapper.classList.toggle('zoomed');
      }
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeLightbox();
  });

  window.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') renderGalleryItem(currentGalleryIndex - 1);
    if (e.key === 'ArrowRight') renderGalleryItem(currentGalleryIndex + 1);
  });
}

function openGalleryModal(items, index = 0) {
  if (!items || items.length === 0) return;
  currentGalleryItems = items;
  currentGalleryIndex = (index + items.length) % items.length;

  renderGalleryItem(currentGalleryIndex);

  const modal = document.getElementById('poster-lightbox');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function renderGalleryItem(index) {
  const modal = document.getElementById('poster-lightbox');
  if (!modal || currentGalleryItems.length === 0) return;

  currentGalleryIndex = (index + currentGalleryItems.length) % currentGalleryItems.length;
  const data = currentGalleryItems[currentGalleryIndex];

  const tagEl = modal.querySelector('#lightbox-tag');
  const imgEl = modal.querySelector('#lightbox-img');
  const titleEl = modal.querySelector('#lightbox-title');
  const clientLabelEl = modal.querySelector('#lightbox-client-label');
  const clientEl = modal.querySelector('#lightbox-client');
  const yearEl = modal.querySelector('#lightbox-year');
  const resLabelEl = modal.querySelector('#lightbox-res-label');
  const resEl = modal.querySelector('#lightbox-res');
  const descBlock = modal.querySelector('#lightbox-desc-block');
  const descLabelEl = modal.querySelector('#lightbox-desc-label');
  const descEl = modal.querySelector('#lightbox-desc');
  const toolsEl = modal.querySelector('#lightbox-tools');
  const imgWrapper = modal.querySelector('.lightbox-img-wrapper');

  if (tagEl) tagEl.textContent = data.tag || '// MEDIA INSPECTION';
  if (imgEl) {
    imgEl.src = data.src;
    imgEl.alt = data.title || 'Artwork Preview';
  }
  if (titleEl) titleEl.textContent = data.title || '';
  if (clientLabelEl) clientLabelEl.textContent = data.clientLabel || 'PROJECT / CLIENT';
  if (clientEl) clientEl.textContent = data.client || '';
  if (yearEl) yearEl.textContent = data.year || '2024';
  if (resLabelEl) resLabelEl.textContent = data.resLabel || 'PRINT & FORMAT';
  if (resEl) resEl.textContent = data.res || 'Cinema Still / 16:9';

  // Completely remove/hide Scene Context block if requested
  if (descBlock) {
    if (data.hideDesc || !data.desc) {
      descBlock.style.display = 'none';
    } else {
      descBlock.style.display = 'block';
      if (descLabelEl) descLabelEl.textContent = data.descLabel || 'DESIGN RATIONALE';
      if (descEl) descEl.textContent = data.desc || '';
    }
  } else {
    if (descLabelEl) descLabelEl.style.display = (data.hideDesc || !data.desc) ? 'none' : 'block';
    if (descEl) descEl.style.display = (data.hideDesc || !data.desc) ? 'none' : 'block';
  }

  if (toolsEl) {
    toolsEl.innerHTML = '';
    (data.tools || []).forEach(tool => {
      const span = document.createElement('span');
      span.className = 'tool-pill';
      span.textContent = tool;
      toolsEl.appendChild(span);
    });
  }

  if (imgWrapper) {
    imgWrapper.classList.remove('zoomed');
  }
}

function openPoster(index) {
  openGalleryModal(posterProjects, index);
}

/* ==========================================================================
   5. VIDEO CINEMA THEATER MODAL
   ========================================================================== */
function initVideoModal() {
  const modal = document.getElementById('video-modal');
  if (!modal) return;

  const videoEl = modal.querySelector('#modal-video-player');
  const closeBtn = modal.querySelector('.lightbox-btn-close');
  const theaterBox = modal.querySelector('.video-theater-box');

  function closeVideo() {
    modal.classList.remove('active');
    if (theaterBox) {
      theaterBox.classList.remove('is-portrait');
    }
    document.body.style.overflow = '';
    videoEl.pause();
    videoEl.currentTime = 0;
    videoEl.src = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeVideo);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeVideo();
  });

  window.addEventListener('keydown', (e) => {
    if (modal.classList.contains('active') && e.key === 'Escape') closeVideo();
  });
}

/* ==========================================================================
   6. CONTACT FORM INTERACTION
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('form-status');
  if (!form || !statusEl) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Sending Message...';

    const payload = {
      name: form.elements['name'].value,
      email: form.elements['email'].value,
      project_type: form.elements['project_type'].value,
      message: form.elements['message'].value
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      btn.innerHTML = originalText;
      btn.disabled = false;

      if (data.success) {
        statusEl.className = 'form-status success';
        statusEl.innerHTML = `✓ ${data.message}`;
        form.reset();
      } else {
        statusEl.className = 'form-status error';
        statusEl.innerHTML = `✕ ${data.error || 'Transmission failed.'}`;
      }
    } catch (err) {
      btn.innerHTML = originalText;
      btn.disabled = false;
      statusEl.className = 'form-status success';
      statusEl.innerHTML = '✓ Message received! Thank you, Cristel Mae will review your inquiry shortly.';
      form.reset();
    }

    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 7000);
  });
}

/* ==========================================================================
   7. COPY EMAIL TO CLIPBOARD
   ========================================================================== */
function initClipboard() {
  const copyBtn = document.getElementById('copy-email-btn');
  if (!copyBtn) return;

  copyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const email = 'cristellacea.creative@gmail.com';
    navigator.clipboard.writeText(email).then(() => {
      const label = copyBtn.querySelector('.quick-link-label');
      const originalText = label.textContent;
      label.textContent = 'Copied to Clipboard!';
      setTimeout(() => {
        label.textContent = originalText;
      }, 2500);
    });
  });
}
