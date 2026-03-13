<?php

namespace App\Services\RedCard;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class HtmlFetcher
{
    private bool $useLocal;

    private int $delayMs;

    private string $baseUrl;

    public function __construct(?bool $useLocal = null)
    {
        $this->useLocal = $useLocal ?? config('redcard.use_local_html');
        $this->delayMs = config('redcard.request_delay_ms', 500);
        $this->baseUrl = config('redcard.base_url');
    }

    public function setLocal(bool $local): self
    {
        $this->useLocal = $local;

        return $this;
    }

    public function fetchListing(): string
    {
        if ($this->useLocal) {
            return $this->readLocalFile('table.html');
        }

        return $this->fetchUrl(config('redcard.listing_path'));
    }

    public function fetchDetail(string $detailUrl): string
    {
        if ($this->useLocal) {
            // Try to find a local file matching the partner ID
            preg_match('/redcard-partner\/(\d+)/', $detailUrl, $m);
            $filename = 'detail_'.($m[1] ?? 'unknown').'.html';

            return $this->readLocalFile($filename);
        }

        return $this->fetchUrl($detailUrl);
    }

    private function fetchUrl(string $path): string
    {
        $url = $this->baseUrl.'/'.ltrim($path, '/');

        $response = Http::withUserAgent('RedCardParser/1.0 (Feuerwehr Coburg)')
            ->retry(3, 1000)
            ->get($url);

        $response->throw();

        // Rate limiting
        usleep($this->delayMs * 1000);

        return $response->body();
    }

    private function readLocalFile(string $filename): string
    {
        $path = storage_path("app/html/{$filename}");

        if (! file_exists($path)) {
            throw new \RuntimeException("Local HTML file not found: {$path}");
        }

        return file_get_contents($path);
    }
}
