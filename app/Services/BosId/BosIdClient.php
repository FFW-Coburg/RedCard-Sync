<?php

namespace App\Services\BosId;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class BosIdClient
{
    private string $baseUrl;
    private string $email;
    private string $password;
    private string $customerId;
    private int $requestDelayMs;

    private ?string $token = null;
    private ?float $tokenObtainedAt = null;

    private const TOKEN_LIFETIME_SECONDS = 240; // 4 min safety buffer (actual: 5 min)

    public function __construct()
    {
        $this->baseUrl = rtrim(config('bosid.api_url'), '/');
        $this->email = config('bosid.email');
        $this->password = config('bosid.password');
        $this->customerId = config('bosid.customer_id');
        $this->requestDelayMs = (int) config('bosid.request_delay_ms', 200);
    }

    public function getCustomerId(): string
    {
        return $this->customerId;
    }

    public function login(): void
    {
        $this->logApi('LOGIN', 'POST', '/api/v1/accounts/login', ['email' => $this->email]);

        $response = $this->http()->post('/api/v1/accounts/login', [
            'email' => $this->email,
            'password' => $this->password,
        ]);

        $this->logApiResponse('LOGIN', $response);

        if (! $response->successful()) {
            throw new RuntimeException('BOS-ID login failed: '.$response->status().' '.$response->body());
        }

        $data = $response->json();
        $this->token = $data['token'];
        $this->tokenObtainedAt = microtime(true);

        $this->log()->info('BOS-ID: Login successful.', [
            'response_keys' => array_keys($data),
        ]);
    }

    public function ensureAuthenticated(): void
    {
        if (! $this->token) {
            $this->log()->debug('BOS-ID: No token, logging in...');
            $this->login();

            return;
        }

        $elapsed = microtime(true) - $this->tokenObtainedAt;

        if ($elapsed >= self::TOKEN_LIFETIME_SECONDS) {
            $this->log()->debug("BOS-ID: Token expired ({$elapsed}s elapsed), refreshing...");
            try {
                $this->refreshToken();
            } catch (\Exception $e) {
                $this->log()->warning('BOS-ID: Token refresh failed, re-logging in.', [
                    'error' => $e->getMessage(),
                ]);
                $this->login();
            }
        }
    }

    private function refreshToken(): void
    {
        $this->logApi('REFRESH', 'POST', '/api/v1/accounts/token/refresh');

        $response = $this->authedHttp()->post('/api/v1/accounts/token/refresh', [
            'token' => $this->token,
            'validityMinutes' => 60,
        ]);

        $this->logApiResponse('REFRESH', $response);

        if (! $response->successful()) {
            throw new RuntimeException('BOS-ID token refresh failed: '.$response->status());
        }

        $this->token = $response->json('token');
        $this->tokenObtainedAt = microtime(true);

        $this->log()->info('BOS-ID: Token refreshed.');
    }

    // ----- Bonus CRUD -----

    public function getBonuses(): array
    {
        $this->ensureAuthenticated();
        $this->delay();

        $this->logApi('GET_BONUSES', 'GET', '/api/v1/bonuses');
        $response = $this->authedHttp()->get('/api/v1/bonuses');
        $this->logApiResponse('GET_BONUSES', $response);

        if (! $response->successful()) {
            throw new RuntimeException('BOS-ID: Failed to fetch bonuses: '.$response->status());
        }

        return $response->json();
    }

    public function getBonus(string $id): array
    {
        $this->ensureAuthenticated();
        $this->delay();

        $this->logApi('GET_BONUS', 'GET', "/api/v1/bonuses/{$id}");
        $response = $this->authedHttp()->get("/api/v1/bonuses/{$id}");
        $this->logApiResponse('GET_BONUS', $response);

        if (! $response->successful()) {
            throw new RuntimeException("BOS-ID: Failed to fetch bonus {$id}: ".$response->status());
        }

        return $response->json();
    }

    public function createBonus(array $data): array
    {
        $this->ensureAuthenticated();
        $this->delay();

        $this->logApi('CREATE_BONUS', 'POST', '/api/v1/bonuses', $data);
        $response = $this->authedHttp()->post('/api/v1/bonuses', $data);
        $this->logApiResponse('CREATE_BONUS', $response);

        if (! $response->successful()) {
            throw new RuntimeException('BOS-ID: Failed to create bonus: '.$response->status().' '.$response->body());
        }

        $json = $response->json();
        $this->log()->info("BOS-ID: Bonus created with ID: {$json['id']}");

        return $json;
    }

