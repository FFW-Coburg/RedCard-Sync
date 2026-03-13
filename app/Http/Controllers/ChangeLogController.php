<?php

namespace App\Http\Controllers;

use App\Models\ChangeLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ChangeLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ChangeLog::with('partner:id,name,external_id')
            ->orderByDesc('detected_at');

        if ($event = $request->input('event')) {
            $query->where('event', $event);
        }

        if ($since = $request->input('since')) {
            $query->where('detected_at', '>=', $since);
        }

        if ($partner = $request->input('partner')) {
            $query->whereHas('partner', fn ($q) => $q->where('name', 'like', "%{$partner}%"));
        }

        $changes = $query->paginate(25)->withQueryString();

        $eventTypes = ChangeLog::distinct()->pluck('event')->sort()->values();

        return Inertia::render('changes/index', [
            'changes' => $changes,
            'eventTypes' => $eventTypes,
            'filters' => $request->only(['event', 'since', 'partner']),
        ]);
    }
}
