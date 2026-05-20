<?php
/**
 * Funções auxiliares compartilhadas pelos endpoints e páginas.
 */

function app_config(): array
{
    static $config = null;
    if ($config === null) {
        $config = require __DIR__ . '/config.php';
    }
    return $config;
}

function configure_app_errors(): void
{
    $debug = app_config()['debug'] ?? false;
    if ($debug) {
        ini_set('display_errors', '1');
        ini_set('display_startup_errors', '1');
        error_reporting(E_ALL);
    } else {
        ini_set('display_errors', '0');
        error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
    }
}

function json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function is_valid_drawing_data(string $data): bool
{
    if ($data === '') {
        return false;
    }
    if (!preg_match('#^data:image/(png|jpeg|jpg|webp);base64,#i', $data)) {
        return false;
    }
    $maxBytes = app_config()['max_drawing_bytes'] ?? (2 * 1024 * 1024);
    return strlen($data) <= $maxBytes + 128;
}

function is_valid_map_coordinate(int $value, string $axis): bool
{
    $config = app_config();
    $max = $axis === 'x'
        ? (int) ($config['world_width'] ?? 3000)
        : (int) ($config['world_height'] ?? 3000);
    return $value >= 0 && $value <= $max;
}

function flower_min_distance(): int
{
    return max(20, (int) (app_config()['flower_min_distance'] ?? 80));
}

/**
 * Verifica se a coordenada respeita o espaçamento mínimo entre plantações.
 */
function is_flower_location_available(mysqli $mysqli, int $x, int $y, int $excludeEntryId): bool
{
    $min = flower_min_distance();
    $stmt = $mysqli->prepare(
        'SELECT id FROM gardeners
         WHERE id != ?
           AND drawing_data IS NOT NULL AND drawing_data != \'\'
           AND location_x IS NOT NULL AND location_y IS NOT NULL
           AND (POW(location_x - ?, 2) + POW(location_y - ?, 2)) < ?'
    );
    if (!$stmt) {
        return false;
    }
    $minSq = $min * $min;
    $stmt->bind_param('iiii', $excludeEntryId, $x, $y, $minSq);
    $stmt->execute();
    $stmt->store_result();
    $tooClose = $stmt->num_rows > 0;
    $stmt->close();

    return !$tooClose;
}
