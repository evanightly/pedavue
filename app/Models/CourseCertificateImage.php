<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseCertificateImage extends Model {
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'course_id',
        'file_path',
        'position_x',
        'position_y',
        'width',
        'height',
        'z_index',
        'label',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array {
        return [
            'position_x' => 'integer',
            'position_y' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
            'z_index' => 'integer',
        ];
    }

    public function course(): BelongsTo {
        return $this->belongsTo(Course::class);
    }
}
