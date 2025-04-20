import { openai } from "@ai-sdk/openai";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Return a mock response during deployment
    return new Response(
      JSON.stringify({
        message: "OpenAI API is currently in maintenance mode. Please check back later.",
        status: "maintenance"
      }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
    
    /* Uncomment this code to use the API in production
    const result = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      stream: true
    });
    
    return new Response(result.body, {
      headers: {
        "Content-Type": "text/event-stream"
      }
    });
    */
  } catch (error) {
    console.error("OpenAI API error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred with the OpenAI API" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}
