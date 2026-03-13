<?php

namespace App\Console\Commands;

use App\Services\RedCard\HtmlFetcher;
use App\Services\RedCard\SyncService;
use Illuminate\Console\Command;

class RedcardParseDetails extends Command
{
    protected $signature = 'redcard:parse-details
        {--category= : Filter by category name or slug}
        {--only-new : Only fetch details for partners without details}
        {--limit=50 : Maximum number of detail pages to fetch}
        {--partner= : Fetch details for a specific partner by external ID}
        {--local : Use local HTML files instead of HTTP}';

    protected $description = 'Fetch and parse detail pages for partners';

    public function handle(SyncService $syncService, HtmlFetcher $fetcher): int
    {
        if ($this->option('local')) {
            $fetcher->setLocal(true);
        }

        $this->info('Fetching detail pages...');

        $stats = $syncService->syncDetails(
            category: $this->option('category'),
            onlyNew: $this->option('only-new'),
            limit: (int) $this->option('limit'),
            partnerId: $this->option('partner') ? (int) $this->option('partner') : null,
        );

        $this->table(
            ['Action', 'Count'],
            collect($stats)->map(fn ($count, $action) => [ucfirst($action), $count])->values()->all()
        );

        if ($stats['errors'] > 0) {
            $this->warn("Encountered {$stats['errors']} errors. Check logs for details.");
        }

        $this->info('Detail sync complete.');

        return $stats['errors'] > 0 ? self::FAILURE : self::SUCCESS;
    }
}
