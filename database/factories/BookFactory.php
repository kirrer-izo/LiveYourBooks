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
        return [
            'user_id' => User::query()->inRandomOrder()->value('id') ?? User::factory(),
            'title' => fake()->unique()->sentence(3, true),
            'author' => fake()->name(),
            'genre' => $this->faker->randomElement(array_map(fn($c) => $c->value, Genre::cases())),
            'life_area' => $this->faker->randomElement(array_map(fn($c) => $c->value, LifeArea::cases())),
            'cover_img' => fake()->imageUrl(200, 300, 'books', true, 'Faker'),
            'is_completed' => fake()->boolean(20),
        ];
    }
}
