<?php

namespace App\Console\Commands;

use App\Services\RedCard\ExportService;
use Illuminate\Console\Command;

class RedcardExport extends Command
{
    protected $signature = 'redcard:export
        {--category= : Filter by category}
        {--changes-since= : Export changes since date (Y-m-d)}
        {--output= : Output file path (default: stdout)}';

    protected $description = 'Export partners or change log as JSON';

    public function handle(ExportService $exportService): int
    {
        $changesSince = $this->option('changes-since');

        if ($changesSince) {
            $data = $exportService->exportChanges($changesSince);
            $label = 'changes';
        } else {
            $data = $exportService->exportPartners($this->option('category'));
            $label = 'partners';
        }

        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $output = $this->option('output');
        if ($output) {
            file_put_contents($output, $json);
            $this->info("Exported ".count($data)." {$label} to {$output}");
        } else {
            $this->line($json);
        }

        return self::SUCCESS;
    }
}
