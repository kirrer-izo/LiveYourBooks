<?php 

namespace App\Enums;

enum Genre: string
{
    case FICTION = 'Fiction';
    case NON_FICTION = 'Non-fiction';
    case BIOGRAPHY = 'Biography';
    case SELF_HELP = 'Self-help';
    case PHILOSOPHY = 'Philosophy';
    case SPIRITUALITY = 'Spirituality';
    case SCIENCE = 'Science';
    case HISTORY = 'History';
    case POETRY = 'Poetry';
    case BUSINESS = 'Business';
    case PERSONAL_DEVELOPMENT = 'Personal Development';

}