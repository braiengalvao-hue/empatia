const mapCanvas = document.getElementById('map-canvas');
const mapViewport = document.getElementById('map-viewport');
const mapStage = document.getElementById('map-stage');
const drawCanvas = document.getElementById('draw-canvas');
const drawStage = document.getElementById('draw-stage');
const modalDraw = document.getElementById('draw-modal');
const toggleDrawFullscreenBtn = document.getElementById('toggle-draw-fullscreen');
const modalFlower = document.getElementById('flower-modal');
const modalRanking = document.getElementById('ranking-modal');
const toast = document.getElementById('toast');
const rankingButton = document.getElementById('ranking-button');
const toggleRainButton = document.getElementById('toggle-rain');
const consentModal = document.getElementById('consent-modal');
const acceptTermsButton = document.getElementById('accept-terms');
const rejectTermsButton = document.getElementById('reject-terms');
const mapHint = document.getElementById('map-hint');
const phraseVotes = document.getElementById('phrase-votes');
const drawingVotes = document.getElementById('drawing-votes');
const flowerImage = document.getElementById('modal-flower-image');
const flowerAuthor = document.getElementById('modal-flower-author');
const flowerPhrase = document.getElementById('modal-flower-phrase');
const flowerNote = document.getElementById('modal-flower-note');
const phraseRankContainer = document.getElementById('phrase-rank');
const drawingRankContainer = document.getElementById('drawing-rank');
const generalRankContainer = document.getElementById('general-rank');
const tabButtons = Array.from(document.querySelectorAll('.tab-button'));

const ctx = mapCanvas.getContext('2d');
const drawCtx = drawCanvas.getContext('2d');

const userEntry = window.USER_ENTRY || {};
const mapEntries = window.FLOWER_ENTRIES || [];
const rankings = window.RANKINGS || { phrase: [], drawing: [], general: [] };
const userId = window.ENTRY_ID;
const ratedVotes = window.RATED_VOTES || {};
const minFlowerDistance = window.FLOWER_MIN_DISTANCE || 80;

const FLOWER_PETAL_COLORS = [
    '#f47d8b', '#f9b3c0', '#f8d57e', '#a7d37d',
    '#a0d6f1', '#d3a8f5', '#d78f6a', '#ff9fa6',
];

const OWN_FLOWER_COLORS = ['#d85187', '#f47d8b', '#ff9fa6'];

let hasConsent = sessionStorage.getItem('sentimentConsent') === 'true';
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const world = {
    width: window.WORLD_WIDTH || 3000,
    height: window.WORLD_HEIGHT || 3000,
    clickRadius: 80,
};

let isRaining = false;
let rainTimer = null;
let petalTimer = null;
let selectedLocation = null;
let isPainting = false;
let activeDrawPointerId = null;
let lastPaint = { x: 0, y: 0 };
let drawLocked = Boolean(userEntry.drawing_data);
let drawFullscreen = false;
const drawPointerOpts = { passive: false };
let hoveredFlowerId = null;

const pan = { x: 0, y: 0 };
let dragPointer = null;
let dragMoved = false;

function initializeCanvas() {
    mapCanvas.width = world.width;
    mapCanvas.height = world.height;
    mapCanvas.style.width = '300vw';
    mapCanvas.style.height = '300vh';
    drawCanvas.style.width = '100%';
    drawCanvas.style.height = '100%';
    drawCtx.lineJoin = 'round';
    drawCtx.lineCap = 'round';
    drawCtx.strokeStyle = '#d94f7f';
    drawCtx.lineWidth = 6;
    clearDrawCanvas();
    centerMapView();
}

function centerMapView() {
    if (!mapViewport || !mapStage) return;
    const viewportW = mapViewport.clientWidth;
    const viewportH = mapViewport.clientHeight;
    const stageW = mapCanvas.offsetWidth;
    const stageH = mapCanvas.offsetHeight;
    pan.x = Math.min(0, (viewportW - stageW) / 2);
    pan.y = Math.min(0, (viewportH - stageH) / 2);
    applyPan();
}

