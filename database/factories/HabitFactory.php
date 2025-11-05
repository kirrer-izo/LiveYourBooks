<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Habit>
 */
class HabitFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->words(3, true),
            'frequency' => $this->faker->randomElement(['daily', 'weekly', 'monthly']),
            'streak' => $this->faker->numberBetween(0, 30),
            'target' => $this->faker->numberBetween(1, 7),
            'is_active' => $this->faker->boolean(80),
        ];
    }
}
