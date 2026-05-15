const mapCanvas = document.getElementById('map-canvas');
const drawCanvas = document.getElementById('draw-canvas');
const modalDraw = document.getElementById('draw-modal');
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

let hasConsent = sessionStorage.getItem('sentimentConsent') === 'true';

const world = {
    width: window.WORLD_WIDTH || 3000,
    height: window.WORLD_HEIGHT || 3000,
    clickRadius: 80,
};

let isRaining = false;
let rainTimer = null;
let selectedLocation = null;
let isPainting = false;
let lastPaint = { x: 0, y: 0 };
let drawLocked = Boolean(userEntry.drawing_data);

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

function drawHeart(x, y, size, fill) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size, size);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-0.5, -0.6, -1.2, 0.2, 0, 1);
    ctx.bezierCurveTo(1.2, 0.2, 0.5, -0.6, 0, 0);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
}

function drawFlowerOnMap(entry, highlight) {
    const centerX = entry.location_x;
    const centerY = entry.location_y;
    const baseColor = entry.id === userEntry.id ? '#d85187' : '#7c5a9a';
    const glow = highlight ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.14)';
    ctx.save();
    ctx.shadowColor = glow;
    ctx.shadowBlur = highlight ? 22 : 6;
    drawHeart(centerX, centerY, 28, baseColor);
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(entry.name, centerX, centerY + 52);
}

function drawMap() {
    drawBackground();
    if (selectedLocation && !drawLocked) {
        ctx.strokeStyle = '#d94f7f';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(selectedLocation.x, selectedLocation.y, 70, 0, Math.PI * 2);
        ctx.stroke();
    }
    const ownId = userEntry.id ?? userId;
    mapEntries
        .filter((entry) => entry.id !== ownId)
        .forEach((entry) => drawFlowerOnMap(entry, false));
    if (
        userEntry.location_x != null
        && userEntry.location_y != null
        && userEntry.drawing_data
    ) {
        drawFlowerOnMap(userEntry, true);
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
    createPetal();
    setInterval(createPetal, 420);
}

function openModal(modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
}

function closeModal(modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
}

function openDrawModal() {
    if (!hasConsent) {
        showToast('Aceite o compromisso antes de criar sua plantação.');
        return;
    }
    if (drawLocked) return;
    clearDrawCanvas();
    openModal(modalDraw);
    mapHint.textContent = 'Use o pincel para desenhar seu amor. Depois salve para fixar a plantação.';
}

function openFlowerModal(entry) {
    flowerAuthor.textContent = entry.name;
    flowerPhrase.textContent = `"${entry.phrase}"`;
    flowerImage.src = entry.drawing_data || '';
    flowerImage.alt = `Desenho de ${entry.name}`;
    if (!entry.drawing_data) {
        flowerImage.style.display = 'none';
    } else {
        flowerImage.style.display = 'block';
    }
    const ownId = userEntry.id ?? userId;
    flowerNote.textContent = entry.id === ownId ? 'Esta é sua plantação do amor. Você não pode avaliar sua própria criação.' : 'Avalie esta plantação em frase e desenho.';
    phraseVotes.innerHTML = '';
    drawingVotes.innerHTML = '';
    if (entry.id !== ownId) {
        createVoteButtons(entry.id, 'phrase', phraseVotes);
        createVoteButtons(entry.id, 'drawing', drawingVotes);
    }
    openModal(modalFlower);
}

function createVoteButtons(entryId, category, container) {
    for (let i = 1; i <= 5; i += 1) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'vote-button';
        button.textContent = i;
        button.dataset.entryId = entryId;
        button.dataset.category = category;
        button.dataset.score = i;
        button.addEventListener('click', () => submitVote(entryId, category, i));
        container.appendChild(button);
    }
}

