<?php

namespace App\Support\Enums;

use App\Traits\Enums\Arrayable;

enum RoleEnum: string {
    use Arrayable;

    case SuperAdmin = 'SuperAdmin';
    case Admin = 'Admin';
    case Instructor = 'Instructor';
    case Student = 'Student';
}
