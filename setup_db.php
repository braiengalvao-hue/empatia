<?php
require_once __DIR__ . '/helpers.php';
configure_app_errors();

$config = app_config();
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    $mysqli = new mysqli($config['db_host'], $config['db_user'], $config['db_pass']);
    $mysqli->query(
        "CREATE DATABASE IF NOT EXISTS `{$config['db_name']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    );
    echo "Banco de dados '{$config['db_name']}' criado/verificado com sucesso.<br>";

    $mysqli->select_db($config['db_name']);

    $createTable = 'CREATE TABLE IF NOT EXISTS `gardeners` (
      `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      `name` VARCHAR(50) NOT NULL,
      `phrase` TEXT NOT NULL,
      `drawing_data` MEDIUMTEXT DEFAULT NULL,
      `location_x` INT DEFAULT NULL,
      `location_y` INT DEFAULT NULL,
      `score_phrase` INT UNSIGNED NOT NULL DEFAULT 0,
      `votes_phrase` INT UNSIGNED NOT NULL DEFAULT 0,
      `score_drawing` INT UNSIGNED NOT NULL DEFAULT 0,
      `votes_drawing` INT UNSIGNED NOT NULL DEFAULT 0,
      `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4';

    $mysqli->query($createTable);
    echo "Tabela 'gardeners' criada/verificada com sucesso.<br>";

    $result = $mysqli->query('SELECT COUNT(*) AS total FROM gardeners');
    $row = $result->fetch_assoc();
    echo 'Total de registros na tabela: ' . (int) $row['total'] . '<br>';

    $mysqli->close();
    echo '<br>Configuração concluída com sucesso! <a href="index.php">Ir para o jardim</a>';
} catch (Exception $e) {
    die('Erro: ' . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8'));
}
