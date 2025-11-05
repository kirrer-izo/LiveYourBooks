<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Habit;
use App\Models\Task;
use App\Models\Journal;
use App\Services\SummaryGeneratorService;
use App\Services\GeminiAIService;
use Carbon\Carbon;
use Mockery;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SummaryGeneratorServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Mock the GeminiAIService
        $this->mockGeminiService = Mockery::mock(GeminiAIService::class);
        $this->app->instance(GeminiAIService::class, $this->mockGeminiService);
    }

    public function test_can_generate_weekly_summary()
    {
        // Create a user
        $user = User::factory()->create();

        // Create some test data
        $habit = Habit::factory()->create([
            'user_id' => $user->id,
            'frequency' => 'daily',
            'is_active' => true,
        ]);

        $task = Task::factory()->create([
            'user_id' => $user->id,
            'is_completed' => false,
        ]);

        $journal = Journal::factory()->create([
            'user_id' => $user->id,
            'word_count' => 150,
        ]);

        // Mock the AI response
        $this->mockGeminiService
            ->shouldReceive('generateBookResponse')
            ->once()
            ->andReturn([
                'reply' => 'Great progress this week! You maintained consistency in your habits and completed most of your tasks.',
            ]);

        // Create the service
        $service = new SummaryGeneratorService($this->mockGeminiService);

        // Generate summary
        $summary = $service->generateWeeklySummary($user);

        // Assertions
        $this->assertIsArray($summary);
        $this->assertArrayHasKey('period', $summary);
        $this->assertArrayHasKey('data', $summary);
        $this->assertArrayHasKey('insights', $summary);
        $this->assertArrayHasKey('generated_at', $summary);

        // Check data structure
        $this->assertArrayHasKey('habits', $summary['data']);
        $this->assertArrayHasKey('tasks', $summary['data']);
        $this->assertArrayHasKey('journals', $summary['data']);
        $this->assertArrayHasKey('overall_consistency', $summary['data']);

        // Check habit metrics
        $this->assertEquals(1, $summary['data']['habits']['total_habits']);
        $this->assertIsFloat($summary['data']['habits']['average_completion_rate']);

        // Check task metrics
        $this->assertEquals(1, $summary['data']['tasks']['total_tasks']);
        $this->assertEquals(0, $summary['data']['tasks']['completed_tasks']);

        // Check journal metrics
        $this->assertEquals(1, $summary['data']['journals']['total_entries']);
        $this->assertEquals(150, $summary['data']['journals']['total_words']);
    }

    public function test_handles_empty_data_gracefully()
    {
        $user = User::factory()->create();

        // Mock the AI response
        $this->mockGeminiService
            ->shouldReceive('generateBookResponse')
            ->once()
            ->andReturn([
                'reply' => 'No data available for this week. Start building habits and completing tasks to see insights.',
            ]);

        $service = new SummaryGeneratorService($this->mockGeminiService);
        $summary = $service->generateWeeklySummary($user);

        $this->assertIsArray($summary);
        $this->assertEquals(0, $summary['data']['habits']['total_habits']);
        $this->assertEquals(0, $summary['data']['tasks']['total_tasks']);
        $this->assertEquals(0, $summary['data']['journals']['total_entries']);
    }

    public function test_calculates_consistency_correctly()
    {
        $user = User::factory()->create();

        // Create habits with different completion rates
        $habit1 = Habit::factory()->create([
            'user_id' => $user->id,
            'frequency' => 'daily',
            'is_active' => true,
        ]);

        $habit2 = Habit::factory()->create([
            'user_id' => $user->id,
            'frequency' => 'daily',
            'is_active' => true,
        ]);

        // Create tasks with different completion rates
        $task1 = Task::factory()->create([
            'user_id' => $user->id,
            'is_completed' => true,
        ]);

        $task2 = Task::factory()->create([
            'user_id' => $user->id,
            'is_completed' => false,
        ]);

        // Mock the AI response
        $this->mockGeminiService
            ->shouldReceive('generateBookResponse')
            ->once()
            ->andReturn([
                'reply' => 'Your consistency is improving!',
            ]);

        $service = new SummaryGeneratorService($this->mockGeminiService);
        $summary = $service->generateWeeklySummary($user);

        // Check that consistency is calculated
        $this->assertIsFloat($summary['data']['overall_consistency']);
        $this->assertGreaterThanOrEqual(0, $summary['data']['overall_consistency']);
        $this->assertLessThanOrEqual(100, $summary['data']['overall_consistency']);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
