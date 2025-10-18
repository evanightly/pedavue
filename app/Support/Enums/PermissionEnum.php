<?php

namespace App\Support\Enums;

use App\Traits\Enums\Arrayable;

enum PermissionEnum: string {
    use Arrayable;

    case ReadUser = 'ReadUser';
    case CreateUser = 'CreateUser';
    case UpdateUser = 'UpdateUser';
    case DeleteUser = 'DeleteUser';

    case ReadRole = 'ReadRole';
    case CreateRole = 'CreateRole';
    case UpdateRole = 'UpdateRole';
    case DeleteRole = 'DeleteRole';

    case ReadPermission = 'ReadPermission';
    case CreatePermission = 'CreatePermission';
    case UpdatePermission = 'UpdatePermission';
    case DeletePermission = 'DeletePermission';

    case ReadCourse = 'ReadCourse';
    case CreateCourse = 'CreateCourse';
    case UpdateCourse = 'UpdateCourse';
    case DeleteCourse = 'DeleteCourse';

    case ReadEnrollment = 'ReadEnrollment';
    case CreateEnrollment = 'CreateEnrollment';
    case UpdateEnrollment = 'UpdateEnrollment';
    case DeleteEnrollment = 'DeleteEnrollment';
}
