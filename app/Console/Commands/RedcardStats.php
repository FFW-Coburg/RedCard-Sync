<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Models\ChangeLog;
use App\Models\Partner;
use Illuminate\Console\Command;

class RedcardStats extends Command
{
    protected $signature = 'redcard:stats';

    protected $description = 'Show RedCard database statistics';

    public function handle(): int
    {
        $totalPartners = Partner::count();
        $activePartners = Partner::where('is_active', true)->count();
        $inactivePartners = Partner::where('is_active', false)->count();
        $withDetails = Partner::where('details_fetched', true)->count();
        $withoutDetails = Partner::where('details_fetched', false)->where('is_active', true)->count();
        $totalCategories = Category::count();
        $totalChanges = ChangeLog::count();

        $this->info('RedCard Database Statistics');
        $this->newLine();

        $this->table(
            ['Metric', 'Value'],
            [
                ['Total Partners', $totalPartners],
                ['Active Partners', $activePartners],
                ['Inactive Partners', $inactivePartners],
                ['With Details', $withDetails],
                ['Without Details (active)', $withoutDetails],
                ['Categories', $totalCategories],
                ['Change Log Entries', $totalChanges],
            ]
        );

        // Category breakdown
        $this->newLine();
        $this->info('Partners per Category:');

        $categories = Category::withCount(['partners' => function ($q) {
            $q->where('is_active', true);
        }])->orderByDesc('partners_count')->get();

        $this->table(
            ['Category', 'Active Partners'],
            $categories->map(fn ($c) => [$c->name, $c->partners_count])->all()
        );

        // Recent changes
        $recentChanges = ChangeLog::with('partner')
            ->orderByDesc('detected_at')
            ->limit(5)
            ->get();

        if ($recentChanges->isNotEmpty()) {
            $this->newLine();
            $this->info('Recent Changes:');
            $this->table(
                ['Date', 'Partner', 'Event'],
                $recentChanges->map(fn ($c) => [
                    $c->detected_at->format('Y-m-d H:i'),
                    $c->partner?->name ?? 'N/A',
                    $c->event,
                ])->all()
            );
        }

        return self::SUCCESS;
    }
}
