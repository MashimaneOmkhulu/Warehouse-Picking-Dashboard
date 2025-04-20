import { NextRequest, NextResponse } from 'next/server';

// Mark as Edge runtime to avoid Node.js bundling issues
export const runtime = 'edge';

// POST /api/auth/login - Authenticate user credentials
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }
    
    // Since Firebase auth can't run in Edge runtime, we'll use a client-side authentication approach
    // This endpoint will be modified to work with the new authentication flow
    return NextResponse.json({ 
      error: 'Authentication is handled client-side in this deployment',
      redirectTo: '/login'
    }, { status: 501 });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
} 