<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\ChangeLog;
use App\Models\Partner;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'total_partners' => Partner::count(),
            'active_partners' => Partner::where('is_active', true)->count(),
            'inactive_partners' => Partner::where('is_active', false)->count(),
            'with_details' => Partner::where('details_fetched', true)->count(),
            'without_details' => Partner::where('details_fetched', false)->count(),
            'categories' => Category::count(),
            'changes' => ChangeLog::count(),
        ];

        $categories = Category::withCount([
            'partners',
            'partners as partners_active_count' => fn ($q) => $q->where('is_active', true),
            'partners as partners_with_details_count' => fn ($q) => $q->where('details_fetched', true),
            'partners as partners_without_details_count' => fn ($q) => $q->where('details_fetched', false),
            'partners as partners_synced_count' => fn ($q) => $q->whereNotNull('bosid_bonus_id'),
        ])
            ->orderByDesc('partners_count')
            ->get();

        $recentChanges = ChangeLog::with('partner:id,name,external_id')
            ->orderByDesc('detected_at')
            ->limit(10)
            ->get();

        $lastSync = ChangeLog::max('detected_at');

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'categories' => $categories,
            'recentChanges' => $recentChanges,
            'lastSync' => $lastSync,
        ]);
    }
}
