<?php

namespace App\Services\RedCard\DTOs;

readonly class ListingEntry
{
    public function __construct(
        public int $externalId,
        public string $name,
        public ?string $postalCode,
        public ?string $city,
        public string $detailUrl,
        /** @var string[] */
        public array $categories,
    ) {}

    public function listingHash(): string
    {
        return hash('sha256', json_encode([
            $this->name,
            $this->postalCode,
            $this->city,
            $this->detailUrl,
            $this->categories,
        ]));
    }
}