function updateRankingPanels() {
    const renderList = (rows) => rows.map((item, index) => `
        <article class="rank-card">
            <strong>${index + 1}. ${item.name}</strong>
            <span>${item.avg_phrase !== undefined ? `Frase: ${item.avg_phrase}` : ''}</span>
            <span>${item.avg_drawing !== undefined ? `Desenho: ${item.avg_drawing}` : ''}</span>
            <span>Geral: ${item.avg_general}</span>
            <p>${item.phrase}</p>
        </article>
    `).join('');
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

function submitVote(entryId, category, score) {
    const payload = new URLSearchParams({ entry_id: entryId, score, score_type: category });
    fetch('rate.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload.toString(),
    })
        .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
        .then(({ data }) => {
            if (!data || !data.success) {
                showToast((data && data.message) || 'Não foi possível enviar a nota.');
                return;
            }
            rankings.phrase = data.phraseRanking;
            rankings.drawing = data.drawingRanking;
            rankings.general = data.generalRanking;
            updateRankingPanels();
            showToast('Avaliação registrada!');
        })
        .catch(() => showToast('Erro ao enviar avaliação.'));
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
    const position = getCanvasCoord(event);
    const clicked = findFlowerAt(position);
    if (clicked) {
        openFlowerModal(clicked);
        return;
    }
    if (drawLocked) {
        showToast('Você já desenhou sua plantação do amor. Clique em uma flor para ver detalhes.');
        return;
    }
    selectedLocation = position;
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
            closeModal(modalDraw);
            drawMap();
            showToast('Sua plantação foi salva. Agora ela vive no mapa!');
        })
        .catch(() => showToast('Erro ao salvar a plantação.'));
}

function toggleRain() {
    isRaining = !isRaining;
    if (isRaining) {
        toggleRainButton.textContent = 'Parar chuva';
        rainTimer = setInterval(() => {
            const drop = document.createElement('div');
            drop.className = 'rain-drop';
            const x = Math.random() * window.innerWidth;
            drop.style.left = `${x}px`;
            document.body.appendChild(drop);
            const duration = Math.random() * 1200 + 1200;
            drop.animate([
                { transform: 'translateY(0)', opacity: 1 },
                { transform: `translateY(${window.innerHeight + 100}px)`, opacity: 0 }
            ], { duration, easing: 'linear' })
            .onfinish = () => drop.remove();
        }, 180);
    } else {
        toggleRainButton.textContent = 'Chover Sentimentos';
        clearInterval(rainTimer);
        rainTimer = null;
        document.querySelectorAll('.rain-drop').forEach((drop) => drop.remove());
    }
}

function handleDrawingStart(event) {
    if (drawLocked) return;
    isPainting = true;
    const rect = drawCanvas.getBoundingClientRect();
    lastPaint = {
        x: (event.clientX - rect.left) * (drawCanvas.width / rect.width),
        y: (event.clientY - rect.top) * (drawCanvas.height / rect.height),
    };
}

function handleDrawingMove(event) {
    if (!isPainting || drawLocked) return;
    const rect = drawCanvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (drawCanvas.width / rect.width);
    const y = (event.clientY - rect.top) * (drawCanvas.height / rect.height);
    drawCtx.beginPath();
    drawCtx.moveTo(lastPaint.x, lastPaint.y);
    drawCtx.lineTo(x, y);
    drawCtx.stroke();
    lastPaint = { x, y };
}

function handleDrawingEnd() {
    isPainting = false;
}

function setupEventListeners() {
    mapCanvas.addEventListener('click', onMapClick);
    toggleRainButton.addEventListener('click', toggleRain);
    rankingButton.addEventListener('click', openRankingModal);
    acceptTermsButton.addEventListener('click', acceptConsent);
    rejectTermsButton.addEventListener('click', rejectConsent);
    document.querySelectorAll('[data-close]').forEach((button) => {
        button.addEventListener('click', () => button.closest('.modal') && closeModal(button.closest('.modal')));
    });
    drawCanvas.addEventListener('pointerdown', handleDrawingStart);
    window.addEventListener('pointermove', handleDrawingMove);
    window.addEventListener('pointerup', handleDrawingEnd);
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
}

document.addEventListener('DOMContentLoaded', () => {
    initializeCanvas();
    setupEventListeners();
    updateRankingPanels();
    drawMap();
    if (!hasConsent) {
        showConsentModal();
    }
    startPetalFlow();
    if (!drawLocked) {
        mapHint.textContent = 'Clique em um lugar no mapa para desenhar sua plantação do amor.';
    } else {
        mapHint.textContent = 'Sua plantação do amor já está no mapa. Clique numa flor para ver detalhes.';
    }
});