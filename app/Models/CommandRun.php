<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CommandRun extends Model
{
    protected $fillable = [
        'command',
        'parameters',
        'status',
        'output',
        'result',
        'started_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'parameters' => 'array',
            'result' => 'array',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }
}
