<?php

namespace Database\Factories;

use App\Models\Book;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Conversation>
 */
class ConversationFactory extends Factory
{
    protected $model = Conversation::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'mentor_id' => null,
            'book_id' => Book::factory(),
            'title' => fake()->sentence(),
            'last_message_at' => fake()->dateTimeBetween('-1 week', 'now'),
        ];
    }
}
