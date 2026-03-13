<?php

namespace App\Services\RedCard;

use App\Models\ChangeLog;
use App\Models\Partner;
use Carbon\Carbon;
use Illuminate\Support\Str;

class ExportService
{
    public function exportPartners(?string $category = null): array
    {
        $query = Partner::with('categories')->where('is_active', true);

        if ($category) {
            $query->whereHas('categories', function ($q) use ($category) {
                $q->where('slug', Str::slug($category))
                    ->orWhere('name', $category);
            });
        }

        return $query->get()->map(function (Partner $partner) {
            return [
                'external_id' => $partner->external_id,
                'name' => $partner->name,
                'postal_code' => $partner->postal_code,
                'city' => $partner->city,
                'categories' => $partner->categories->pluck('name')->all(),
                'contact_person' => $partner->contact_person,
                'street_address' => $partner->street_address,
                'phone' => $partner->phone,
                'fax' => $partner->fax,
                'email' => $partner->email,
                'website' => $partner->website,
                'discount_description' => $partner->discount_description,
                'body_text' => $partner->body_text,
                'details_fetched' => $partner->details_fetched,
                'detail_url' => config('redcard.base_url').$partner->detail_url,
            ];
        })->all();
    }

    public function exportChanges(?string $since = null): array
    {
        $query = ChangeLog::with('partner')->orderBy('detected_at', 'desc');

        if ($since) {
            $query->where('detected_at', '>=', Carbon::parse($since));
        }

        return $query->get()->map(function (ChangeLog $log) {
            return [
                'partner' => $log->partner?->name,
                'external_id' => $log->partner?->external_id,
                'event' => $log->event,
                'changes' => $log->changes,
                'detected_at' => $log->detected_at->toIso8601String(),
            ];
        })->all();
    }
}
