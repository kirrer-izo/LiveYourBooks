<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Services\GeminiAIService;
use App\Models\User;
use App\Models\Book;
use App\Models\Habit;
use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;

class GeminiAIServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_gemini_service_can_be_instantiated()
    {
        // Mock the config to avoid requiring actual API key in tests
        config(['services.gemini.api_key' => 'test-key']);
        
        // This should work now since we have a test key
        $service = new GeminiAIService();
        $this->assertInstanceOf(GeminiAIService::class, $service);
    }

    public function test_gemini_service_requires_api_key()
    {
        config(['services.gemini.api_key' => null]);
        
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('GEMINI_API_KEY is not configured');
        
        new GeminiAIService();
    }

    public function test_user_context_building()
    {
        // Create a test user
        $user = User::factory()->create();
        
        // Create some test data
        $book = Book::factory()->create([
            'user_id' => $user->id,
            'title' => 'Test Book',
            'author' => 'Test Author',
            'genre' => 'Self-Help',
            'life_area' => 'Personal Development',
            'progress' => 50,
            'is_completed' => false,
        ]);

        $habit = Habit::factory()->create([
            'user_id' => $user->id,
            'name' => 'Daily Reading',
            'streak' => 5,
            'target' => 30,
            'is_active' => true,
            'book_id' => $book->id,
        ]);

        $task = Task::factory()->create([
            'user_id' => $user->id,
            'title' => 'Complete Chapter 3',
            'description' => 'Read and take notes on chapter 3',
            'is_completed' => false,
            'book_id' => $book->id,
            'priority' => 'high',
        ]);

        // Mock the service to test context building
        $service = new class extends GeminiAIService {
            public function testBuildUserContext($user, $bookId = null) {
                return $this->buildUserContext($user, $bookId);
            }
        };

        // Use reflection to call the private method
        $reflection = new \ReflectionClass($service);
        $method = $reflection->getMethod('buildUserContext');
        $method->setAccessible(true);
        
        $context = $method->invoke($service, $user, $book->id);

        // Assert the context is built correctly
        $this->assertEquals($user->name, $context['user_name']);
        $this->assertCount(1, $context['habits']);
        $this->assertEquals('Daily Reading', $context['habits'][0]['name']);
        $this->assertCount(1, $context['tasks']);
        $this->assertEquals('Complete Chapter 3', $context['tasks'][0]['title']);
        $this->assertNotNull($context['book_context']);
        $this->assertEquals('Test Book', $context['book_context']['title']);
    }

    public function test_system_prompt_building()
    {
        $user = User::factory()->create(['name' => 'John Doe']);
        
        $book = Book::factory()->create([
            'user_id' => $user->id,
            'title' => 'Atomic Habits',
            'author' => 'James Clear',
            'genre' => 'Self-Help',
            'life_area' => 'Personal Development',
        ]);

        $habit = Habit::factory()->create([
            'user_id' => $user->id,
            'name' => 'Morning Exercise',
            'streak' => 10,
            'target' => 30,
            'is_active' => true,
        ]);

        $task = Task::factory()->create([
            'user_id' => $user->id,
            'title' => 'Read 20 pages',
            'is_completed' => false,
            'book_id' => $book->id,
            'priority' => 'high',
        ]);

        // Mock the service to test prompt building
        $service = new class extends GeminiAIService {
            public function testBuildSystemPrompt($userContext) {
                return $this->buildSystemPrompt($userContext);
            }
        };

        // Use reflection to call the private method
        $reflection = new \ReflectionClass($service);
        $method = $reflection->getMethod('buildSystemPrompt');
        $method->setAccessible(true);
        
        $userContext = [
            'user_name' => 'John Doe',
            'habits' => [
                [
                    'name' => 'Morning Exercise',
                    'streak' => 10,
                    'target' => 30,
                    'is_completed_today' => true,
                ]
            ],
            'tasks' => [
                [
                    'title' => 'Read 20 pages',
                    'description' => 'Daily reading goal',
                    'due_date' => '2024-01-15',
                    'priority' => 'high',
                ]
            ],
            'book_context' => [
                'title' => 'Atomic Habits',
                'author' => 'James Clear',
                'genre' => 'Self-Help',
                'life_area' => 'Personal Development',
                'progress' => 50,
                'is_completed' => false,
            ]
        ];
        
        $prompt = $method->invoke($service, $userContext);

        // Assert the prompt contains expected elements
        $this->assertStringContainsString('John Doe', $prompt);
        $this->assertStringContainsString('Morning Exercise', $prompt);
        $this->assertStringContainsString('Read 20 pages', $prompt);
        $this->assertStringContainsString('Atomic Habits', $prompt);
        $this->assertStringContainsString('James Clear', $prompt);
        $this->assertStringContainsString('personalized advice', $prompt);
    }
}
