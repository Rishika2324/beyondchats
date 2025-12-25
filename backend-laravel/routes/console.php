<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('scrape:articles', function () {
    $this->comment('Starting scrape of BeyondChats blogs...');
    $base = 'https://beyondchats.com/blogs/';
    $html = @file_get_contents($base);
    if (! $html) {
        $this->error('Failed to fetch blogs page: '.$base);
        return 1;
    }

    // find pagination pages
    preg_match_all('/\?page=(\d+)/', $html, $m);
    $pages = array_map('intval', $m[1] ?? []);
    $last = $pages ? max($pages) : 1;
    $lastUrl = $base . '?page=' . $last;
    $this->info('Fetching last page: '.$lastUrl);
    $html2 = @file_get_contents($lastUrl);
    if (! $html2) {
        $this->error('Failed to fetch last page: '.$lastUrl);
        return 1;
    }

    // find article links (absolute and relative)
    preg_match_all("/href=\"(https?:\/\/[^\"']+\/blogs\/[^\"]+)\"/i", $html2, $links);
    $links = $links[1] ?? [];
    if (empty($links)) {
        preg_match_all("/href=\"(\/blogs\/[^\"]+)\"/i", $html2, $links2);
        $links = [];
        foreach (($links2[1] ?? []) as $p) {
            $links[] = rtrim($base, '/') . $p;
        }
    }

    $links = array_values(array_unique($links));
    $links = array_slice($links, 0, 5);

    foreach ($links as $u) {
        $this->info('Scraping: '.$u);
        $ah = @file_get_contents($u);
        if (! $ah) { $this->warn('Failed to fetch: '.$u); continue; }

        $dom = new \DOMDocument();
        @$dom->loadHTML($ah);
        $title = null;
        $nodes = $dom->getElementsByTagName('h1');
        if ($nodes->length) $title = trim($nodes->item(0)->textContent);
        if (! $title) {
            $titles = $dom->getElementsByTagName('title');
            if ($titles->length) $title = trim($titles->item(0)->textContent);
        }

        $body = '';
        $articles = $dom->getElementsByTagName('article');
        if ($articles->length) {
            $body = $dom->saveHTML($articles->item(0));
        } else {
            $xpath = new \DOMXPath($dom);
            $candidates = $xpath->query("//div[contains(@class,'content') or contains(@class,'post') or contains(@class,'article')]");
            if ($candidates->length) $body = $dom->saveHTML($candidates->item(0));
            else $body = $dom->saveHTML($dom->getElementsByTagName('body')->item(0));
        }

        $slug = \Illuminate\Support\Str::slug($title ?: basename(parse_url($u, PHP_URL_PATH)));

        \App\Models\Article::updateOrCreate(['slug' => $slug], [
            'title' => $title ?: $slug,
            'slug' => $slug,
            'body' => $body,
            'original_url' => $u,
            'published_at' => now(),
            'references' => [$u],
        ]);

        $this->info('Saved: '.$slug);
    }

    $this->info('Scrape complete');
})->purpose('Scrape 5 oldest BeyondChats blog articles');
