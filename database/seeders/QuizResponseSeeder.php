<?php

namespace Database\Seeders;

use App\Models\QuizResponse;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class QuizResponseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        QuizResponse::factory(3)->create();
    }
}
