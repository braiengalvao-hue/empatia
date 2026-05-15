CREATE DATABASE IF NOT EXISTS `jardim` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `jardim`;

CREATE TABLE IF NOT EXISTS `gardeners` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Se precisar migrar uma tabela antiga, use:
-- ALTER TABLE `gardeners`
--   ADD COLUMN `drawing_data` MEDIUMTEXT DEFAULT NULL,
--   ADD COLUMN `location_x` INT DEFAULT NULL,
--   ADD COLUMN `location_y` INT DEFAULT NULL,
--   ADD COLUMN `score_phrase` INT UNSIGNED NOT NULL DEFAULT 0,
--   ADD COLUMN `votes_phrase` INT UNSIGNED NOT NULL DEFAULT 0,
--   ADD COLUMN `score_drawing` INT UNSIGNED NOT NULL DEFAULT 0,
--   ADD COLUMN `votes_drawing` INT UNSIGNED NOT NULL DEFAULT 0;

-- Caso já exista uma tabela `gardeners` sem o novo campo de frase e ranking,
-- execute a migração abaixo para atualizar a estrutura.
-- ALTER TABLE `gardeners`
--   ADD COLUMN `phrase` TEXT NOT NULL AFTER `name`,
--   ADD COLUMN `score` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `phrase`,
--   ADD COLUMN `votes` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `score`;
