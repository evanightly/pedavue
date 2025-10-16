<?php

namespace App\Support\Enums;

use App\Traits\Enums\Arrayable;

enum PermissionEnum: string {
    use Arrayable;

    case ReadUser = 'ReadUser';
    case CreateUser = 'CreateUser';
    case UpdateUser = 'UpdateUser';
    case DeleteUser = 'DeleteUser';
}
