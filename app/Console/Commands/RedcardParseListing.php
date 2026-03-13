<?php

namespace App\Console\Commands;

use App\Services\RedCard\HtmlFetcher;
use App\Services\RedCard\ListingParser;
use App\Services\RedCard\SyncService;
use Illuminate\Console\Command;

class RedcardParseListing extends Command
{
    protected $signature = 'redcard:parse-listing
        {--local : Use local HTML file instead of HTTP}
        {--dry-run : Show what would be done without making changes}';

    protected $description = 'Parse the RedCard listing page and sync partners to database';

    public function handle(SyncService $syncService, HtmlFetcher $fetcher): int
    {
        if ($this->option('local')) {
            $fetcher->setLocal(true);
        }

        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->info('DRY RUN - no changes will be made');
        }

        $this->info('Parsing listing page...');
        $stats = $syncService->syncListing($dryRun);

        $this->table(
            ['Action', 'Count'],
            collect($stats)->map(fn ($count, $action) => [ucfirst($action), $count])->values()->all()
        );

        $this->info('Listing sync complete.');

        return self::SUCCESS;
    }
}
