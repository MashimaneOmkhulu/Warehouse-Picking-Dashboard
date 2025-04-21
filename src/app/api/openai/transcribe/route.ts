import { NextResponse } from "next/server";
import fs from "fs";
import OpenAI from "openai";

// Check if OpenAI API key is available
const apiKey = process.env.OPENAI_API_KEY;

// Only initialize the OpenAI client if the API key is available
let openai: OpenAI | null = null;
try {
  if (apiKey) {
    openai = new OpenAI({ apiKey });
  }
} catch (error) {
  console.error("Failed to initialize OpenAI client:", error);
}

export async function POST(req: Request) {
  // Check if OpenAI client is available
  if (!openai) {
    return NextResponse.json(
      { error: "OpenAI API key is not configured" },
      { status: 501 }
    );
  }

  try {
    const body = await req.json();
    const base64Audio = body.audio;

    // Convert the base64 audio data to a Buffer
    const audio = Buffer.from(base64Audio, "base64");

    // Define the file path for storing the temporary WAV file
    const filePath = "tmp/input.wav";

    // Ensure the directory exists
    const dir = "tmp";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write the audio data to a temporary WAV file synchronously
    fs.writeFileSync(filePath, audio);

    // Create a readable stream from the temporary WAV file
    const readStream = fs.createReadStream(filePath);

    const data = await openai.audio.transcriptions.create({
      file: readStream,
      model: "whisper-1",
    });

    // Remove the temporary file after successful processing
    fs.unlinkSync(filePath);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error processing audio:", error);
    return NextResponse.json(
      { error: "Error processing transcription request" },
      { status: 500 }
    );
  }
}
