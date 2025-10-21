<?php

namespace App\Support\Enums;

use App\Traits\Enums\Arrayable;

enum EnrollmentRequestEnum: string {
    use Arrayable;

    case Pending = 'Pending';
    case Approved = 'Approved';
    case Rejected = 'Rejected';
}
