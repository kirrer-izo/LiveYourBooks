<?php

namespace Database\Factories;

use App\Enums\Genre;
use App\Enums\LifeArea;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Process\FakeProcessResult;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Book>
 */
class BookFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $progress = fake()->numberBetween(0, 100);
        return [
            'user_id' => User::find(1),
            'title' => fake()->unique()->sentence(3, true),
            'author' => fake()->name(),
            'genre' => $this->faker->randomElement(array_map(fn($c) => $c->value, Genre::cases())),
            'life_area' => $this->faker->randomElement(array_map(fn($c) => $c->value, LifeArea::cases())),
            'cover_img' => fake()->imageUrl(200, 300, 'books', true, 'Faker'),
            'progress' => $progress,
            'is_completed' => $progress === 100,
            
        ];
    }
}
