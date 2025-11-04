<?php

namespace App\Jobs;

use App\Models\GrowthReport;
use App\Services\GrowthReportService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class GenerateGrowthReportInsights implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private GrowthReport $report,
        private $journalEntries = null
    ) {}

    /**
     * Execute the job.
     */
    public function handle(GrowthReportService $growthReportService): void
    {
        try {
            $growthReportService->generateAIInsights($this->report, $this->journalEntries);
        } catch (\Exception $e) {
            Log::error('Failed to generate growth report insights', [
                'report_id' => $this->report->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
