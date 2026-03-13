<?php

use App\Http\Controllers\ChangeLogController;
use App\Http\Controllers\CommandController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\PartnerController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('partners', [PartnerController::class, 'index'])->name('partners.index');
    Route::get('partners/{partner}', [PartnerController::class, 'show'])->name('partners.show');
    Route::post('partners/{partner}/refetch', [PartnerController::class, 'refetch'])->name('partners.refetch');

    Route::get('changes', [ChangeLogController::class, 'index'])->name('changes.index');

    Route::get('commands', [CommandController::class, 'index'])->name('commands.index');
    Route::post('commands/run', [CommandController::class, 'run'])->name('commands.run');
    Route::get('commands/runs/{commandRun}', [CommandController::class, 'show'])->name('commands.show');

    Route::post('export/partners', [ExportController::class, 'partners'])->name('export.partners');
    Route::post('export/changes', [ExportController::class, 'changes'])->name('export.changes');
});

require __DIR__.'/settings.php';
