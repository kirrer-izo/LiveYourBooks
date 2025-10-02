<?php

namespace App\Enums;

enum JournalTag: string
{
    case REFLECTION = 'Reflection';
    case PROGRESS = 'Progress';
    case GRATITUDE = 'Gratitude';
    case GOALS = 'Goals';
    case MINDFULNESS = 'Mindfulness';
    case EMOTIONS = 'Emotions';
    case CHALLENGES = 'Challenges';
    case BREAKTHROUGH = 'Breakthrough';
    case INSPIRATION = 'Inspiration';
    case LEARNING = 'Learning';
    case PRODUCTIVITY = 'Productivity';
    case RELATIONSHIPS = 'Relationships';
    case HEALTH = 'Health';
    case SPIRITUALITY = 'Spirituality';
    case PURPOSE = 'Purpose';

}