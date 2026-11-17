<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

function htmlText(string $text): string
{
    return htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function projectCard(array $project): string
{
    $cardId = htmlText($project['id']);
    $topic = htmlText($project['category']);
    $projectTitle = htmlText($project['title']);
    $shortIntro = htmlText($project['summary']);
    $imageName = htmlText($project['image']);
    $altText = htmlText($project['alt']);
    $roleLine = htmlText($project['role']);
    $story = htmlText($project['intro']);
    $bulletHtml = implode("\n", array_map(
        static fn (string $point): string => '                    <li>' . htmlText($point) . '</li>',
        $project['highlights']
    ));

    return <<<HTML
          <article id="project-{$cardId}" class="project-card" data-category="{$topic}" data-reveal>
            <figure class="project-image">
              <img src="./assets/images/{$imageName}" alt="{$altText}" width="768" height="512" loading="lazy" decoding="async">
            </figure>
            <div class="project-caption">
              <h3 class="project-title">{$projectTitle}</h3>
              <p class="project-summary">{$shortIntro}</p>
              <details class="project-notes">
                <summary aria-label="View project for {$projectTitle}">View project <span class="project-arrow" aria-hidden="true"><i class="arrow arrow-up-right"></i></span></summary>
                <div class="project-detail">
                  <p class="project-role">{$roleLine}</p>
                  <p>{$story}</p>
                  <ul>
{$bulletHtml}
                  </ul>
                </div>
              </details>
            </div>
          </article>
HTML;
}

try {
    $command = $argv[1] ?? '';
    if ($argc > 2 || !in_array($command, ['', '--check'], true)) {
        throw new RuntimeException('Usage: php tools/build-projects.php [--check]');
    }

    $siteFolder = dirname(__DIR__);
    $resumeFile = $siteFolder . '/index.html';
    $resumeHtml = file_get_contents($resumeFile);
    $projectJson = file_get_contents($siteFolder . '/data/projects.json');
    if ($resumeHtml === false || $projectJson === false) {
        throw new RuntimeException('Could not read index.html or data/projects.json.');
    }

    $projects = json_decode($projectJson, true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($projects) || !array_is_list($projects) || $projects === []) {
        throw new RuntimeException('Add at least one project to data/projects.json.');
    }

    $cardIds = [];
    $workCards = [];
    foreach ($projects as $project) {
        if (!is_array($project)) {
            throw new RuntimeException('Each project needs its own JSON object.');
        }
        foreach (['id', 'category', 'title', 'summary', 'image', 'alt', 'role', 'intro'] as $field) {
            if (!is_string($project[$field] ?? null) || trim($project[$field]) === '') {
                throw new RuntimeException('Missing project field ' . $field . '.');
            }
        }
        if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', $project['id']) || isset($cardIds[$project['id']])) {
            throw new RuntimeException('Give each project a different ID using lowercase letters, numbers and hyphens.');
        }
        if (!in_array($project['category'], ['business', 'finance', 'technology'], true)) {
            throw new RuntimeException('Use business, finance or technology as the project category.');
        }
        if (!preg_match('/^[a-z0-9-]+\.webp$/D', $project['image'])
            || !is_file($siteFolder . '/assets/images/' . $project['image'])) {
            throw new RuntimeException('Check the project image name and the assets/images folder.');
        }
        if (!is_array($project['highlights'] ?? null)
            || !array_is_list($project['highlights'])
            || $project['highlights'] === []) {
            throw new RuntimeException('Add a list of highlights to each project.');
        }
        $cardIds[$project['id']] = true;
        $workCards[] = projectCard($project);
    }

    $startComment = '<!-- BEGIN GENERATED PROJECTS -->';
    $endComment = '<!-- END GENERATED PROJECTS -->';
    $cardsStart = strpos($resumeHtml, $startComment);
    $cardsEnd = strpos($resumeHtml, $endComment);
    if (substr_count($resumeHtml, $startComment) !== 1 || substr_count($resumeHtml, $endComment) !== 1
        || $cardsStart === false || $cardsEnd === false || $cardsStart >= $cardsEnd) {
        throw new RuntimeException('Check the two project comments in index.html.');
    }

    $cardsStart += strlen($startComment);
    $newCards = "\n" . implode("\n", $workCards) . "\n";
    $updatedPage = substr_replace($resumeHtml, $newCards, $cardsStart, $cardsEnd - $cardsStart);
    if ($command === '--check' && $updatedPage !== $resumeHtml) {
        throw new RuntimeException('The cards in index.html need an update. Run php tools/build-projects.php.');
    }

    if ($updatedPage !== $resumeHtml) {
        $draftFile = tempnam($siteFolder, 'projects-');
        if ($draftFile === false) {
            throw new RuntimeException('Could not create a temporary file for the updated page.');
        }
        try {
            if (file_put_contents($draftFile, $updatedPage) !== strlen($updatedPage) || !rename($draftFile, $resumeFile)) {
                throw new RuntimeException('Could not update index.html.');
            }
        } finally {
            if (is_file($draftFile)) {
                unlink($draftFile);
            }
        }
    }

    fwrite(STDOUT, count($workCards) . ' project cards are up to date.' . PHP_EOL);
} catch (Throwable $error) {
    fwrite(STDERR, $error->getMessage() . PHP_EOL);
    exit(1);
}
