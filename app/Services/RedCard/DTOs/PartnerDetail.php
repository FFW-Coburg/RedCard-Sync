<?php

namespace App\Services\RedCard\DTOs;

readonly class PartnerDetail
{
    public function __construct(
        public ?string $contactPerson = null,
        public ?string $streetAddress = null,
        public ?string $postalCode = null,
        public ?string $city = null,
        public ?string $phone = null,
        public ?string $fax = null,
        public ?string $mobile = null,
        public ?string $email = null,
        public ?string $website = null,
        public ?string $imageUrl = null,
        public ?string $discountDescription = null,
        public ?string $bodyText = null,
    ) {}

    public function detailHash(): string
    {
        return hash('sha256', json_encode(get_object_vars($this)));
    }
}