function applyPan() {
    if (mapStage) {
        mapStage.style.transform = `translate(${pan.x}px, ${pan.y}px)`;
    }
}

function clampPan() {
    if (!mapViewport) return;
    const viewportW = mapViewport.clientWidth;
    const viewportH = mapViewport.clientHeight;
    const stageW = mapCanvas.offsetWidth;
    const stageH = mapCanvas.offsetHeight;
    const minX = Math.min(0, viewportW - stageW);
    const minY = Math.min(0, viewportH - stageH);
    pan.x = Math.max(minX, Math.min(0, pan.x));
    pan.y = Math.max(minY, Math.min(0, pan.y));
    applyPan();
}

function flowerColorsForEntry(entry) {
    const ownId = userEntry.id ?? userId;
    if (entry.id === ownId) {
        return OWN_FLOWER_COLORS;
    }
    const i = Number(entry.id) || 0;
    return [
        FLOWER_PETAL_COLORS[i % FLOWER_PETAL_COLORS.length],
        FLOWER_PETAL_COLORS[(i + 2) % FLOWER_PETAL_COLORS.length],
        FLOWER_PETAL_COLORS[(i + 5) % FLOWER_PETAL_COLORS.length],
    ];
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, world.width, world.height);
    gradient.addColorStop(0, '#ffefdb');
    gradient.addColorStop(0.5, '#f9e3e3');
    gradient.addColorStop(1, '#e8f5e9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, world.width, world.height);
    ctx.strokeStyle = 'rgba(77, 110, 79, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= world.width; x += 300) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, world.height);
        ctx.stroke();
    }
    for (let y = 0; y <= world.height; y += 300) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(world.width, y);
        ctx.stroke();
    }
}

