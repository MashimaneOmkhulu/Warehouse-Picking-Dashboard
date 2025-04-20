import { NextRequest, NextResponse } from 'next/server';
import { getPerformanceData, addPerformanceRecord } from '@/lib/firebase/firebaseUtils';
import { Timestamp } from 'firebase/firestore';

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

// GET /api/performance - Get performance data with filters
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
    const pickerIdParam = url.searchParams.get('picker_id');
    const hourParam = url.searchParams.get('hour');
    
    // Convert parameters
    const date = dateParam ? new Date(dateParam) : undefined;
    const pickerId = pickerIdParam || undefined;
    const hour = hourParam ? parseInt(hourParam) : undefined;
    
    // Get performance data
    const performanceData = await getPerformanceData(date, pickerId, hour);
    
    return NextResponse.json(performanceData);
  } catch (error) {
    console.error('Error in GET /api/performance:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/performance - Add new performance record
export async function POST(req: NextRequest) {
  try {
    // Write operations require admin role
    const userRole = await getAuthenticatedUserRole(req);
    
    if (!userRole || userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await req.json();
    
    // Validate required fields
    if (
      !data.picker_id || 
      data.hour === undefined || 
      data.lines_picked === undefined
    ) {
      return NextResponse.json({ 
        error: 'Picker ID, hour, and lines picked are required' 
      }, { status: 400 });
    }
    
    // Create the performance record
    const date = data.date ? new Date(data.date) : new Date();
    
    const newRecord = await addPerformanceRecord({
      picker_id: data.picker_id,
      date,
      hour: Number(data.hour),
      lines_picked: Number(data.lines_picked),
      lunch_break: data.lunch_break === true
    });
    
    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/performance:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 