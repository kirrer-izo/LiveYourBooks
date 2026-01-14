<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Contracts\Encryption\DecryptException;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('journals')->whereNotNull('content')->orderBy('id')->chunk(100, function ($journals) {
            foreach ($journals as $journal) {
                try {
                    Crypt::decryptString($journal->content);
                } catch (DecryptException $e) {
                    DB::table('journals')
                        ->where('id', $journal->id)
                        ->update(['content' => Crypt::encryptString($journal->content)]);
                }
            }
        });
    }

    public function down(): void
    {
        DB::table('journals')->whereNotNull('content')->orderBy('id')->chunk(100, function ($journals) {
            foreach ($journals as $journal) {
                try {
                    $decrypted = Crypt::decryptString($journal->content);
                    DB::table('journals')
                        ->where('id', $journal->id)
                        ->update(['content' => $decrypted]);
                } catch (DecryptException $e) {
                }
            }
        });
    }
};
