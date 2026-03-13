<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Partner extends Model
{
    protected $fillable = [
        'external_id',
        'name',
        'postal_code',
        'city',
        'detail_url',
        'contact_person',
        'street_address',
        'phone',
        'fax',
        'mobile',
        'email',
        'website',
        'image_url',
        'discount_description',
        'body_text',
        'listing_hash',
        'detail_hash',
        'details_fetched',
        'is_active',
        'details_fetched_at',
        'bosid_bonus_id',
        'bosid_synced_at',
    ];

    protected function casts(): array
    {
        return [
            'details_fetched' => 'boolean',
            'is_active' => 'boolean',
            'details_fetched_at' => 'datetime',
            'bosid_synced_at' => 'datetime',
        ];
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class);
    }

    public function changeLogs(): HasMany
    {
        return $this->hasMany(ChangeLog::class);
    }
}
