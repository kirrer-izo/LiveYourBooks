<?php

namespace Tests\Feature;

use App\Models\Journal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class JournalEncryptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_journal_content_is_encrypted_in_database()
    {
        $user = User::factory()->create();
        $originalContent = 'This is my secret journal entry.';

        $journal = Journal::create([
            'user_id' => $user->id,
            'title' => 'My Secret',
            'content' => $originalContent,
            'entry_date' => now(),
        ]);

        // Verify it is readable via Eloquent
        $this->assertEquals($originalContent, $journal->content);
        $this->assertEquals($originalContent, $journal->fresh()->content);

        // Verify it is encrypted in the database
        $databaseRecord = DB::table('journals')->where('id', $journal->id)->first();
        $this->assertNotEquals($originalContent, $databaseRecord->content);
        $this->assertNotEmpty($databaseRecord->content);
        
        // Ensure it's not just base64 encoded or something trivial (basic check)
        $this->assertStringNotContainsString('secret', $databaseRecord->content);
    }
}
