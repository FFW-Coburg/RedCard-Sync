<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            $table->string('bosid_bonus_id')->nullable()->after('is_active');
            $table->timestamp('bosid_synced_at')->nullable()->after('bosid_bonus_id');
        });
    }

    public function down(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            $table->dropColumn(['bosid_bonus_id', 'bosid_synced_at']);
        });
    }
};
