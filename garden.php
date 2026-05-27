<?php
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/rankings.php';
configure_app_errors();
session_start();

function redirectToLogin(): void
{
    header('Location: index.php');
    exit;
}

$username = null;
$phrase = null;
$entryId = null;

$ownEntry = [
    'id' => null,
    'name' => null,
    'phrase' => null,
    'drawing_data' => null,
    'location_x' => null,
    'location_y' => null,
    'score_phrase' => 0,
    'votes_phrase' => 0,
    'score_drawing' => 0,
    'votes_drawing' => 0,
];

$flowerEntries = [];
$rankings = ['phrase' => [], 'drawing' => [], 'general' => []];
$dbError = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawName = isset($_POST['username']) ? trim((string) $_POST['username']) : '';
    $rawPhrase = isset($_POST['phrase']) ? trim((string) $_POST['phrase']) : '';

    if ($rawName === '' || $rawPhrase === '') {
        redirectToLogin();
    }

    $username = mb_substr($rawName, 0, 30);
    $phrase = mb_substr($rawPhrase, 0, 250);

    $_SESSION['jardineiro'] = $username;
    $_SESSION['phrase'] = $phrase;
} elseif (!empty($_SESSION['jardineiro']) && !empty($_SESSION['phrase'])) {
    $username = $_SESSION['jardineiro'];
    $phrase = $_SESSION['phrase'];
} else {
    redirectToLogin();
}

$ownEntry['name'] = $username;
$ownEntry['phrase'] = $phrase;

try {
    require_once __DIR__ . '/db.php';

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!empty($_SESSION['entry_id'])) {
            $entryId = (int) $_SESSION['entry_id'];
            $existingDrawing = null;
            $stmt = $mysqli->prepare('SELECT drawing_data FROM gardeners WHERE id = ?');
            $stmt->bind_param('i', $entryId);
            $stmt->execute();
            $stmt->bind_result($existingDrawing);
            $stmt->fetch();
            $stmt->close();

            if ($existingDrawing === null || $existingDrawing === '') {
                $stmt = $mysqli->prepare('UPDATE gardeners SET `name` = ?, `phrase` = ? WHERE id = ?');
                $stmt->bind_param('ssi', $username, $phrase, $entryId);
                $stmt->execute();
                $stmt->close();
            }
        } else {
            $stmt = $mysqli->prepare('INSERT INTO gardeners (`name`, `phrase`) VALUES (?, ?)');
            $stmt->bind_param('ss', $username, $phrase);
            $stmt->execute();
            $_SESSION['entry_id'] = $mysqli->insert_id;
            $stmt->close();
        }

        header('Location: ' . $_SERVER['PHP_SELF']);
        exit;
    }

    if (!empty($_SESSION['entry_id'])) {
        $entryId = (int) $_SESSION['entry_id'];
        $stmt = $mysqli->prepare(
            'SELECT `name`, `phrase`, `drawing_data`, `location_x`, `location_y`,
                    `score_phrase`, `votes_phrase`, `score_drawing`, `votes_drawing`
             FROM gardeners WHERE id = ?'
        );

        if ($stmt) {
            $stmt->bind_param('i', $entryId);
            $stmt->execute();
            $dbName = $dbPhrase = $dbDrawing = $dbX = $dbY = null;
            $dbScorePhrase = $dbVotesPhrase = $dbScoreDrawing = $dbVotesDrawing = null;
            $stmt->bind_result(
                $dbName,
                $dbPhrase,
                $dbDrawing,
                $dbX,
                $dbY,
                $dbScorePhrase,
                $dbVotesPhrase,
                $dbScoreDrawing,
                $dbVotesDrawing
            );

            if ($stmt->fetch()) {
                $username = $dbName;
                $phrase = $dbPhrase;
                $_SESSION['jardineiro'] = $username;
                $_SESSION['phrase'] = $phrase;

                $ownEntry = [
                    'id' => $entryId,
                    'name' => $dbName,
                    'phrase' => $dbPhrase,
                    'drawing_data' => $dbDrawing,
                    'location_x' => $dbX !== null ? (int) $dbX : null,
                    'location_y' => $dbY !== null ? (int) $dbY : null,
                    'score_phrase' => (int) $dbScorePhrase,
                    'votes_phrase' => (int) $dbVotesPhrase,
                    'score_drawing' => (int) $dbScoreDrawing,
                    'votes_drawing' => (int) $dbVotesDrawing,
                ];
            } else {
                unset($_SESSION['entry_id']);
                $entryId = null;
            }
            $stmt->close(); 
        }
    }

    $result = $mysqli->query(
        'SELECT id, `name`, `phrase`, `drawing_data`, `location_x`, `location_y`,
                `score_phrase`, `votes_phrase`, `score_drawing`, `votes_drawing`
         FROM gardeners'
    );

    if ($result) {
        while ($row = $result->fetch_assoc()) {
            if (
                $row['drawing_data'] !== null
                && $row['drawing_data'] !== ''
                && $row['location_x'] !== null
                && $row['location_y'] !== null
            ) {
                $flowerEntries[] = [
                    'id' => (int) $row['id'],
                    'name' => $row['name'],
                    'phrase' => $row['phrase'],
                    'drawing_data' => $row['drawing_data'],
                    'location_x' => (int) $row['location_x'],
                    'location_y' => (int) $row['location_y'],
                    'score_phrase' => (int) $row['score_phrase'],
                    'votes_phrase' => (int) $row['votes_phrase'],
                    'score_drawing' => (int) $row['score_drawing'],
                    'votes_drawing' => (int) $row['votes_drawing'],
                ];
            }
        }
        $result->free();
    }

    $rankings = compute_rankings($mysqli);
} catch (Throwable $e) {
    $dbError = app_config()['debug'] ? $e->getMessage() : 'Não foi possível conectar ao banco de dados. Execute setup_db.php.';
}

