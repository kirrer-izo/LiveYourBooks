<?php

namespace Database\Factories;

use App\Enums\ThinkerType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Thinker>
 */
class ThinkerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => ThinkerType::CUSTOM,
            'name' => $this->faker->name(),
            'description' => $this->faker->sentence(),
            'advice_style' => $this->faker->sentence(),
            'is_active' => true,
        ];
    }
}
