<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            'Auto & Mobiles',
            'Bauen & Wohnen',
            'Computer & Co.',
            'Dienstleistungen',
            'Essen & Trinken',
            'Finanzen',
            'Freizeit - Sport & Unterhaltung',
            'Für Feuerwehren',
            'Gesundheit, Optik & Beauty',
            'Kommunikation',
            'Kunst & Kultur',
            'Mode & Bekleidung',
            'Online-Shops',
            'Papier & Büro',
            'Reisen & Unterkünfte',
            'Vermischtes / Sonstige',
        ];

        foreach ($categories as $name) {
            Category::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name],
            );
        }
    }
}
