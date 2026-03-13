<?php

namespace App\Services\RedCard;

use App\Models\Category;
use App\Models\ChangeLog;
use App\Models\Partner;
use App\Services\RedCard\DTOs\ListingEntry;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class SyncService
{
    public function __construct(
        private HtmlFetcher $fetcher,
        private ListingParser $listingParser,
        private DetailParser $detailParser,
    ) {}

    /**
     * @return array{created: int, updated: int, deactivated: int, reactivated: int, unchanged: int}
     */
    public function syncListing(bool $dryRun = false): array
    {
        $html = $this->fetcher->fetchListing();
        $entries = $this->listingParser->parseAndFilter($html);

        $existingPartners = Partner::all()->keyBy('external_id');
        $categories = Category::all()->keyBy('slug');

        $stats = ['created' => 0, 'updated' => 0, 'deactivated' => 0, 'reactivated' => 0, 'unchanged' => 0];
        $seenExternalIds = [];

        foreach ($entries as $entry) {
            $seenExternalIds[] = $entry->externalId;
            $existing = $existingPartners->get($entry->externalId);
            $newHash = $entry->listingHash();

            if (! $existing) {
                if (! $dryRun) {
                    $partner = Partner::create([
                        'external_id' => $entry->externalId,
                        'name' => $entry->name,
                        'postal_code' => $entry->postalCode,
                        'city' => $entry->city,
                        'detail_url' => $entry->detailUrl,
                        'listing_hash' => $newHash,
                        'is_active' => true,
                    ]);

                    $this->syncCategories($partner, $entry->categories, $categories);
                    $this->logChange($partner, 'created');
                }
                $stats['created']++;
            } elseif ($existing->listing_hash !== $newHash) {
                if (! $dryRun) {
                    $oldValues = $existing->only(['name', 'postal_code', 'city', 'detail_url']);
                    $existing->update([
                        'name' => $entry->name,
                        'postal_code' => $entry->postalCode,
                        'city' => $entry->city,
                        'detail_url' => $entry->detailUrl,
                        'listing_hash' => $newHash,
                    ]);

                    $this->syncCategories($existing, $entry->categories, $categories);
                    $this->logChange($existing, 'updated', [
                        'old' => $oldValues,
                        'new' => $existing->only(['name', 'postal_code', 'city', 'detail_url']),
                    ]);
                }
                $stats['updated']++;
            } else {
                // Hash matches - still sync categories in case they changed
                if (! $dryRun) {
                    $this->syncCategories($existing, $entry->categories, $categories);

                    // Reactivate if was deactivated
                    if (! $existing->is_active) {
                        $existing->update(['is_active' => true]);
                        $this->logChange($existing, 'reactivated');
                        $stats['reactivated']++;

                        continue;
                    }
                }
                $stats['unchanged']++;
            }
        }

        // Deactivate partners no longer in listing
        if (! $dryRun) {
            $toDeactivate = Partner::where('is_active', true)
                ->whereNotIn('external_id', $seenExternalIds)
                ->get();

            foreach ($toDeactivate as $partner) {
                $partner->update(['is_active' => false]);
                $this->logChange($partner, 'deactivated');
                $stats['deactivated']++;
            }
        }

        return $stats;
    }

    /**
     * @return array{fetched: int, updated: int, unchanged: int, errors: int}
     */
    public function syncDetails(
        ?string $category = null,
        bool $onlyNew = false,
        int $limit = 50,
        ?int $partnerId = null,
    ): array {
        $query = Partner::where('is_active', true);

        if ($partnerId) {
            $query->where('external_id', $partnerId);
        } elseif ($onlyNew) {
            $query->where('details_fetched', false);
        }

        if ($category) {
            $query->whereHas('categories', function ($q) use ($category) {
                $q->where('slug', Str::slug($category))
                    ->orWhere('name', $category);
            });
        }

        $partners = $query->limit($limit)->get();
        $stats = ['fetched' => 0, 'updated' => 0, 'unchanged' => 0, 'errors' => 0];

        foreach ($partners as $partner) {
            try {
                $html = $this->fetcher->fetchDetail($partner->detail_url);
                $detail = $this->detailParser->parse($html);
                $newHash = $detail->detailHash();
                $stats['fetched']++;

                if ($partner->detail_hash !== $newHash) {
                    $oldValues = $partner->only([
                        'contact_person', 'street_address', 'phone', 'fax',
                        'email', 'website', 'discount_description', 'body_text',
                    ]);

                    $partner->update([
                        'contact_person' => $detail->contactPerson,
                        'street_address' => $detail->streetAddress,
                        'phone' => $detail->phone,
                        'fax' => $detail->fax,
                        'mobile' => $detail->mobile,
                        'email' => $detail->email,
                        'website' => $detail->website,
                        'image_url' => $detail->imageUrl,
                        'discount_description' => $detail->discountDescription,
                        'body_text' => $detail->bodyText,
                        'detail_hash' => $newHash,
                        'details_fetched' => true,
                        'details_fetched_at' => now(),
                    ]);

                    if ($partner->wasRecentlyCreated || ! $partner->wasChanged()) {
                        // First fetch, no diff to log beyond creation
                    }

                    $this->logChange($partner, 'detail_updated', [
                        'old' => $oldValues,
                        'new' => $partner->only([
                            'contact_person', 'street_address', 'phone', 'fax',
                            'email', 'website', 'discount_description', 'body_text',
                        ]),
                    ]);

                    $stats['updated']++;
                } else {
                    $partner->update([
                        'details_fetched' => true,
                        'details_fetched_at' => now(),
                    ]);
                    $stats['unchanged']++;
                }
            } catch (\Exception $e) {
                $stats['errors']++;
                report($e);
            }
        }

        return $stats;
    }

    private function syncCategories(Partner $partner, array $categoryNames, Collection $allCategories): void
    {
        $categoryIds = [];
        foreach ($categoryNames as $name) {
            $slug = Str::slug($name);
            $category = $allCategories->get($slug);
            if (! $category) {
                $category = Category::firstOrCreate(
                    ['slug' => $slug],
                    ['name' => $name],
                );
                $allCategories->put($slug, $category);
            }
            $categoryIds[] = $category->id;
        }
        $partner->categories()->sync($categoryIds);
    }

    private function logChange(Partner $partner, string $event, ?array $changes = null): void
    {
        ChangeLog::create([
            'partner_id' => $partner->id,
            'event' => $event,
            'changes' => $changes,
            'detected_at' => now(),
        ]);
    }
}
