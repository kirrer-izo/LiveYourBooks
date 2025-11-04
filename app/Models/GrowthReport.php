<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GrowthReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'report_type',
        'period_start',
        'period_end',
        'consistency_score',
        'habit_metrics',
        'task_metrics',
        'streak_analysis',
        'growth_trends',
        'ai_insights',
        'recommendations',
        'is_generated',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'habit_metrics' => 'array',
        'task_metrics' => 'array',
        'streak_analysis' => 'array',
        'growth_trends' => 'array',
        'ai_insights' => 'array',
        'recommendations' => 'array',
        'is_generated' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getReportTitle(): string
    {
        $type = ucfirst($this->report_type);
        $period = $this->period_start->format('M j') . ' - ' . $this->period_end->format('M j, Y');
        return "{$type} Growth Report ({$period})";
    }

    public function getConsistencyGrade(): string
    {
        if ($this->consistency_score >= 90) return 'A+';
        if ($this->consistency_score >= 80) return 'A';
        if ($this->consistency_score >= 70) return 'B';
        if ($this->consistency_score >= 60) return 'C';
        if ($this->consistency_score >= 50) return 'D';
        return 'F';
    }
}
