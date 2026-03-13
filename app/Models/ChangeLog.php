<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChangeLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'partner_id',
        'event',
        'changes',
        'detected_at',
    ];

    protected function casts(): array
    {
        return [
            'changes' => 'array',
            'detected_at' => 'datetime',
        ];
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }
}
