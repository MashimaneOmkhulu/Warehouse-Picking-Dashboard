import { anthropic } from "@ai-sdk/anthropic";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Return a mock response during deployment
    return new Response(
      JSON.stringify({
        message: "Anthropic API is currently in maintenance mode. Please check back later.",
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
    const result = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      messages: messages,
      system: "You are a helpful AI assistant",
      stream: true
    });
    
    return new Response(result.body, {
      headers: {
        "Content-Type": "text/event-stream"
      }
    });
    */
  } catch (error) {
    console.error("Anthropic API error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred with the Anthropic API" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}