function drawOrganicFlower(entry, highlight) {
    const centerX = entry.location_x;
    const centerY = entry.location_y;
    const isHover = hoveredFlowerId === entry.id;
    const scale = (highlight ? 1.12 : 1) * (isHover ? 1.08 : 1);
    const petalColors = flowerColorsForEntry(entry);
    const petalCount = 6;
    const petalSize = 13 * scale;

    ctx.save();
    ctx.translate(centerX, centerY);
    if (highlight || isHover) {
        ctx.shadowColor = 'rgba(255, 255, 255, 0.55)';
        ctx.shadowBlur = isHover ? 26 : 18;
    }

    for (let i = 0; i < petalCount; i += 1) {
        const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
        ctx.save();
        ctx.rotate(angle);
        ctx.fillStyle = petalColors[i % petalColors.length];
        ctx.beginPath();
        ctx.ellipse(0, -petalSize * 0.95, petalSize * 0.5, petalSize * 1.05, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(0, 0, petalSize * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = '#fffef8';
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.font = `${isHover ? 20 : 18}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(entry.name, centerX, centerY + 52 + (isHover ? 4 : 0));
}

function drawMap() {
    drawBackground();
    if (selectedLocation && !drawLocked) {
        const tooClose = isTooCloseToOtherFlower(selectedLocation.x, selectedLocation.y);
        ctx.strokeStyle = tooClose ? '#b21233' : '#d94f7f';
        ctx.lineWidth = 6;
        ctx.setLineDash(tooClose ? [12, 8] : []);
        ctx.beginPath();
        ctx.arc(selectedLocation.x, selectedLocation.y, 70, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    const ownId = userEntry.id ?? userId;
    mapEntries
        .filter((entry) => entry.id !== ownId)
        .forEach((entry) => drawOrganicFlower(entry, false));
    if (
        userEntry.location_x != null
        && userEntry.location_y != null
        && userEntry.drawing_data
    ) {
        drawOrganicFlower(userEntry, true);
    }
}

function getCanvasCoord(event) {
    const rect = mapCanvas.getBoundingClientRect();
    return {
        x: ((event.clientX - rect.left) * world.width) / rect.width,
        y: ((event.clientY - rect.top) * world.height) / rect.height,
    };
}

function getClickableEntries() {
    const ownId = userEntry.id ?? userId;
    const list = mapEntries.filter((entry) => entry.id !== ownId);
    if (
        userEntry.location_x != null
        && userEntry.location_y != null
        && userEntry.drawing_data
    ) {
        list.push(userEntry);
    }
    return list;
}

function findFlowerAt(position) {
    return getClickableEntries().find((entry) => {
        const dx = entry.location_x - position.x;
        const dy = entry.location_y - position.y;
        return Math.hypot(dx, dy) < world.clickRadius;
    });
}

function isTooCloseToOtherFlower(x, y) {
    const ownId = userEntry.id ?? userId;
    return getClickableEntries().some((entry) => {
        if (entry.id === ownId) return false;
        const dx = entry.location_x - x;
        const dy = entry.location_y - y;
        return Math.hypot(dx, dy) < minFlowerDistance;
    });
}

function clearDrawCanvas() {
    drawCtx.fillStyle = '#fff4f8';
    drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
    drawCtx.globalCompositeOperation = 'source-over';
}

function showConsentModal() {
    consentModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
}

function hideConsentModal() {
    consentModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
}

function acceptConsent() {
    hasConsent = true;
    sessionStorage.setItem('sentimentConsent', 'true');
    hideConsentModal();
    showToast('Compromisso aceito. Agora você pode ver e criar.');
}

function rejectConsent() {
    window.location.href = 'index.php';
}

function createPetal() {
    const drop = document.createElement('div');
    drop.className = 'petal-drop';
    drop.style.left = `${Math.random() * 100}vw`;
    drop.style.animationDuration = `${Math.random() * 3 + 4}s`;
    drop.style.opacity = `${Math.random() * 0.35 + 0.55}`;
    document.body.appendChild(drop);
    drop.addEventListener('animationend', () => drop.remove());
}

function startPetalFlow() {
    if (prefersReducedMotion) return;
    createPetal();
    petalTimer = setInterval(createPetal, 420);
}

function isDrawModalOpen() {
    return modalDraw && !modalDraw.classList.contains('hidden');
}

function setDrawingMode(active) {
    document.body.classList.toggle('drawing-mode', active);
    if (mapViewport) {
        mapViewport.style.pointerEvents = active ? 'none' : '';
    }
}

function setDrawFullscreen(enabled) {
    drawFullscreen = enabled;
    modalDraw.classList.toggle('draw-fullscreen', enabled);
    document.body.classList.toggle('draw-fs-active', enabled && isDrawModalOpen());
    if (toggleDrawFullscreenBtn) {
        toggleDrawFullscreenBtn.textContent = enabled ? 'Sair da tela cheia' : 'Tela cheia';
        toggleDrawFullscreenBtn.setAttribute('aria-pressed', String(enabled));
    }
    if (!enabled && isDrawModalOpen()) {
        requestAnimationFrame(() => {
            modalDraw.scrollTop = 0;
            const controls = document.querySelector('#draw-modal .draw-controls');
            controls?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
    }
}

function teardownDrawSession() {
    isPainting = false;
    activeDrawPointerId = null;
    setDrawFullscreen(false);
    setDrawingMode(false);
    document.body.classList.remove('draw-fs-active');
}

function openModal(modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
}

function closeModal(modal) {
    if (modal === modalDraw) {
        teardownDrawSession();
    }
    modal.classList.add('hidden');
    if (!document.querySelector('.modal:not(.hidden)')) {
        document.body.classList.remove('modal-open');
    }
}

function openDrawModal() {
    if (!hasConsent) {
        showToast('Aceite o compromisso antes de criar sua plantação.');
        return;
    }
    if (drawLocked) return;
    clearDrawCanvas();
    openModal(modalDraw);
    setDrawingMode(true);
    setDrawFullscreen(true);
    mapHint.textContent = 'Modo desenho ativo. Use tela cheia e a caneta na área branca.';
}

function markVoteButtons(entryId, category, score) {
    const key = `${entryId}_${category}`;
    ratedVotes[key] = true;
    document.querySelectorAll(`.vote-button[data-entry-id="${entryId}"][data-category="${category}"]`).forEach((btn) => {
        const btnScore = parseInt(btn.dataset.score, 10);
        if (btnScore === score) {
            btn.classList.add('voted');
        }
        btn.disabled = true;
    });
}

function createVoteButtons(entryId, category, container) {
    const key = `${entryId}_${category}`;
    const alreadyVoted = Boolean(ratedVotes[key]);

    for (let i = 1; i <= 5; i += 1) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'vote-button';
        button.textContent = i;
        button.dataset.entryId = entryId;
        button.dataset.category = category;
        button.dataset.score = i;
        if (alreadyVoted) {
            button.disabled = true;
            button.classList.add('voted');
        } else {
            button.addEventListener('click', () => submitVote(entryId, category, i, button));
        }
        container.appendChild(button);
    }
}

function openFlowerModal(entry) {
    flowerAuthor.textContent = entry.name;
    flowerPhrase.textContent = `"${entry.phrase}"`;
    flowerImage.src = entry.drawing_data || '';
    flowerImage.alt = `Desenho de ${entry.name}`;
    flowerImage.style.display = entry.drawing_data ? 'block' : 'none';
    const ownId = userEntry.id ?? userId;
    flowerNote.textContent = entry.id === ownId
        ? 'Esta é sua plantação do amor. Você não pode avaliar sua própria criação.'
        : 'Avalie esta plantação em frase e desenho (uma nota por categoria).';
    phraseVotes.innerHTML = '';
    drawingVotes.innerHTML = '';
    if (entry.id !== ownId) {
        createVoteButtons(entry.id, 'phrase', phraseVotes);
        createVoteButtons(entry.id, 'drawing', drawingVotes);
    }
    openModal(modalFlower);
}

function updateRankingPanels() {
    const emptyMsg = '<p class="modal-copy">Ainda não há plantações no ranking.</p>';
    phraseRankContainer.innerHTML = rankings.phrase.length ? rankings.phrase.map((item, index) => `
        <article class="rank-card">
            <strong>${index + 1}. ${item.name}</strong>
            <span>Frase: ${item.avg_phrase}</span>
            <span>Votos: ${item.votes_phrase}</span>
            <p>${item.phrase}</p>
        </article>
    `).join('') : emptyMsg;
    drawingRankContainer.innerHTML = rankings.drawing.length ? rankings.drawing.map((item, index) => `
        <article class="rank-card">
            <strong>${index + 1}. ${item.name}</strong>
            <span>Desenho: ${item.avg_drawing}</span>
            <span>Votos: ${item.votes_drawing}</span>
            <p>${item.phrase}</p>
        </article>
    `).join('') : emptyMsg;
    generalRankContainer.innerHTML = rankings.general.length ? rankings.general.map((item, index) => `
        <article class="rank-card">
            <strong>${index + 1}. ${item.name}</strong>
            <span>Geral: ${item.avg_general}</span>
            <span>Frase: ${item.avg_phrase}</span>
            <span>Desenho: ${item.avg_drawing}</span>
            <p>${item.phrase}</p>
        </article>
    `).join('') : emptyMsg;
}

function openRankingModal() {
    if (!hasConsent) {
        showToast('Aceite o compromisso antes de ver os rankings.');
        return;
    }
    updateRankingPanels();
    openModal(modalRanking);
}

function submitVote(entryId, category, score, buttonEl) {
    if (ratedVotes[`${entryId}_${category}`]) {
        showToast('Você já avaliou esta categoria.');
        return;
    }
    const payload = new URLSearchParams({ entry_id: entryId, score, score_type: category });
    if (buttonEl) buttonEl.disabled = true;

    fetch('rate.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload.toString(),
    })
        .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
        .then(({ data }) => {
            if (!data || !data.success) {
                if (buttonEl) buttonEl.disabled = false;
                showToast((data && data.message) || 'Não foi possível enviar a nota.');
                return;
            }
            rankings.phrase = data.phraseRanking;
            rankings.drawing = data.drawingRanking;
            rankings.general = data.generalRanking;
            updateRankingPanels();
            markVoteButtons(entryId, category, score);
            showToast('Avaliação registrada!');
        })
        .catch(() => {
            if (buttonEl) buttonEl.disabled = false;
            showToast('Erro ao enviar avaliação.');
        });
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2500);
}

function onMapClick(event) {
    if (!hasConsent) {
        showToast('Aceite o compromisso antes de explorar o mapa.');
        return;
    }
    if (dragMoved) return;

    const position = getCanvasCoord(event);
    const clicked = findFlowerAt(position);
    if (clicked) {
        openFlowerModal(clicked);
        return;
    }
    if (drawLocked) {
        showToast('Você já plantou. Clique em uma flor para ver detalhes.');
        return;
    }
    if (isTooCloseToOtherFlower(position.x, position.y)) {
        showToast('Muito perto de outra plantação. Escolha um espaço com mais folga.');
        selectedLocation = position;
        drawMap();
        return;
    }
    selectedLocation = position;
    drawMap();
    openDrawModal();
}

function saveUserDrawing() {
    if (!userId) {
        showToast('Sessão inválida. Volte ao início e entre novamente no jardim.');
        return;
    }
    if (!selectedLocation) {
        showToast('Selecione um local antes de desenhar.');
        return;
    }
    if (isTooCloseToOtherFlower(selectedLocation.x, selectedLocation.y)) {
        showToast('Este local está ocupado. Feche o modal e escolha outro ponto.');
        return;
    }

    const drawingData = drawCanvas.toDataURL('image/jpeg', 0.82);
    const payload = new URLSearchParams({
        entry_id: userId,
        loc_x: Math.round(selectedLocation.x),
        loc_y: Math.round(selectedLocation.y),
        drawing_data: drawingData,
    });

    fetch('save_entry.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload.toString(),
    })
        .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
        .then(({ ok, data }) => {
            if (!data || !data.success) {
                showToast((data && data.message) || (ok ? 'Não foi possível salvar o desenho.' : 'Erro no servidor ao salvar.'));
                return;
            }
            userEntry.id = userEntry.id ?? userId;
            userEntry.drawing_data = drawingData;
            userEntry.location_x = Math.round(selectedLocation.x);
            userEntry.location_y = Math.round(selectedLocation.y);
            drawLocked = true;
            teardownDrawSession();
            modalDraw.classList.add('hidden');
            document.body.classList.remove('modal-open');
            drawMap();
            mapHint.textContent = 'Sua plantação está no mapa. Arraste para explorar e clique nas flores.';
            showToast('Sua plantação foi salva. Agora ela vive no mapa!');
        })
        .catch(() => showToast('Erro ao salvar a plantação.'));
}

function toggleRain() {
    if (prefersReducedMotion) {
        showToast('Animação de chuva desativada nas preferências de movimento reduzido.');
        return;
    }
    isRaining = !isRaining;
    toggleRainButton.setAttribute('aria-pressed', String(isRaining));
    if (isRaining) {
        toggleRainButton.textContent = 'Parar chuva';
        rainTimer = setInterval(() => {
            const drop = document.createElement('div');
            drop.className = 'rain-drop';
            drop.style.left = `${Math.random() * window.innerWidth}px`;
            document.body.appendChild(drop);
            const duration = Math.random() * 1200 + 1200;
            drop.animate([
                { transform: 'translateY(0)', opacity: 0.95 },
                { transform: `translateY(${window.innerHeight + 100}px)`, opacity: 0 },
            ], { duration, easing: 'linear' }).onfinish = () => drop.remove();
        }, 180);
    } else {
        toggleRainButton.textContent = 'Chover no Jardim';
        clearInterval(rainTimer);
        rainTimer = null;
        document.querySelectorAll('.rain-drop').forEach((drop) => drop.remove());
    }
}

function isDrawPointerAllowed(event) {
    if (event.pointerType === 'touch') {
        return false;
    }
    if (event.pointerType === 'mouse' && event.button !== 0) {
        return false;
    }
    return true;
}

function getDrawCoords(event) {
    const rect = drawCanvas.getBoundingClientRect();
    const scaleX = drawCanvas.width / rect.width;
    const scaleY = drawCanvas.height / rect.height;
    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
    };
}

function paintLineTo(x, y) {
    drawCtx.lineWidth = 6;
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';
    drawCtx.beginPath();
    drawCtx.moveTo(lastPaint.x, lastPaint.y);
    drawCtx.lineTo(x, y);
    drawCtx.stroke();
    lastPaint = { x, y };
}

function handleDrawingStart(event) {
    if (drawLocked || !isDrawModalOpen()) return;
    if (!isDrawPointerAllowed(event)) {
        event.preventDefault();
        return;
    }
    if (activeDrawPointerId !== null) return;

    event.preventDefault();
    event.stopPropagation();

    activeDrawPointerId = event.pointerId;
    isPainting = true;
    const captureTarget = drawStage || drawCanvas;
    captureTarget.setPointerCapture(event.pointerId);

    const coords = getDrawCoords(event);
    lastPaint = coords;
    drawCtx.beginPath();
    drawCtx.moveTo(coords.x, coords.y);
}

function handleDrawingMove(event) {
    if (!isDrawModalOpen()) return;
    if (activeDrawPointerId !== event.pointerId) return;
    if (!isPainting || drawLocked) return;

    event.preventDefault();
    event.stopPropagation();

    const events = typeof event.getCoalescedEvents === 'function'
        ? event.getCoalescedEvents()
        : [event];

    events.forEach((coalesced) => {
        const { x, y } = getDrawCoords(coalesced);
        paintLineTo(x, y);
    });
}

function handleDrawingEnd(event) {
    if (activeDrawPointerId !== event.pointerId) return;

    event.preventDefault();
    event.stopPropagation();

    isPainting = false;
    activeDrawPointerId = null;
    const captureTarget = drawStage || drawCanvas;
    if (captureTarget.hasPointerCapture(event.pointerId)) {
        captureTarget.releasePointerCapture(event.pointerId);
    }
}

function handleDrawLostPointer() {
    isPainting = false;
    activeDrawPointerId = null;
}

function onMapPointerDown(event) {
    if (isDrawModalOpen()) return;
    if (!mapViewport || event.button !== 0) return;
    dragPointer = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    dragMoved = false;
    mapViewport.classList.add('is-dragging');
    mapViewport.setPointerCapture(event.pointerId);
}

function onMapPointerMove(event) {
    if (isDrawModalOpen()) return;
    if (!dragPointer) {
        if (hasConsent) {
            const position = getCanvasCoord(event);
            const flower = findFlowerAt(position);
            const nextId = flower ? flower.id : null;
            if (nextId !== hoveredFlowerId) {
                hoveredFlowerId = nextId;
                drawMap();
            }
        }
        return;
    }
    const dx = event.clientX - dragPointer.x;
    const dy = event.clientY - dragPointer.y;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        dragMoved = true;
    }
    pan.x = dragPointer.panX + dx;
    pan.y = dragPointer.panY + dy;
    clampPan();
}

function onMapPointerUp(event) {
    if (isDrawModalOpen()) {
        if (dragPointer && mapViewport && mapViewport.hasPointerCapture(event.pointerId)) {
            mapViewport.releasePointerCapture(event.pointerId);
        }
        dragPointer = null;
        if (mapViewport) mapViewport.classList.remove('is-dragging');
        return;
    }
    if (dragPointer && mapViewport.hasPointerCapture(event.pointerId)) {
        mapViewport.releasePointerCapture(event.pointerId);
    }
    dragPointer = null;
    mapViewport.classList.remove('is-dragging');
    if (!dragMoved) {
        onMapClick(event);
    }
    setTimeout(() => { dragMoved = false; }, 0);
}

function setupMapNavigation() {
    if (!mapViewport) return;
    mapViewport.addEventListener('pointerdown', onMapPointerDown);
    mapViewport.addEventListener('pointermove', onMapPointerMove);
    mapViewport.addEventListener('pointerup', onMapPointerUp);
    mapViewport.addEventListener('pointercancel', onMapPointerUp);
    window.addEventListener('resize', () => {
        clampPan();
    });
}

function setupDrawListeners() {
    const surface = drawStage || drawCanvas;
    if (!surface) return;

    ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach((type) => {
        surface.addEventListener(type, {
            pointerdown: handleDrawingStart,
            pointermove: handleDrawingMove,
            pointerup: handleDrawingEnd,
            pointercancel: handleDrawingEnd,
        }[type], drawPointerOpts);
    });

    surface.addEventListener('lostpointercapture', handleDrawLostPointer);

    surface.addEventListener('wheel', (event) => {
        if (isDrawModalOpen()) event.preventDefault();
    }, drawPointerOpts);

    if (modalDraw) {
        modalDraw.addEventListener('touchmove', (event) => {
            if (isDrawModalOpen() && event.target.closest('.draw-stage')) {
                event.preventDefault();
            }
        }, drawPointerOpts);
    }
}

function setupEventListeners() {
    toggleRainButton.addEventListener('click', toggleRain);
    rankingButton.addEventListener('click', openRankingModal);
    acceptTermsButton.addEventListener('click', acceptConsent);
    rejectTermsButton.addEventListener('click', rejectConsent);
    document.querySelectorAll('[data-close]').forEach((button) => {
        button.addEventListener('click', () => button.closest('.modal') && closeModal(button.closest('.modal')));
    });
    setupDrawListeners();
    if (toggleDrawFullscreenBtn) {
        toggleDrawFullscreenBtn.addEventListener('click', () => {
            setDrawFullscreen(!drawFullscreen);
        });
    }
    document.getElementById('clear-draw').addEventListener('click', clearDrawCanvas);
    document.getElementById('save-draw').addEventListener('click', saveUserDrawing);
    tabButtons.forEach((button) => {
        button.addEventListener('click', () => {
            tabButtons.forEach((btn) => btn.classList.remove('active'));
            button.classList.add('active');
            document.querySelectorAll('.tab-content').forEach((tab) => tab.classList.add('hidden'));
            document.getElementById(`${button.dataset.tab}-rank`).classList.remove('hidden');
        });
    });
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        if (isDrawModalOpen() && drawFullscreen) {
            setDrawFullscreen(false);
            return;
        }
        document.querySelectorAll('.modal:not(.hidden)').forEach((modal) => closeModal(modal));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeCanvas();
    setupMapNavigation();
    setupEventListeners();
    updateRankingPanels();
    drawMap();
    if (!hasConsent) {
        showConsentModal();
    }
    startPetalFlow();
    if (!drawLocked) {
        mapHint.textContent = 'Arraste o mapa para explorar. Clique em um espaço livre para plantar.';
    } else {
        mapHint.textContent = 'Arraste o mapa. Clique numa flor para ver detalhes e avaliar.';
    }
});
