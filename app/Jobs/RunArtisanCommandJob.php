<?php

namespace App\Jobs;

use App\Models\CommandRun;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class RunArtisanCommandJob implements ShouldQueue
{
    use Queueable;

    public int $timeout = 600;

    public function __construct(
        public int $commandRunId,
    ) {}

    public function handle(): void
    {
        $run = CommandRun::findOrFail($this->commandRunId);
        $log = Log::channel('commands');

        $log->info("Command gestartet: {$run->command}", [
            'run_id' => $run->id,
            'parameters' => $run->parameters,
        ]);

        $run->update([
            'status' => 'running',
            'started_at' => now(),
        ]);

        try {
            $parameters = $run->parameters ?? [];
            $parameters['-v'] = true;

            Artisan::call($run->command, $parameters);
            $output = Artisan::output();

            $run->update([
                'status' => 'completed',
                'output' => $output,
                'completed_at' => now(),
            ]);

            $log->info("Command abgeschlossen: {$run->command}", [
                'run_id' => $run->id,
                'output' => $output,
            ]);
        } catch (\Throwable $e) {
            $run->update([
                'status' => 'failed',
                'output' => $e->getMessage()."\n\n".$e->getTraceAsString(),
                'completed_at' => now(),
            ]);

            $log->error("Command fehlgeschlagen: {$run->command}", [
                'run_id' => $run->id,
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    public function failed(?\Throwable $e): void
    {
        Log::channel('commands')->critical("Job abgestürzt für CommandRun #{$this->commandRunId}", [
            'exception' => $e?->getMessage(),
            'trace' => $e?->getTraceAsString(),
        ]);

        CommandRun::where('id', $this->commandRunId)->update([
            'status' => 'failed',
            'output' => 'Job abgestürzt: '.($e?->getMessage() ?? 'Unbekannter Fehler')."\n\n".($e?->getTraceAsString() ?? ''),
            'completed_at' => now(),
        ]);
    }
}
