<?php

namespace App\Enums;

enum ThinkerType: string
{
    case MARCUS_AURELIUS = 'marcus_aurelius';
    case CARL_JUNG = 'carl_jung';
    case JAMES_CLEAR = 'james_clear';
    case STOIC_PHILOSOPHERS = 'stoic_philosophers';
    case BUDDHIST_PHILOSOPHERS = 'buddhist_philosophers';
    case VICTOR_FRANKL = 'victor_frankl';
    case RYAN_HOLIDAY = 'ryan_holiday';
    case TIM_FERRISS = 'tim_ferriss';
    case BRENE_BROWN = 'brene_brown';
    case ANGELA_DUCKWORTH = 'angela_duckworth';
    case DANIEL_GOLEMAN = 'daniel_goleman';
    case MALCOLM_GLADWELL = 'malcolm_gladwell';
    case SIMON_SINEK = 'simon_sinek';
    case ADAM_GRANT = 'adam_grant';
    case CUSTOM = 'custom';

    public function getDisplayName(): string
    {
        return match($this) {
            self::MARCUS_AURELIUS => 'Marcus Aurelius',
            self::CARL_JUNG => 'Carl Jung',
            self::JAMES_CLEAR => 'James Clear',
            self::STOIC_PHILOSOPHERS => 'Stoic Philosophers',
            self::BUDDHIST_PHILOSOPHERS => 'Buddhist Philosophers',
            self::VICTOR_FRANKL => 'Viktor Frankl',
            self::RYAN_HOLIDAY => 'Ryan Holiday',
            self::TIM_FERRISS => 'Tim Ferriss',
            self::BRENE_BROWN => 'Brené Brown',
            self::ANGELA_DUCKWORTH => 'Angela Duckworth',
            self::DANIEL_GOLEMAN => 'Daniel Goleman',
            self::MALCOLM_GLADWELL => 'Malcolm Gladwell',
            self::SIMON_SINEK => 'Simon Sinek',
            self::ADAM_GRANT => 'Adam Grant',
            self::CUSTOM => 'Custom Thinker',
        };
    }

    public function getDescription(): string
    {
        return match($this) {
            self::MARCUS_AURELIUS => 'Roman Emperor and Stoic philosopher, known for "Meditations"',
            self::CARL_JUNG => 'Swiss psychiatrist and psychoanalyst, founder of analytical psychology',
            self::JAMES_CLEAR => 'Author of "Atomic Habits", expert on habit formation and behavior change',
            self::STOIC_PHILOSOPHERS => 'Ancient Greek and Roman philosophers focused on virtue and self-control',
            self::BUDDHIST_PHILOSOPHERS => 'Eastern philosophers emphasizing mindfulness and inner peace',
            self::VICTOR_FRANKL => 'Holocaust survivor and psychiatrist, author of "Man\'s Search for Meaning"',
            self::RYAN_HOLIDAY => 'Modern Stoic philosopher and author of "The Daily Stoic"',
            self::TIM_FERRISS => 'Entrepreneur and author of "The 4-Hour Workweek"',
            self::BRENE_BROWN => 'Research professor and author on vulnerability and courage',
            self::ANGELA_DUCKWORTH => 'Psychologist and author of "Grit: The Power of Passion and Perseverance"',
            self::DANIEL_GOLEMAN => 'Psychologist and author of "Emotional Intelligence"',
            self::MALCOLM_GLADWELL => 'Journalist and author of "Outliers" and "Blink"',
            self::SIMON_SINEK => 'Leadership expert and author of "Start With Why"',
            self::ADAM_GRANT => 'Organizational psychologist and author of "Give and Take"',
            self::CUSTOM => 'Your own personal thinker or mentor',
        };
    }

    public function getAdviceStyle(): string
    {
        return match($this) {
            self::MARCUS_AURELIUS => 'Practical, philosophical, focused on virtue and self-discipline',
            self::CARL_JUNG => 'Psychological, introspective, focused on individuation and self-discovery',
            self::JAMES_CLEAR => 'Systematic, evidence-based, focused on habit formation and behavior change',
            self::STOIC_PHILOSOPHERS => 'Philosophical, practical, focused on virtue and emotional resilience',
            self::BUDDHIST_PHILOSOPHERS => 'Mindful, compassionate, focused on inner peace and wisdom',
            self::VICTOR_FRANKL => 'Existential, meaningful, focused on finding purpose in suffering',
            self::RYAN_HOLIDAY => 'Modern Stoic, practical, focused on resilience and wisdom',
            self::TIM_FERRISS => 'Experimental, optimization-focused, focused on efficiency and learning',
            self::BRENE_BROWN => 'Vulnerable, authentic, focused on courage and connection',
            self::ANGELA_DUCKWORTH => 'Research-based, focused on perseverance and passion',
            self::DANIEL_GOLEMAN => 'Emotional intelligence, focused on self-awareness and relationships',
            self::MALCOLM_GLADWELL => 'Data-driven, focused on patterns and insights',
            self::SIMON_SINEK => 'Leadership-focused, purpose-driven, focused on inspiration',
            self::ADAM_GRANT => 'Collaborative, focused on giving and psychological safety',
            self::CUSTOM => 'Personalized based on your own philosophy and values',
        };
    }

    public static function getPredefinedThinkers(): array
    {
        return array_filter(
            self::cases(),
            fn($case) => $case !== self::CUSTOM
        );
    }

    public static function getCustomThinker(): self
    {
        return self::CUSTOM;
    }
}