$config = app_config();
$ratedVotes = [];
foreach ($_SESSION['rated_entries'] ?? [] as $ratedKey) {
    $ratedVotes[(string) $ratedKey] = true;
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plantação do Amor - <?php echo htmlspecialchars($username, ENT_QUOTES, 'UTF-8'); ?></title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="garden.css">
</head>
<body>
<?php if ($dbError !== null): ?>
    <main style="max-width: 520px; margin: 4rem auto; padding: 1.5rem; font-family: sans-serif;">
        <h1>Erro de conexão</h1>
        <p><?php echo htmlspecialchars($dbError, ENT_QUOTES, 'UTF-8'); ?></p>
        <p><a href="setup_db.php">Executar configuração do banco</a> · <a href="index.php">Voltar ao início</a></p>
    </main>
<?php else: ?>
    <div id="consent-modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="consent-title">
        <div class="modal-panel consent-panel">
            <h2 id="consent-title">Compromisso do Coração</h2>
            <p class="modal-copy">Esta experiência nasceu para ser um lugar de sentimentos profundos. Você deve aceitar o compromisso de criar com honestidade e sentido antes de poder ver, desenhar ou compartilhar.</p>
            <p class="modal-copy">Aqui falamos sobre comprometimento e desenvolvimento pessoal. Este campo é seu espaço de cuidado: ao aceitar, você abre a porta para a sua plantação de sentimentos.</p>
            <div class="consent-actions">
                <button id="accept-terms" type="button">Aceitar Compromisso</button>
                <button id="reject-terms" type="button">Voltar</button>
            </div>
        </div>
    </div>
    <div id="hud">
        <div class="panel">
            <span>Criador:</span>
            <span class="highlight"><?php echo htmlspecialchars($username, ENT_QUOTES, 'UTF-8'); ?></span>
        </div>
        <div class="panel">
            <span>Frase:</span>
            <span class="highlight"><?php echo htmlspecialchars(mb_strlen($phrase) > 28 ? mb_substr($phrase, 0, 28) . '...' : $phrase, ENT_QUOTES, 'UTF-8'); ?></span>
        </div>
        <div class="hud-actions">
            <button id="ranking-button" type="button">Ranking</button>
            <button id="toggle-rain" type="button" aria-pressed="false">Chover no Jardim</button>
        </div>
    </div>
    <div id="map-hint" role="status">Arraste o mapa para explorar. Clique em um espaço livre para plantar.</div>
    <div id="map-viewport" aria-label="Mapa do jardim de sentimentos">
        <div id="map-stage">
            <canvas id="map-canvas"></canvas>
        </div>
    </div>

    <div id="draw-modal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="draw-modal-title">
        <div class="modal-panel draw-panel">
            <button class="close-modal" data-close type="button" aria-label="Fechar desenho">&times;</button>
            <header class="draw-header">
                <h2 id="draw-modal-title">Plantação do Amor</h2>
                <p class="modal-copy draw-hint">Use caneta ou mouse na área branca. Recomendado: modo tela cheia para mesa digitalizadora.</p>
            </header>
            <div id="draw-stage" class="draw-stage">
                <canvas id="draw-canvas" width="720" height="480"></canvas>
            </div>
            <div class="draw-controls">
                <button id="toggle-draw-fullscreen" type="button" aria-pressed="false">Tela cheia</button>
                <button id="clear-draw" type="button">Limpar</button>
                <button id="save-draw" type="button">Salvar desenho</button>
            </div>
        </div>
    </div>

    <div id="flower-modal" class="modal hidden">
        <div class="modal-panel">
            <button class="close-modal" data-close>&times;</button>
            <h2>Plantação de <span id="modal-flower-author"></span></h2>
            <p id="modal-flower-phrase" class="modal-copy"></p>
            <img id="modal-flower-image" alt="Desenho da plantação" />
            <div class="rating-grid">
                <div>
                    <h3>Frase</h3>
                    <div id="phrase-votes" class="vote-row"></div>
                </div>
                <div>
                    <h3>Desenho</h3>
                    <div id="drawing-votes" class="vote-row"></div>
                </div>
            </div>
            <p id="modal-flower-note" class="modal-note"></p>
        </div>
    </div>

    <div id="ranking-modal" class="modal hidden">
        <div class="modal-panel ranking-panel">
            <button class="close-modal" data-close>&times;</button>
            <h2>Rankings</h2>
            <div class="rank-tabs">
                <button class="tab-button active" data-tab="phrase">Frase</button>
                <button class="tab-button" data-tab="drawing">Desenho</button>
                <button class="tab-button" data-tab="general">Geral</button>
            </div>
            <div class="tab-content" id="phrase-rank"></div>
            <div class="tab-content hidden" id="drawing-rank"></div>
            <div class="tab-content hidden" id="general-rank"></div>
        </div>
    </div>

    <div id="toast" class="toast hidden"></div>
    <script>
        window.WORLD_WIDTH = <?php echo (int) ($config['world_width'] ?? 3000); ?>;
        window.WORLD_HEIGHT = <?php echo (int) ($config['world_height'] ?? 3000); ?>;
        window.GARDENER_NAME = <?php echo json_encode($username, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP); ?>;
        window.ENTRY_ID = <?php echo json_encode($entryId, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP); ?>;
        window.USER_ENTRY = <?php echo json_encode($ownEntry, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP); ?>;
        window.FLOWER_ENTRIES = <?php echo json_encode($flowerEntries, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP); ?>;
        window.RANKINGS = <?php echo json_encode($rankings, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP); ?>;
        window.RATED_VOTES = <?php echo json_encode($ratedVotes, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP); ?>;
        window.FLOWER_MIN_DISTANCE = <?php echo (int) flower_min_distance(); ?>;
    </script>
    <script src="script.js"></script>
<?php endif; ?>
</body>
</html>
