<?php

namespace App\Http\Controllers;

use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ArticleController extends Controller
{
    public function index()
    {
        return Article::orderBy('published_at')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string',
            'slug' => 'nullable|string',
            'body' => 'nullable|string',
            'original_url' => 'nullable|url',
            'references' => 'nullable|array',
            'published_at' => 'nullable|date',
        ]);

        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['title']);
        }

        $article = Article::create($data);
        return response()->json($article, 201);
    }

    public function show(Article $article)
    {
        return $article;
    }

    public function update(Request $request, Article $article)
    {
        $data = $request->validate([
            'title' => 'sometimes|string',
            'slug' => 'sometimes|string',
            'body' => 'nullable|string',
            'original_url' => 'nullable|url',
            'references' => 'nullable|array',
            'published_at' => 'nullable|date',
        ]);

        if (isset($data['title']) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['title']);
        }

        $article->update($data);
        return $article;
    }

    public function destroy(Article $article)
    {
        $article->delete();
        return response()->json(null, 204);
    }
}
