<?php
session_start();
require_once __DIR__ . '/helpers.php';
configure_app_errors();

$entryId = filter_input(INPUT_POST, 'entry_id', FILTER_VALIDATE_INT);
$locX = filter_input(INPUT_POST, 'loc_x', FILTER_VALIDATE_INT);
$locY = filter_input(INPUT_POST, 'loc_y', FILTER_VALIDATE_INT);
$drawingData = isset($_POST['drawing_data']) ? (string) $_POST['drawing_data'] : '';

if (
    $entryId === false || $entryId === null
    || $locX === false || $locX === null
    || $locY === false || $locY === null
    || !is_valid_drawing_data($drawingData)
    || !is_valid_map_coordinate($locX, 'x')
    || !is_valid_map_coordinate($locY, 'y')
) {
    json_response(['success' => false, 'message' => 'Dados inválidos para salvar a plantação.'], 400);
}

if (empty($_SESSION['entry_id']) || (int) $_SESSION['entry_id'] !== $entryId) {
    json_response(['success' => false, 'message' => 'Sessão inválida ou entrada não autorizada.'], 403);
}

try {
    require_once __DIR__ . '/db.php';

    $existingDrawing = null;
    $stmt = $mysqli->prepare('SELECT drawing_data FROM gardeners WHERE id = ?');
    $stmt->bind_param('i', $entryId);
    $stmt->execute();
    $stmt->bind_result($existingDrawing);
    $stmt->fetch();
    $stmt->close();

    if ($existingDrawing !== null && $existingDrawing !== '') {
        json_response(['success' => false, 'message' => 'Esta plantação já foi desenhada e não pode ser alterada.'], 409);
    }

    $stmt = $mysqli->prepare(
        'UPDATE gardeners SET drawing_data = ?, location_x = ?, location_y = ? WHERE id = ?'
    );
    $stmt->bind_param('siii', $drawingData, $locX, $locY, $entryId);
    $stmt->execute();
    $stmt->close();

    if ($mysqli->affected_rows === 0) {
        json_response(['success' => false, 'message' => 'Não foi possível salvar a plantação.'], 404);
    }

    json_response(['success' => true]);
} catch (Throwable $e) {
    json_response([
        'success' => false,
        'message' => app_config()['debug'] ? $e->getMessage() : 'Erro ao conectar ao banco de dados.',
    ], 500);
}
