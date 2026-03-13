<?php

namespace App\Console\Commands;

use App\Models\Partner;
use App\Services\BosId\BosIdClient;
use Illuminate\Console\Command;

class BosIdPurgeCommand extends Command
{
    protected $signature = 'redcard:purge-bosid
        {--dry-run : Show what would be deleted without making changes}
        {--force : Skip confirmation prompt}';

    protected $description = 'Delete all bonuses from the BOS-ID API and clear local references';

    public function handle(BosIdClient $client): int
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->info('DRY RUN — no changes will be made');
        }

        $this->info('Fetching all bonuses from BOS-ID...');

        $client->login();
        $bonuses = $client->getBonuses();

        $count = count($bonuses);

        if ($count === 0) {
            $this->info('No bonuses found. Nothing to delete.');

            return self::SUCCESS;
        }

        $this->warn("Found {$count} bonus(es) in BOS-ID.");

        if ($dryRun) {
            foreach ($bonuses as $bonus) {
                $this->line("  Would delete: {$bonus['headline_text']} ({$bonus['id']})");
            }
            $this->newLine();
            $this->info("{$count} bonus(es) would be deleted.");

            return self::SUCCESS;
        }

        if (! $this->option('force') && ! $this->confirm("Delete all {$count} bonus(es) from BOS-ID? This cannot be undone.")) {
            $this->info('Aborted.');

            return self::SUCCESS;
        }

        $deleted = 0;
        $errors = 0;

        $this->withProgressBar($bonuses, function (array $bonus) use ($client, &$deleted, &$errors) {
            try {
                $client->deleteBonus($bonus['id']);
                $deleted++;
            } catch (\Exception $e) {
                $errors++;
                $this->newLine();
                $this->error("  Failed to delete {$bonus['id']}: {$e->getMessage()}");
            }
        });

        $this->newLine(2);

        // Clear local references
        $cleared = Partner::whereNotNull('bosid_bonus_id')
            ->update(['bosid_bonus_id' => null, 'bosid_synced_at' => null]);

        $this->table(
            ['Action', 'Count'],
            [
                ['Deleted from BOS-ID', $deleted],
                ['Errors', $errors],
                ['Local references cleared', $cleared],
            ]
        );

        $this->info('Purge complete.');

        return $errors > 0 ? self::FAILURE : self::SUCCESS;
    }
}
