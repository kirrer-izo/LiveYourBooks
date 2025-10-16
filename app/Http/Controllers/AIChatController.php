<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class AIChatController extends Controller
{
    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'book' => 'nullable|string',
            'mentor' => 'nullable|string',
        ]);

        $prompt = $request->string('message');
        $book = $request->string('book');
        $mentor = $request->string('mentor');

        $apiKey = config('services.slack.openai.aiapi_key');
        if (!$apiKey) {
            return response()->json(['error' => 'Missing OPENAI_API_KEY'], 500);
        }

        $model = config('services.openai.model', env('OPENAI_MODEL', 'gpt-3.5-turbo'));

        $system = trim(
            ($mentor ? "You are acting as {$mentor}, " : "You are an AI mentor, ") .
            "focused on practical, concise guidance from personal development books.\n" .
            ($book ? "When possible, ground advice in key principles from '{$book}'.\n" : '') .
            "Rules:\n" .
            "- Give clear, actionable steps or checklists.\n" .
            "- Be concise and avoid long paragraphs.\n" .
            "- Encourage reflection and small experiments.\n" .
            "- Do not provide therapy or medical advice; redirect to professionals if needed.\n" .
            "- Prefer structure: brief summary, then numbered steps, then a short nudge."
        );

        try {
            $client = new Client([
                'base_uri' => 'https://api.openai.com',
                'timeout' => 30,
            ]);

            $response = $client->post('/v1/chat/completions', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => $system],
                        ['role' => 'user', 'content' => (string)$prompt],
                    ],
                    'temperature' => 0.7,
                    'max_tokens' => 500,
                ],
            ]);

            $data = json_decode((string) $response->getBody(), true);
            $text = $data['choices'][0]['message']['content'] ?? '';
            return response()->json(['reply' => $text]);
        } catch (\Throwable $e) {
            Log::error('AI chat error', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'AI service error'], 500);
        }
    }
}
