<?php

test('the app only renders subsection headings', function (): void {
    $resourceDirectory = dirname(__DIR__, 2).'/resources/js';
    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator(
            $resourceDirectory,
            FilesystemIterator::SKIP_DOTS,
        ),
    );
    $headingCount = 0;
    $pageHeadingViolations = [];

    foreach ($files as $file) {
        if (! $file->isFile() || $file->getExtension() !== 'tsx') {
            continue;
        }

        $contents = file_get_contents($file->getPathname());
        preg_match_all('/<Heading\b.*?\/>/s', $contents, $headingMatches);

        foreach ($headingMatches[0] as $heading) {
            $headingCount++;

            if (! str_contains($heading, 'variant="small"')) {
                $pageHeadingViolations[] = str_replace(
                    $resourceDirectory.'/',
                    '',
                    $file->getPathname(),
                );
            }
        }
    }

    expect($headingCount)->toBeGreaterThan(0)
        ->and($pageHeadingViolations)->toBeEmpty();
});
