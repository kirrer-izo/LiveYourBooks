<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Journal extends Model
{
    /** @use HasFactory<\Database\Factories\JournalFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'content',
        'tags',
        'entry_date'
    ];

    protected $casts = [
        'tags' => 'array',
        'entry_date' => 'date',
        'content' => 'encrypted',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
