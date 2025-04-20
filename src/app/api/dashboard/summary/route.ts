import { NextRequest, NextResponse } from 'next/server';
import { getDashboardSummary } from '@/lib/firebase/firebaseUtils';

// Helper function to check if the user is authenticated
const getAuthenticatedUserRole = async (req: NextRequest) => {
  // In a real application, you'd verify JWT token or session
  // For this example, we'll simulate authentication status
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  // In a real app, you'd verify the token
  // For now, we'll just check if it's the admin token
  return authHeader === 'Bearer admin_token' ? 'admin' : 'viewer';
};

// GET /api/dashboard/summary - Get aggregated dashboard data
export async function GET(req: NextRequest) {
  try {
    // For read operations, we'll allow both admin and viewer roles
    const userRole = await getAuthenticatedUserRole(req);
    
    if (!userRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');
    
    // Convert parameters
    const date = dateParam ? new Date(dateParam) : undefined;
    
    // Get dashboard summary
    const dashboardData = await getDashboardSummary(date);
    
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error in GET /api/dashboard/summary:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 