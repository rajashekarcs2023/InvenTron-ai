import { OpenAI } from 'openai';

// Initialize OpenAI with the API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this environment variable is correctly set
});

export async function POST(request) {
  const { items } = await request.json();

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Use a chat model
      messages: [
        { role: "user", content: `Based on the following ingredients: ${items.join(", ")}. Can you suggest some recipes?` }
      ],
      temperature: 0,
      max_tokens: 50,
    });

    return new Response(JSON.stringify({ recipes: response.choices[0].message.content }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error.code === 'insufficient_quota') {
      console.error("Quota exceeded. Please check your plan and billing details.");
      return new Response(JSON.stringify({ error: "Quota exceeded. Please try again later." }), { status: 429 });
    } else if (error.code === 'invalid_api_key') {
      console.error("Invalid API key provided. Please check your API key.");
      return new Response(JSON.stringify({ error: "Invalid API key. Please check your API key." }), { status: 401 });
    } else {
      console.error("Error fetching recipe recommendations:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch recipes." }), { status: 500 });
    }
  }
}