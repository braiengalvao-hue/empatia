<?php
/**
 * Calcula médias e top 5 dos rankings (frase, desenho e geral).
 *
 * @return array{phrase: array, drawing: array, general: array}
 */
function compute_rankings(mysqli $mysqli, int $limit = 5): array
{
    $entries = [];
    $result = $mysqli->query(
        'SELECT id, `name`, `phrase`, `score_phrase`, `votes_phrase`, `score_drawing`, `votes_drawing`
         FROM gardeners
         WHERE drawing_data IS NOT NULL AND drawing_data != \'\''
    );

    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $phraseAvg = $row['votes_phrase'] > 0
                ? ($row['score_phrase'] / $row['votes_phrase'])
                : 0;
            $drawingAvg = $row['votes_drawing'] > 0
                ? ($row['score_drawing'] / $row['votes_drawing'])
                : 0;

            $entries[] = [
                'id' => (int) $row['id'],
                'name' => $row['name'],
                'phrase' => $row['phrase'],
                'avg_phrase' => round($phraseAvg, 2),
                'avg_drawing' => round($drawingAvg, 2),
                'avg_general' => round(($phraseAvg + $drawingAvg) / 2, 2),
                'votes_phrase' => (int) $row['votes_phrase'],
                'votes_drawing' => (int) $row['votes_drawing'],
            ];
        }
        $result->free();
    }

    $phraseRanking = $entries;
    usort($phraseRanking, static function (array $a, array $b): int {
        return $b['avg_phrase'] <=> $a['avg_phrase'] ?: $b['votes_phrase'] <=> $a['votes_phrase'];
    });

    $drawingRanking = $entries;
    usort($drawingRanking, static function (array $a, array $b): int {
        return $b['avg_drawing'] <=> $a['avg_drawing'] ?: $b['votes_drawing'] <=> $a['votes_drawing'];
    });

    $generalRanking = $entries;
    usort($generalRanking, static function (array $a, array $b): int {
        return $b['avg_general'] <=> $a['avg_general'];
    });

    return [
        'phrase' => array_slice($phraseRanking, 0, $limit),
        'drawing' => array_slice($drawingRanking, 0, $limit),
        'general' => array_slice($generalRanking, 0, $limit),
    ];
}
