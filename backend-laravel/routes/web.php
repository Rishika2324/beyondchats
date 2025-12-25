<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ArticleController;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('api')->group(function () {
    Route::get('health', function () { return response()->json(['ok' => true]); });
    Route::apiResource('articles', ArticleController::class);
});
