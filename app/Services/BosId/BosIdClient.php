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
    private int $rateLimitBackoffMs = 0;

    private ?string $token = null;
    private ?float $tokenObtainedAt = null;

    private const TOKEN_LIFETIME_SECONDS = 240; // 4 min safety buffer (actual: 5 min)
    private const RATE_LIMIT_INITIAL_WAIT_MS = 30_000;
    private const RATE_LIMIT_MAX_RETRIES = 5;

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
        $response = $this->request('GET_BONUSES', 'GET', '/api/v1/bonuses');

        if (! $response->successful()) {
            throw new RuntimeException('BOS-ID: Failed to fetch bonuses: '.$response->status());
        }

        return $response->json();
    }

    public function getBonus(string $id): array
    {
        $response = $this->request('GET_BONUS', 'GET', "/api/v1/bonuses/{$id}");

        if (! $response->successful()) {
            throw new RuntimeException("BOS-ID: Failed to fetch bonus {$id}: ".$response->status());
        }

        return $response->json();
    }

    public function createBonus(array $data): array
    {
        $response = $this->request('CREATE_BONUS', 'POST', '/api/v1/bonuses', $data);

        if (! $response->successful()) {
            throw new RuntimeException('BOS-ID: Failed to create bonus: '.$response->status().' '.$response->body());
        }

        $json = $response->json();
        $this->log()->info("BOS-ID: Bonus created with ID: {$json['id']}");

        return $json;
    }

    public function updateBonus(string $id, array $data): void
    {
        $response = $this->request('UPDATE_BONUS', 'PUT', "/api/v1/bonuses/{$id}", $data);

        if (! $response->successful()) {
            throw new RuntimeException("BOS-ID: Failed to update bonus {$id}: ".$response->status().' '.$response->body());
        }
    }

    public function deleteBonus(string $id): void
    {
        $response = $this->request('DELETE_BONUS', 'DELETE', "/api/v1/bonuses/{$id}");

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
        $url = "/api/v1/organisations?customer_id={$this->customerId}";
        $response = $this->request('GET_ORGS_LIST', 'GET', $url);

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
        $body = json_encode(array_values($organisationIds));

        $response = $this->request('SET_ORGS', 'PUT', "/api/v1/bonuses/{$bonusId}/organisations", null, $body);

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
        $response = $this->request('GET_ORGS', 'GET', "/api/v1/bonuses/{$bonusId}/organisations");

        if (! $response->successful()) {
            throw new RuntimeException("BOS-ID: Failed to fetch organisations for bonus {$bonusId}: ".$response->status());
        }

        return $response->json();
    }

    // ----- HTTP helpers -----

    private function request(string $action, string $method, string $url, ?array $data = null, ?string $rawBody = null): Response
    {
        $this->ensureAuthenticated();

        for ($attempt = 0; $attempt <= self::RATE_LIMIT_MAX_RETRIES; $attempt++) {
            $this->delay();

            $this->logApi($action, $method, $url, $data ?? ($rawBody ? ['raw_body' => $rawBody] : null));

            $http = $this->authedHttp();

            if ($rawBody !== null) {
                $http = $http->withBody($rawBody, 'application/json');
            }

            $response = match ($method) {
                'GET' => $http->get($url),
                'POST' => $http->post($url, $data ?? []),
                'PUT' => $rawBody !== null ? $http->put($url) : $http->put($url, $data ?? []),
                'DELETE' => $http->delete($url),
            };

            $this->logApiResponse($action, $response);

            if ($response->status() !== 429) {
                // Reset backoff on successful non-429 response
                $this->rateLimitBackoffMs = 0;

                return $response;
            }

            // 429 Too Many Requests — apply exponential backoff
            $waitMs = $this->rateLimitBackoffMs > 0
                ? $this->rateLimitBackoffMs * 2
                : self::RATE_LIMIT_INITIAL_WAIT_MS;
            $this->rateLimitBackoffMs = $waitMs;

            $waitSeconds = $waitMs / 1000;

            $this->log()->warning("BOS-ID: Rate limited (429). Waiting {$waitSeconds}s before retry.", [
                'action' => $action,
                'attempt' => $attempt + 1,
                'max_retries' => self::RATE_LIMIT_MAX_RETRIES,
                'wait_ms' => $waitMs,
            ]);

            usleep($waitMs * 1000);
        }

        throw new RuntimeException("BOS-ID: Rate limit exceeded after ".self::RATE_LIMIT_MAX_RETRIES." retries for {$action}");
    }

    private function http(): PendingRequest
    {
        return Http::baseUrl($this->baseUrl)
            ->withHeaders(['X-Requested-With' => 'XMLHttpRequest'])
            ->timeout(30);
    }

    private function authedHttp(): PendingRequest
    {
        return $this->http()
            ->withToken($this->token);
    }

    private function delay(): void
    {
        $delayMs = $this->requestDelayMs + $this->rateLimitBackoffMs;
        if ($delayMs > 0) {
            usleep($delayMs * 1000);
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
