<?php

namespace App\Console\Commands;

use App\Services\BosId\BosIdSyncService;
use Illuminate\Console\Command;

class BosIdSyncCommand extends Command
{
    protected $signature = 'redcard:sync-bosid
        {--dry-run : Show what would be done without making changes}
        {--category= : Only sync partners in this category}
        {--batch-size=10 : Number of partners per batch}
        {--dry_run : Alias for --dry-run}
        {--batch_size=0 : Alias for --batch-size}';

    protected $description = 'Sync partners as bonuses to the BOS-ID API';

    public function handle(BosIdSyncService $syncService): int
    {
        $dryRun = $this->option('dry-run') || $this->option('dry_run');
        $category = $this->option('category');
        $batchSize = (int) $this->option('batch-size');
        if (! $batchSize && $this->option('batch_size')) {
            $batchSize = (int) $this->option('batch_size');
        }
        if (! $batchSize) {
            $batchSize = 10;
        }

        if ($dryRun) {
            $this->info('DRY RUN — no changes will be made');
        }

        $this->info('Starting BOS-ID sync...');
        $this->newLine();

        $syncService->setOutput($this->output);

        if ($this->output->isVerbose()) {
            $this->info('Verbose mode enabled — showing API request details');
            $this->newLine();
        }

        $stats = $syncService->sync($dryRun, $category, $batchSize);

        // Show details
        if (! empty($stats['details'])) {
            foreach ($stats['details'] as $detail) {
                $this->line("  {$detail}");
            }
            $this->newLine();
        }

        // Summary table
        $this->table(
            ['Action', 'Count'],
            [
                ['Created', $stats['created']],
                ['Updated', $stats['updated']],
                ['Skipped', $stats['skipped']],
                ['Errors', $stats['errors']],
            ]
        );

        if ($stats['errors'] > 0) {
            $this->warn('Some partners failed to sync. Check storage/logs/commands.log for details.');
        }

        $this->info('BOS-ID sync complete.');

        return $stats['errors'] > 0 ? self::FAILURE : self::SUCCESS;
    }
}
