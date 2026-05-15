<?php
session_start();
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/rankings.php';
configure_app_errors();

$entryId = filter_input(INPUT_POST, 'entry_id', FILTER_VALIDATE_INT);
$score = filter_input(INPUT_POST, 'score', FILTER_VALIDATE_INT);
$scoreType = isset($_POST['score_type']) ? (string) $_POST['score_type'] : '';

if ($entryId === false || $entryId === null || $score === false || $score === null) {
    json_response(['success' => false, 'message' => 'Dados inválidos.'], 400);
}

if ($score < 1 || $score > 5 || !in_array($scoreType, ['phrase', 'drawing'], true)) {
    json_response(['success' => false, 'message' => 'Nota inválida.'], 400);
}

if (!empty($_SESSION['entry_id']) && (int) $_SESSION['entry_id'] === $entryId) {
    json_response(['success' => false, 'message' => 'Você não pode avaliar sua própria plantação.'], 403);
}

if (!isset($_SESSION['rated_entries'])) {
    $_SESSION['rated_entries'] = [];
}

$key = $entryId . '_' . $scoreType;
if (in_array($key, $_SESSION['rated_entries'], true)) {
    $label = $scoreType === 'phrase' ? 'frase' : 'desenho';
    json_response(['success' => false, 'message' => "Você já avaliou esta {$label}."], 409);
}

try {
    require_once __DIR__ . '/db.php';

    $targetExists = false;
    $check = $mysqli->prepare(
        'SELECT id FROM gardeners WHERE id = ? AND drawing_data IS NOT NULL AND drawing_data != \'\''
    );
    $check->bind_param('i', $entryId);
    $check->execute();
    $check->bind_result($foundId);
    if ($check->fetch()) {
        $targetExists = true;
    }
    $check->close();

    if (!$targetExists) {
        json_response(['success' => false, 'message' => 'Plantação não encontrada ou ainda sem desenho.'], 404);
    }

    if ($scoreType === 'phrase') {
        $stmt = $mysqli->prepare(
            'UPDATE gardeners SET score_phrase = score_phrase + ?, votes_phrase = votes_phrase + 1 WHERE id = ?'
        );
    } else {
        $stmt = $mysqli->prepare(
            'UPDATE gardeners SET score_drawing = score_drawing + ?, votes_drawing = votes_drawing + 1 WHERE id = ?'
        );
    }

    $stmt->bind_param('ii', $score, $entryId);
    $stmt->execute();
    $stmt->close();

    if ($mysqli->affected_rows === 0) {
        json_response(['success' => false, 'message' => 'Não foi possível registrar a avaliação.'], 404);
    }

    $_SESSION['rated_entries'][] = $key;

    $rankings = compute_rankings($mysqli);

    json_response([
        'success' => true,
        'phraseRanking' => $rankings['phrase'],
        'drawingRanking' => $rankings['drawing'],
        'generalRanking' => $rankings['general'],
    ]);
} catch (Throwable $e) {
    json_response([
        'success' => false,
        'message' => app_config()['debug'] ? $e->getMessage() : 'Erro ao conectar ao banco de dados.',
    ], 500);
}
