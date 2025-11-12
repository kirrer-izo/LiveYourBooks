<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\BookCatalogEntry;
use App\Models\IntegrationSetting;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Enums\UserRole;

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
                'role' => UserRole::User,
                'is_active' => true,
            ]
        );

        User::firstOrCreate(
            ['email' => config('app.admin_email', 'admin@example.com')],
            [
                'name' => 'System Administrator',
                'password' => Hash::make(config('app.admin_password', 'password')),
                'email_verified_at' => now(),
                'role' => UserRole::Admin,
                'is_active' => true,
            ]
        );

        BookCatalogEntry::firstOrCreate(
            ['title' => 'Atomic Habits'],
            [
                'author' => 'James Clear',
                'genre' => 'Personal Development',
                'life_area' => 'Habits',
                'isbn' => '9780735211292',
                'description' => 'An easy & proven way to build good habits and break bad ones.',
                'is_featured' => true,
            ]
        );

        BookCatalogEntry::firstOrCreate(
            ['title' => 'Deep Work'],
            [
                'author' => 'Cal Newport',
                'genre' => 'Productivity',
                'life_area' => 'Career',
                'isbn' => '9781455586691',
                'description' => 'Rules for focused success in a distracted world.',
                'is_featured' => false,
            ]
        );

        IntegrationSetting::firstOrCreate(
            ['service' => 'openai'],
            [
                'display_name' => 'OpenAI API',
                'is_active' => true,
                'status' => 'operational',
                'settings' => [
                    'api_key' => substr(config('services.openai.api_key', 'sk-placeholder'), 0, 8).'***',
                    'model' => config('services.openai.model', 'gpt-4o-mini'),
                ],
                'notes' => 'Update with production API key before launch.',
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
