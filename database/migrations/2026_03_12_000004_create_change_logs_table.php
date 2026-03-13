<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('change_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->string('event'); // created, updated, deactivated, reactivated, detail_updated
            $table->json('changes')->nullable();
            $table->timestamp('detected_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('change_logs');
    }
};
