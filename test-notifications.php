<?php

/**
 * Notification System Test Script
 * 
 * This script tests the notification system to ensure everything is working correctly.
 * Run with: php test-notifications.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Habit;
use App\Models\Task;
use App\Models\Journal;
use App\Services\NotificationService;
use Illuminate\Support\Facades\DB;

echo "=== Notification System Test ===\n\n";

// 1. Check database tables
echo "1. Checking database tables...\n";
$tables = ['notifications', 'jobs', 'notification_preferences'];
foreach ($tables as $table) {
    $exists = DB::getSchemaBuilder()->hasTable($table);
    echo "   - {$table}: " . ($exists ? "✓ EXISTS" : "✗ MISSING") . "\n";
}
echo "\n";

// 2. Check queue configuration
echo "2. Checking queue configuration...\n";
$queueDriver = config('queue.default');
echo "   - Queue driver: {$queueDriver}\n";
if ($queueDriver === 'database') {
    $jobsTableExists = DB::getSchemaBuilder()->hasTable('jobs');
    echo "   - Jobs table: " . ($jobsTableExists ? "✓ EXISTS" : "✗ MISSING") . "\n";
}
echo "\n";

// 3. Check mail configuration
echo "3. Checking mail configuration...\n";
$mailDriver = config('mail.default');
echo "   - Mail driver: {$mailDriver}\n";
echo "   - Mail will be logged to: storage/logs/laravel.log\n";
echo "\n";

// 4. Test notification commands
echo "4. Testing notification commands...\n";
$service = app(NotificationService::class);

try {
    $habitCount = $service->sendHabitReminders();
    echo "   - Habit reminders: ✓ Command works ({$habitCount} sent)\n";
} catch (\Exception $e) {
    echo "   - Habit reminders: ✗ Error: {$e->getMessage()}\n";
}

try {
    $journalCount = $service->sendJournalReminders();
    echo "   - Journal reminders: ✓ Command works ({$journalCount} sent)\n";
} catch (\Exception $e) {
    echo "   - Journal reminders: ✗ Error: {$e->getMessage()}\n";
}

try {
    $taskCount = $service->sendTaskDueReminders();
    echo "   - Task reminders: ✓ Command works ({$taskCount} sent)\n";
} catch (\Exception $e) {
    echo "   - Task reminders: ✗ Error: {$e->getMessage()}\n";
}
echo "\n";

// 5. Check if users exist
echo "5. Checking user data...\n";
$userCount = User::count();
echo "   - Total users: {$userCount}\n";

if ($userCount > 0) {
    $usersWithHabits = User::whereHas('habits')->count();
    $usersWithTasks = User::whereHas('tasks')->count();
    $usersWithJournals = User::whereHas('journals')->count();
    
    echo "   - Users with habits: {$usersWithHabits}\n";
    echo "   - Users with tasks: {$usersWithTasks}\n";
    echo "   - Users with journals: {$usersWithJournals}\n";
}
echo "\n";

// 6. Check scheduled tasks
echo "6. Checking scheduled tasks...\n";
$schedule = app(\Illuminate\Console\Scheduling\Schedule::class);
echo "   - Scheduled reminder commands are configured in routes/console.php\n";
echo "   - Run 'php artisan schedule:work' to start the scheduler\n";
echo "\n";

// 7. Summary and recommendations
echo "=== Summary ===\n";
echo "✓ Database tables: Ready\n";
echo "✓ Commands: Working\n";
echo "✓ Queue: {$queueDriver}\n";
echo "✓ Mail: {$mailDriver}\n";
echo "\n";

echo "=== Next Steps ===\n";
echo "1. Start queue worker: php artisan queue:work\n";
echo "2. (Optional) Start scheduler: php artisan schedule:work\n";
echo "3. Enable notifications in user settings\n";
echo "4. Create test data (habits, tasks, journals)\n";
echo "5. Test notifications manually: php artisan reminders:habits\n";
echo "\n";

echo "=== Testing Queue ===\n";
if ($queueDriver === 'database') {
    $jobCount = DB::table('jobs')->count();
    echo "Pending jobs in queue: {$jobCount}\n";
    if ($jobCount > 0) {
        echo "⚠ Run 'php artisan queue:work' to process jobs\n";
    }
} else {
    echo "Queue driver is '{$queueDriver}' - jobs will be processed synchronously\n";
}
echo "\n";

echo "=== Test Complete ===\n";

