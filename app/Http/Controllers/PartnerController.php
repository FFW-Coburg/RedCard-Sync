<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Partner;
use App\Services\RedCard\SyncService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PartnerController extends Controller
{
    public function index(Request $request)
    {
        $query = Partner::with('categories')
            ->select([
                'id', 'external_id', 'name', 'postal_code', 'city',
                'is_active', 'details_fetched', 'details_fetched_at',
            ]);

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($category = $request->input('category')) {
            $query->whereHas('categories', fn ($q) => $q->where('slug', $category));
        }

        if ($request->input('status') === 'active') {
            $query->where('is_active', true);
        } elseif ($request->input('status') === 'inactive') {
            $query->where('is_active', false);
        }

        if ($request->input('details') === 'fetched') {
            $query->where('details_fetched', true);
        } elseif ($request->input('details') === 'missing') {
            $query->where('details_fetched', false);
        }

        $partners = $query->orderBy('name')->paginate(25)->withQueryString();
        $categories = Category::orderBy('name')->get(['id', 'name', 'slug']);

        return Inertia::render('partners/index', [
            'partners' => $partners,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category', 'status', 'details']),
        ]);
    }

    public function show(Partner $partner)
    {
        $partner->load('categories');

        $changeLogs = $partner->changeLogs()
            ->orderByDesc('detected_at')
            ->limit(50)
            ->get();

        return Inertia::render('partners/show', [
            'partner' => $partner,
            'changeLogs' => $changeLogs,
        ]);
    }

    public function refetch(Partner $partner, SyncService $syncService)
    {
        $result = $syncService->syncDetails(partnerId: $partner->external_id, limit: 1);

        return back()->with('success', "Details neu geladen: {$result['fetched']} abgerufen, {$result['updated']} aktualisiert.");
    }
}
