<?php

namespace App\Services\BosId;

use App\Models\Partner;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\Console\Output\OutputInterface;

class BosIdSyncService
{
    private ?OutputInterface $output = null;

    public function __construct(
        private BosIdClient $client,
    ) {}

    public function setOutput(OutputInterface $output): void
    {
        $this->output = $output;
    }

    /**
     * @return array{created: int, updated: int, skipped: int, errors: int, details: array}
     */
    public function sync(bool $dryRun = false, ?string $category = null, int $batchSize = 10): array
    {
        $stats = ['created' => 0, 'updated' => 0, 'skipped' => 0, 'errors' => 0, 'details' => []];
        $log = Log::channel('commands');

        // Load partners with details
        $query = Partner::where('details_fetched', true)->where('is_active', true);

        if ($category) {
            $query->whereHas('categories', function ($q) use ($category) {
                $q->where('slug', Str::slug($category))
                    ->orWhere('name', $category);
            });
        }

        $partners = $query->with('categories')->get();
        $total = $partners->count();

        $log->info("BOS-ID Sync: {$total} partners to sync".($dryRun ? ' (DRY RUN)' : ''));
        $this->verbose("Partners to sync: {$total}");

        if ($total === 0) {
            return $stats;
        }

        $orgIds = [];
        if (! $dryRun) {
            $this->verbose('Logging in to BOS-ID API...');
            $this->client->login();

            $orgIds = $this->client->getOrganisationIds();
            $log->info('BOS-ID Sync: Using '.count($orgIds).' organisation(s)', ['org_ids' => $orgIds]);
            $this->verbose('Organisation IDs: '.json_encode($orgIds));

            if (empty($orgIds)) {
                $log->warning('BOS-ID Sync: No organisation IDs found! Bonuses will have no organisations assigned.');
                $this->verbose('<error>WARNING: No organisation IDs found via API! Organisations will NOT be assigned.</error>');
            }
        }

        foreach ($partners->chunk($batchSize) as $batchIndex => $batch) {
            $log->info('BOS-ID Sync: Processing batch '.($batchIndex + 1));
            $this->verbose("--- Batch ".($batchIndex + 1)." ---");

            foreach ($batch as $partner) {
                try {
                    $payload = $this->mapPartnerToBonus($partner);

                    $this->verbose("Partner: {$partner->name}");
                    $this->verbose("  Categories (RedCard): ".implode(', ', $partner->categories->pluck('name')->toArray()));
                    $this->verbose("  Categories (BOS-ID):  ".implode(', ', $payload['categories']));

                    if ($dryRun) {
                        $action = $partner->bosid_bonus_id ? 'would update' : 'would create';
                        $stats[$partner->bosid_bonus_id ? 'updated' : 'created']++;
                        $stats['details'][] = "[DRY RUN] {$action}: {$partner->name}";
                        $log->info("BOS-ID Sync: {$action} — {$partner->name}");

                        continue;
                    }

                    if ($partner->bosid_bonus_id) {
                        // Update existing bonus
                        $this->verbose("  Action: UPDATE (bonus {$partner->bosid_bonus_id})");

                        $this->verbose("  → PUT organisations (".count($orgIds)." org IDs)...");
                        $this->client->setOrganisations($partner->bosid_bonus_id, $orgIds);

                        $this->verbose("  → PUT bonus payload...");
                        $updatePayload = collect($payload)->except('start_at')->all();
                        $this->client->updateBonus($partner->bosid_bonus_id, $updatePayload);

                        // Verify organisations were assigned
                        $this->verifyOrganisations($partner->bosid_bonus_id, $orgIds);

                        $partner->update(['bosid_synced_at' => now()]);
                        $stats['updated']++;
                        $stats['details'][] = "Updated: {$partner->name}";
                        $log->info("BOS-ID Sync: Updated bonus for {$partner->name} ({$partner->bosid_bonus_id})");
                    } else {
                        // Create new bonus
                        $this->verbose("  Action: CREATE");

                        $this->verbose("  → POST create bonus...");
                        $response = $this->client->createBonus($payload);
                        $bonusId = $response['id'];
                        $this->verbose("  ← Bonus created: {$bonusId}");

                        $this->verbose("  → PUT organisations (".count($orgIds)." org IDs)...");
                        $this->client->setOrganisations($bonusId, $orgIds);

                        // Verify organisations were assigned
                        $this->verifyOrganisations($bonusId, $orgIds);

                        $partner->update([
                            'bosid_bonus_id' => $bonusId,
                            'bosid_synced_at' => now(),
                        ]);

                        $stats['created']++;
                        $stats['details'][] = "Created: {$partner->name} → {$bonusId}";
                        $log->info("BOS-ID Sync: Created bonus for {$partner->name} → {$bonusId}");
                    }
                } catch (\Exception $e) {
                    $stats['errors']++;
                    $stats['details'][] = "Error: {$partner->name} — {$e->getMessage()}";
                    $this->verbose("  <error>ERROR: {$e->getMessage()}</error>");
                    $log->error("BOS-ID Sync: Error syncing {$partner->name}", [
                        'partner_id' => $partner->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }

        $log->info('BOS-ID Sync: Complete', [
            'created' => $stats['created'],
            'updated' => $stats['updated'],
            'skipped' => $stats['skipped'],
            'errors' => $stats['errors'],
        ]);

        return $stats;
    }

    private function verifyOrganisations(string $bonusId, array $expectedOrgIds): void
    {
        try {
            $actual = $this->client->getOrganisations($bonusId);
            $actualIds = array_column($actual, 'organisation_id');
            $missing = array_diff($expectedOrgIds, $actualIds);

            if (empty($missing)) {
                $this->verbose("  ✓ Verified: ".count($actualIds)." organisation(s) assigned");
            } else {
                $this->verbose("  <error>✗ Verification FAILED: ".count($missing)." org(s) missing!</error>");
                $this->verbose("    Expected: ".json_encode($expectedOrgIds));
                $this->verbose("    Actual:   ".json_encode($actualIds));
                Log::channel('commands')->error("BOS-ID Sync: Organisation verification failed for bonus {$bonusId}", [
                    'expected' => $expectedOrgIds,
                    'actual' => $actualIds,
                    'missing' => array_values($missing),
                ]);
            }
        } catch (\Exception $e) {
            $this->verbose("  <comment>Could not verify organisations: {$e->getMessage()}</comment>");
            Log::channel('commands')->warning("BOS-ID Sync: Could not verify organisations for {$bonusId}", [
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function mapCategories(array $names): array
    {
        $mapping = config('bosid.category_mapping');
        $default = config('bosid.default_category');

        $mapped = array_map(fn (string $name) => $mapping[$name] ?? $default, $names);

        return array_values(array_unique($mapped));
    }

    private function mapPartnerToBonus(Partner $partner): array
    {
        $descriptionText = $partner->body_text ?? '';
        $discountText = $partner->discount_description ?? '';

        if (strlen($descriptionText) > 500) {
            Log::channel('commands')->warning('BOS-ID Sync: Truncating description_text for partner', [
                'partner' => $partner->name,
                'partner_id' => $partner->id,
                'original_length' => strlen($descriptionText),
            ]);
            $descriptionText = Str::limit($descriptionText, 497, '...');
        }

        if (strlen($discountText) > 500) {
            Log::channel('commands')->warning('BOS-ID Sync: Truncating discount_text for partner', [
                'partner' => $partner->name,
                'partner_id' => $partner->id,
                'original_length' => strlen($discountText),
            ]);
            $discountText = Str::limit($discountText, 497, '...');
        }

        return [
            'status' => $partner->is_active ? 'active' : 'inactive',
            'categories' => $this->mapCategories($partner->categories->pluck('name')->toArray()),
            'code' => '',
            'global' => false,
            'headline_text' => $partner->name,
            'description_text' => $descriptionText,
            'discount_text' => $discountText,
            'email' => $partner->email ?? '',
            'phone_number' => $this->normalizePhone($partner->phone ?? ''),
            'website_url' => $partner->website ?? '',
            'shop_url' => '',
            'image_id' => null,
            'address' => [
                'country' => 'DE',
                'state' => 'Bayern',
                'city' => $partner->city ?? '',
                'zip_code' => $partner->postal_code ?? '',
                'street_address' => $partner->street_address ?? '',
                'additional' => '',
                'name' => $partner->name,
            ],
            'customer_id' => $this->client->getCustomerId(),
            'start_at' => now()->startOfDay()->toIso8601String(),
            'end_at' => now()->addYears(10)->endOfDay()->toIso8601String(),
        ];
    }

    private function normalizePhone(string $phone): string
    {
        $normalized = preg_replace('/[^+\d]/', '', $phone);

        return substr($normalized, 0, 15);
    }

    private function verbose(string $message): void
    {
        if ($this->output?->isVerbose()) {
            $this->output->writeln($message);
        }
    }
}
