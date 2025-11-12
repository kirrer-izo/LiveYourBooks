<?php
 
 namespace App\Enums;

 enum UserRole: string
 {
        case Admin = 'admin';
        case User = 'user';

        /**
         * Get a human readable label for the role.
         */
        public function label(): string
        {
            return match ($this) {
                self::Admin => 'Administrator',
                self::User => 'Member',
            };
        }

        /**
         * Return all roles formatted for select inputs.
         *
         * @return array<int, array<string, string>>
         */
        public static function options(): array
        {
            return collect(self::cases())
                ->map(fn (self $role) => [
                    'value' => $role->value,
                    'label' => $role->label(),
                ])
                ->values()
                ->all();
        }
 }