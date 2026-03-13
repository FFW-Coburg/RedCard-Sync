<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partners', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('external_id')->unique();

            // Listing fields
            $table->string('name');
            $table->string('postal_code')->nullable();
            $table->string('city')->nullable();
            $table->string('detail_url');

            // Detail fields (nullable until detail page is fetched)
            $table->string('contact_person')->nullable();
            $table->string('street_address')->nullable();
            $table->string('phone')->nullable();
            $table->string('fax')->nullable();
            $table->string('mobile')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->string('image_url')->nullable();
            $table->text('discount_description')->nullable();
            $table->text('body_text')->nullable();

            // Sync fields
            $table->string('listing_hash', 64)->nullable();
            $table->string('detail_hash', 64)->nullable();
            $table->boolean('details_fetched')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamp('details_fetched_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partners');
    }
};
