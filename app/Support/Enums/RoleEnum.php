<?php

namespace App\Support\Enums;

enum RoleEnum: string {
    case SuperAdmin = 'SuperAdmin';
    case Admin = 'Admin';
    case Instructor = 'Instructor';
    case Student = 'Student';
}
