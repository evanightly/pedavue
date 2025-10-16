<?php

namespace App\Support\Enums;

enum PermissionEnum: string {
    case ReadUser = 'ReadUser';
    case CreateUser = 'CreateUser';
    case UpdateUser = 'UpdateUser';
    case DeleteUser = 'DeleteUser';
}
