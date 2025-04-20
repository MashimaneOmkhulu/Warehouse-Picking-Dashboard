import { NextRequest, NextResponse } from 'next/server';

// Mark as Edge runtime to avoid Node.js bundling issues
export const runtime = 'edge';

// GET /api/users - List all users (admin only)
export async function GET(req: NextRequest) {
  // Since Firebase can't run in Edge runtime, we'll use a mock response
  return NextResponse.json({ 
    message: 'This API is currently in maintenance mode. Please use the web interface to manage users.',
    status: 'maintenance'
  }, { status: 503 });
}

// DELETE /api/users/:id - Remove user (admin only)
export async function DELETE(req: NextRequest) {
  // Since Firebase can't run in Edge runtime, we'll use a mock response
  return NextResponse.json({ 
    message: 'This API is currently in maintenance mode. Please use the web interface to manage users.',
    status: 'maintenance'
  }, { status: 503 });
} 