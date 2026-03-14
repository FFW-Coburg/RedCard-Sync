<?php

namespace App\Console\Commands;

use App\Models\Category;
use Illuminate\Console\Command;

class RedcardCategories extends Command
{
    protected $signature = 'redcard:categories';

    protected $description = 'List all categories with their BOS-ID mapping';

    public function handle(): int
    {
        $mapping = config('bosid.category_mapping');
        $default = config('bosid.default_category');

        $categories = Category::withCount(['partners' => fn ($q) => $q->where('is_active', true)])
            ->orderBy('name')
            ->get();

        $this->table(
            ['Category', 'Slug', 'BOS-ID Category', 'Active Partners'],
            $categories->map(fn ($c) => [
                $c->name,
                $c->slug,
                $mapping[$c->name] ?? $default,
                $c->partners_count,
            ])->all()
        );

        return self::SUCCESS;
    }
}
