<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create demo user
        $user = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // Run all seeders for demo data
        $this->call([
            MentorSeeder::class,
            BookSeeder::class,
            TaskSeeder::class,
            HabitSeeder::class,
            JournalSeeder::class,
            MentorMessageSeeder::class,
        ]);
    }
}
