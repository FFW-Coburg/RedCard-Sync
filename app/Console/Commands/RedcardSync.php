<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class RedcardSync extends Command
{
    protected $signature = 'redcard:sync
        {--full : Also fetch all detail pages}
        {--details-limit=50 : Maximum number of detail pages to fetch}
        {--local : Use local HTML files instead of HTTP}';

    protected $description = 'Full sync: parse listing and optionally fetch details';

    public function handle(): int
    {
        $options = ['--local' => $this->option('local')];

        $this->info('Step 1: Syncing listing...');
        $this->call('redcard:parse-listing', $options);

        if ($this->option('full')) {
            $this->newLine();
            $this->info('Step 2: Fetching details...');
            $this->call('redcard:parse-details', array_merge($options, [
                '--only-new' => true,
                '--limit' => $this->option('details-limit'),
            ]));
        }

        $this->newLine();
        $this->call('redcard:stats');

        return self::SUCCESS;
    }
}
