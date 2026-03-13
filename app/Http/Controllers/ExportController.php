<?php

namespace App\Http\Controllers;

use App\Services\RedCard\ExportService;
use Illuminate\Http\Request;

class ExportController extends Controller
{
    public function __construct(
        private ExportService $exportService,
    ) {}

    public function partners(Request $request)
    {
        $data = $this->exportService->exportPartners($request->input('category'));
        $filename = 'partners_'.now()->format('Y-m-d_His').'.json';

        return response()->json($data)
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }

    public function changes(Request $request)
    {
        $data = $this->exportService->exportChanges($request->input('since'));
        $filename = 'changes_'.now()->format('Y-m-d_His').'.json';

        return response()->json($data)
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }
}
