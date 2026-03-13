<?php

namespace App\Http\Controllers;

use App\Jobs\RunArtisanCommandJob;
use App\Models\Category;
use App\Models\CommandRun;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CommandController extends Controller
{
    private const AVAILABLE_COMMANDS = [
        'redcard:parse-listing' => [
            'label' => 'Sync Listing',
            'description' => 'RedCard-Partnerliste abrufen und synchronisieren',
            'parameters' => [
                ['name' => 'dry_run', 'label' => 'Dry Run', 'type' => 'boolean', 'default' => false],
            ],
        ],
        'redcard:parse-details' => [
            'label' => 'Fetch Details',
            'description' => 'Detail-Seiten der Partner abrufen',
            'parameters' => [
                ['name' => 'category', 'label' => 'Kategorie', 'type' => 'select', 'options' => []],
                ['name' => 'only_new', 'label' => 'Nur neue', 'type' => 'boolean', 'default' => false],
                ['name' => 'limit', 'label' => 'Limit', 'type' => 'number', 'default' => 50],
            ],
        ],
        'redcard:sync' => [
            'label' => 'Full Sync',
            'description' => 'Listing + Details komplett synchronisieren',
            'parameters' => [
                ['name' => 'full', 'label' => 'Alle Details', 'type' => 'boolean', 'default' => false],
                ['name' => 'details_limit', 'label' => 'Details Limit', 'type' => 'number', 'default' => 50],
            ],
        ],
        'redcard:sync-bosid' => [
            'label' => 'BOS-ID Sync',
            'description' => 'Partner als Bonuses an BOS-ID übertragen',
            'parameters' => [
                ['name' => 'dry_run', 'label' => 'Dry Run', 'type' => 'boolean', 'default' => false],
                ['name' => 'category', 'label' => 'Kategorie', 'type' => 'select', 'options' => []],
                ['name' => 'batch_size', 'label' => 'Batch Size', 'type' => 'number', 'default' => 10],
            ],
        ],
    ];

    public function index()
    {
        $runs = CommandRun::orderByDesc('created_at')->limit(20)->get();

        $commands = self::AVAILABLE_COMMANDS;
        $categories = Category::orderBy('name')->pluck('name', 'slug');
        $commands['redcard:parse-details']['parameters'][0]['options'] = $categories;
        $commands['redcard:sync-bosid']['parameters'][1]['options'] = $categories;

        return Inertia::render('commands/index', [
            'runs' => $runs,
            'availableCommands' => $commands,
        ]);
    }

    public function run(Request $request)
    {
        $request->validate([
            'command' => 'required|string|in:'.implode(',', array_keys(self::AVAILABLE_COMMANDS)),
        ]);

        $command = $request->input('command');
        $params = $request->input('parameters', []);

        // Build artisan parameters from user input
        $artisanParams = [];
        $commandDef = self::AVAILABLE_COMMANDS[$command];

        foreach ($commandDef['parameters'] as $paramDef) {
            $name = $paramDef['name'];
            if (! isset($params[$name])) {
                continue;
            }

            $value = $params[$name];

            if ($paramDef['type'] === 'boolean' && $value) {
                $artisanParams["--{$name}"] = true;
            } elseif ($paramDef['type'] === 'select' && $value) {
                $artisanParams["--{$name}"] = $value;
            } elseif ($paramDef['type'] === 'number' && $value) {
                $artisanParams["--{$name}"] = (int) $value;
            }
        }

        $run = CommandRun::create([
            'command' => $command,
            'parameters' => $artisanParams,
            'status' => 'pending',
        ]);

        RunArtisanCommandJob::dispatch($run->id);

        return back()->with('success', 'Command gestartet.');
    }

    public function show(CommandRun $commandRun)
    {
        return Inertia::render('commands/show', [
            'commandRun' => $commandRun,
        ]);
    }
}
