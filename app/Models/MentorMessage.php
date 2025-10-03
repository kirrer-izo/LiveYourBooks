<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MentorMessage extends Model
{
    /** @use HasFactory<\Database\Factories\MentorMessageFactory> */
    use HasFactory;

    protected $fillable = [
        'mentor_id',
        'sender',
        'message',
        'meta',
    ];

    public function mentor()
    {
        return $this->belongsTo(Mentor::class);
    }
}
