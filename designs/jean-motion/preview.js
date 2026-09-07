(function () {
  'use strict';
  const manifest = window.JEAN_MANIFEST;
  const { ClipPlayer, clamp } = window.JeanMotion;
  const player = new ClipPlayer(manifest.animations);
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const stage = $('#main-stage'), pet = $('#pet'), sprite = pet.querySelector('.sprite');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const actionNames = {
    idle: ['Idle', '待机'], sit: ['Sit', '坐下'], happy: ['Happy', '开心'],
    curious: ['Curious', '好奇'], excited: ['Excited', '兴奋'], sniff: ['Sniff', '闻嗅'],
    look: ['Look', '观察'], drag: ['Drag', '被拖动'], sleep: ['Sleep', '小睡']
  };
  let size = 240, position = { x: 0, y: 0 }, bounds = { width: 0, height: 0 };
  let ready = false, pointer = null, raf = null, previousTime = null, rendered = '', lastAction = '';
  let hasMoved = false, suppressClick = false;

  function renderSprite(element, action, frame) {
    const clip = manifest.animations[action];
    const col = frame % clip.columns, row = Math.floor(frame / clip.columns);
    element.style.backgroundImage = `url("${clip.src}")`;
    element.style.backgroundSize = `${clip.columns * 100}% ${clip.rows * 100}%`;
    element.style.backgroundPosition = `${clip.columns === 1 ? 0 : col / (clip.columns - 1) * 100}% ${clip.rows === 1 ? 0 : row / (clip.rows - 1) * 100}%`;
    element.dataset.action = action;
    element.dataset.frame = String(frame);
  }

  function rebuildFilmstrip(action) {
    const strip = $('#filmstrip');
    strip.replaceChildren();
    for (let frame = 0; frame < manifest.animations[action].frameCount; frame++) {
      const button = document.createElement('button');
      button.type = 'button'; button.setAttribute('aria-label', `查看第 ${frame + 1} 帧`);
      button.dataset.frame = frame;
      const image = document.createElement('span'); image.className = 'sprite'; image.setAttribute('aria-hidden', 'true');
      renderSprite(image, action, frame);
      const number = document.createElement('small'); number.textContent = String(frame + 1).padStart(2, '0');
      button.append(image, number);
      button.addEventListener('click', () => seek(frame));
      strip.append(button);
    }
  }

  function render(force = false) {
    const state = player.tick(0);
    const clip = manifest.animations[state.action];
    const key = `${state.action}:${state.frame}`;
    if (!force && rendered === key) return;
    rendered = key;
    renderSprite(sprite, state.action, state.frame);
    $$('.mini').forEach((element) => renderSprite(element, state.action, state.frame));
    if (lastAction !== state.action || force) {
      const [english, chinese] = actionNames[state.action];
      $('#state-label').textContent = `${english} / ${chinese}`;
      $('#clip-title').textContent = `${english} / ${chinese}`;
      const duration = clip.durations.reduce((sum, value) => sum + value, 0);
      $('#clip-spec').textContent = `${clip.frameCount} 张关键帧 · ${(duration / 1000).toFixed(1)} 秒 / 轮`;
      $('#download').href = clip.src;
      $('#frame').max = clip.frameCount - 1;
      $$('.action-list button[data-action]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.action === state.action)));
      rebuildFilmstrip(state.action);
      lastAction = state.action;
    }
    $('#frame').value = state.frame;
    $('#frame-label').value = `${String(state.frame + 1).padStart(2, '0')} / ${String(clip.frameCount).padStart(2, '0')}`;
    $$('#filmstrip button').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.frame) === state.frame)));
    pet.dataset.action = state.action;
    pet.dataset.frame = state.frame;
  }

  function updatePlayControl() {
    $('#play').textContent = player.playing ? '暂停动画' : '播放动画';
    $('#play').setAttribute('aria-pressed', String(player.playing));
  }
  function stopLoop() { if (raf !== null) cancelAnimationFrame(raf); raf = null; previousTime = null; }
  function animate(time) {
    raf = null;
    if (!ready || document.hidden || !player.playing) { previousTime = null; return; }
    const delta = previousTime === null ? 0 : time - previousTime;
    previousTime = time;
    player.tick(delta); render();
    raf = requestAnimationFrame(animate);
  }
  function startLoop() { if (ready && player.playing && !document.hidden && raf === null) { previousTime = null; raf = requestAnimationFrame(animate); } }
  function selectAction(action, loop = true, source = 'control') {
    if (!ready) return;
    player.select(action, loop);
    player.playing = !reduced.matches;
    stopLoop(); render(true); updatePlayControl(); startLoop();
    $('#interaction-note').textContent = source === 'pointer' ? '松开后开心一下，再回到待机' : source === 'click' ? 'Jean 收到你的招呼了' : `${actionNames[action][0]} 循环预览`;
  }
  function seek(frame) { if (!ready) return; player.seek(frame); stopLoop(); render(); updatePlayControl(); }

  function placePet() {
    position.x = clamp(position.x, 8, Math.max(8, bounds.width - size - 8));
    position.y = clamp(position.y, 8, Math.max(8, bounds.height - size - 8));
    pet.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
  }
  function measure(center = false) {
    bounds = { width: stage.clientWidth, height: stage.clientHeight };
    if (center || !hasMoved) position = { x: (bounds.width - size) / 2, y: bounds.height * 0.77 - size * 0.9 };
    placePet();
  }
  function setSize(next) {
    cancelPointer();
    const center = { x: position.x + size / 2, y: position.y + size / 2 };
    size = next; pet.style.setProperty('--pet-size', `${size}px`);
    position = { x: center.x - size / 2, y: center.y - size / 2 };
    measure();
    $$('[data-size]').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.size) === size)));
  }
  function cancelPointer() {
    if (!pointer) return;
    const active = pointer; pointer = null;
    pet.classList.remove('is-dragging');
    if (pet.hasPointerCapture(active.id)) pet.releasePointerCapture(active.id);
    if (active.dragging) selectAction('idle');
  }

  pet.addEventListener('pointerdown', (event) => {
    if (!ready || pointer || !event.isPrimary || event.button !== 0) return;
    suppressClick = false;
    pointer = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x: position.x, y: position.y, dragging: false };
    pet.setPointerCapture(event.pointerId);
  });
  pet.addEventListener('pointermove', (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.startX, dy = event.clientY - pointer.startY;
    if (!pointer.dragging && Math.hypot(dx, dy) >= 8) {
      pointer.dragging = true; hasMoved = true; pet.classList.add('is-dragging');
      selectAction('drag', true, 'pointer');
    }
    if (!pointer.dragging) return;
    position.x = pointer.x + dx; position.y = pointer.y + dy;
    placePet();
  });
  pet.addEventListener('pointerup', (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dragged = pointer.dragging;
    pointer = null; suppressClick = true;
    pet.classList.remove('is-dragging');
    if (pet.hasPointerCapture(event.pointerId)) pet.releasePointerCapture(event.pointerId);
    selectAction('happy', false, 'click');
    $('#interaction-note').textContent = dragged ? '轻轻放下，Jean 开心地摇了摇尾巴' : 'Jean 收到你的招呼了';
  });
  pet.addEventListener('pointercancel', () => { suppressClick = true; cancelPointer(); });
  pet.addEventListener('lostpointercapture', () => { if (pointer) { suppressClick = true; cancelPointer(); } });
  pet.addEventListener('click', (event) => {
    if (event.detail === 0) { selectAction('happy', false, 'click'); return; }
    if (suppressClick) { suppressClick = false; return; }
    selectAction('happy', false, 'click');
  });
  pet.addEventListener('keydown', (event) => {
    const vectors = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (vectors[event.key]) {
      event.preventDefault(); const [x, y] = vectors[event.key];
      hasMoved = true; position.x += x * 12; position.y += y * 12; placePet();
      if (player.action !== 'drag') selectAction('drag');
    } else if (event.key === 'Escape') { cancelPointer(); selectAction('idle'); }
  });
  pet.addEventListener('keyup', (event) => { if (event.key.startsWith('Arrow')) selectAction('happy', false); });
  window.addEventListener('blur', cancelPointer);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelPointer(); stopLoop(); } else startLoop(); });
  reduced.addEventListener('change', () => { player.playing = !reduced.matches; stopLoop(); updatePlayControl(); updateMotionNote(); startLoop(); });

  $$('.action-list button[data-action]').forEach((button) => button.addEventListener('click', () => { cancelPointer(); selectAction(button.dataset.action); }));
  $$('[data-size]').forEach((button) => button.addEventListener('click', () => setSize(Number(button.dataset.size))));
  $$('.swatch').forEach((button) => button.addEventListener('click', () => {
    stage.dataset.background = button.dataset.background;
    $$('.swatch').forEach((swatch) => swatch.setAttribute('aria-pressed', String(swatch === button)));
  }));
  $('#speed').addEventListener('change', (event) => { player.speed = Number(event.target.value); });
  $('#play').addEventListener('click', () => { if (!ready) return; player.playing = !player.playing; stopLoop(); updatePlayControl(); startLoop(); });
  $('#replay').addEventListener('click', () => selectAction(player.action));
  $('#frame').addEventListener('input', (event) => seek(Number(event.target.value)));
  $('#reset').addEventListener('click', () => { cancelPointer(); hasMoved = false; measure(true); selectAction('idle'); $('#interaction-note').textContent = '回到这里，继续陪你'; });
  const observer = new ResizeObserver(() => { cancelPointer(); measure(); });
  observer.observe(stage);
  function updateMotionNote() {
    $('#motion-note').textContent = reduced.matches ? '已遵循系统减少动画设置。仍可逐帧查看，或主动点击「播放动画」预览。' : '动作按钮循环预览；点 Jean 播放一次开心，结束后回到待机。';
  }
  $$('.mini').forEach((element) => { element.style.width = element.style.height = `${element.dataset.proofSize}px`; });
  const loads = Object.values(manifest.animations).map((clip) => new Promise((resolve, reject) => {
    const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error(clip.src)); image.src = clip.src;
  }));
  Promise.all(loads).then(() => {
    ready = true; pet.disabled = false; pet.classList.add('is-ready'); $('#loading').hidden = true;
    measure(true); updateMotionNote(); selectAction('idle'); $('#interaction-note').textContent = '也可以聚焦 Jean，用方向键移动';
  }).catch((error) => {
    $('#loading').textContent = '素材没有加载成功，请刷新页面重试。';
    $('#state-label').textContent = '素材加载失败'; $('#interaction-note').textContent = error.message;
  });
  window.addEventListener('pagehide', () => { cancelPointer(); stopLoop(); observer.disconnect(); });
  window.addEventListener('pageshow', (event) => { if (event.persisted) { observer.observe(stage); measure(); startLoop(); } });
})();
