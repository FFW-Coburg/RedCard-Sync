<?php

return [
    'api_url' => env('BOSID_API_URL', 'https://api.bos-id.de'),
    'email' => env('BOSID_EMAIL'),
    'password' => env('BOSID_PASSWORD'),
    'customer_id' => env('BOSID_CUSTOMER_ID'),
    'request_delay_ms' => env('BOSID_REQUEST_DELAY_MS', 200),

    'default_category' => 'Sonstiges',

    'category_mapping' => [
        'Auto & Mobiles' => 'Mobilität',
        'Bauen & Wohnen' => 'Einrichtung',
        'Computer & Co.' => 'Multimedia',
        'Dienstleistungen' => 'Dienstleistung',
        'Essen & Trinken' => 'Gastronomie',
        'Finanzen' => 'Dienstleistung',
        'Freizeit - Sport & Unterhaltung' => 'Sonstiges',
        'Für Feuerwehren' => 'Sonstiges',
        'Gesundheit, Optik & Beauty' => 'Gesundheit',
        'Kommunikation' => 'Multimedia',
        'Kunst & Kultur' => 'Kultur',
        'Mode & Bekleidung' => 'Shopping',
        'Online-Shops' => 'Shopping',
        'Papier & Büro' => 'Shopping',
        'Reisen & Unterkünfte' => 'Sonstiges',
        'Vermischtes / Sonstige' => 'Sonstiges',
    ],
];