    public function updateBonus(string $id, array $data): void
    {
        $this->ensureAuthenticated();
        $this->delay();

        $this->logApi('UPDATE_BONUS', 'PUT', "/api/v1/bonuses/{$id}", $data);
        $response = $this->authedHttp()->put("/api/v1/bonuses/{$id}", $data);
        $this->logApiResponse('UPDATE_BONUS', $response);

        if (! $response->successful()) {
            throw new RuntimeException("BOS-ID: Failed to update bonus {$id}: ".$response->status().' '.$response->body());
        }
    }

    public function deleteBonus(string $id): void
    {
        $this->ensureAuthenticated();
        $this->delay();

        $this->logApi('DELETE_BONUS', 'DELETE', "/api/v1/bonuses/{$id}");
        $response = $this->authedHttp()->delete("/api/v1/bonuses/{$id}");
        $this->logApiResponse('DELETE_BONUS', $response);

        if (! $response->successful()) {
            throw new RuntimeException("BOS-ID: Failed to delete bonus {$id}: ".$response->status());
        }
    }

    // ----- Organisations -----

    /**
     * Fetch all organisation IDs for the customer via the API.
     */
    public function getOrganisationIds(): array
    {
        $this->ensureAuthenticated();
        $this->delay();

        $url = "/api/v1/organisations?customer_id={$this->customerId}";

        $this->logApi('GET_ORGS_LIST', 'GET', $url);
        $response = $this->authedHttp()->get($url);
        $this->logApiResponse('GET_ORGS_LIST', $response);

        if (! $response->successful()) {
            $this->log()->error('BOS-ID: Failed to fetch organisations.', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [];
        }

        $organisations = $response->json();
        $ids = array_values(array_map(fn (array $org) => $org['id'], $organisations));

        $this->log()->info('BOS-ID: Fetched organisations via API.', [
            'count' => count($ids),
            'ids' => $ids,
            'names' => array_column($organisations, 'name'),
        ]);

        return $ids;
    }

    /**
     * Assign ALL organisations to a bonus (replaces any previous assignment).
     * Sends a flat JSON array of organisation UUIDs, matching the portal behavior.
     */
    public function setOrganisations(string $bonusId, array $organisationIds): void
    {
        $this->ensureAuthenticated();
        $this->delay();

        $body = json_encode(array_values($organisationIds));

        $this->logApi('SET_ORGS', 'PUT', "/api/v1/bonuses/{$bonusId}/organisations", [
            'organisation_ids' => $organisationIds,
            'raw_body' => $body,
        ]);

        $response = $this->authedHttp()
            ->withBody($body, 'application/json')
            ->put("/api/v1/bonuses/{$bonusId}/organisations");

        $this->logApiResponse('SET_ORGS', $response);

        if (! $response->successful()) {
            throw new RuntimeException(
                "BOS-ID: Failed to set organisations for bonus {$bonusId}: {$response->status()} — {$response->body()}"
            );
        }

        $this->log()->info("BOS-ID: Organisations assigned to bonus {$bonusId}.", [
            'count' => count($organisationIds),
        ]);
    }

    public function getOrganisations(string $bonusId): array
    {
        $this->ensureAuthenticated();
        $this->delay();

        $this->logApi('GET_ORGS', 'GET', "/api/v1/bonuses/{$bonusId}/organisations");
        $response = $this->authedHttp()->get("/api/v1/bonuses/{$bonusId}/organisations");
        $this->logApiResponse('GET_ORGS', $response);

        if (! $response->successful()) {
            throw new RuntimeException("BOS-ID: Failed to fetch organisations for bonus {$bonusId}: ".$response->status());
        }

        return $response->json();
    }

    // ----- HTTP helpers -----

    private function http(): PendingRequest
    {
        return Http::baseUrl($this->baseUrl)
            ->withHeaders(['X-Requested-With' => 'XMLHttpRequest'])
            ->retry(3, 1000, throw: false)
            ->timeout(30);
    }

    private function authedHttp(): PendingRequest
    {
        return $this->http()
            ->withToken($this->token);
    }

    private function delay(): void
    {
        if ($this->requestDelayMs > 0) {
            usleep($this->requestDelayMs * 1000);
        }
    }

    private function log(): \Psr\Log\LoggerInterface
    {
        return Log::channel('commands');
    }

    private function logApi(string $action, string $method, string $url, mixed $body = null): void
    {
        $context = ['method' => $method, 'url' => $this->baseUrl.$url];

        if ($body !== null) {
            $context['body'] = $body;
        }

        $this->log()->debug("BOS-ID API >>> [{$action}] {$method} {$url}", $context);
    }

    private function logApiResponse(string $action, Response $response): void
    {
        $this->log()->debug("BOS-ID API <<< [{$action}] {$response->status()}", [
            'status' => $response->status(),
            'body' => mb_substr($response->body(), 0, 2000),
        ]);
    }
}
