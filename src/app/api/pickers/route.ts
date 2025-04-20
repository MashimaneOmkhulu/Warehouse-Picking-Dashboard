import { NextRequest, NextResponse } from 'next/server';
import { getAllPickers, createPicker, updatePicker, deletePicker } from '@/lib/firebase/firebaseUtils';
import { Picker } from '@/lib/types';

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

// GET /api/pickers - Get all pickers
export async function GET(req: NextRequest) {
  try {
    // For read operations, we'll allow both admin and viewer roles
    const userRole = await getAuthenticatedUserRole(req);
    
    if (!userRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const pickers = await getAllPickers();
    return NextResponse.json(pickers);
  } catch (error) {
    console.error('Error in GET /api/pickers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/pickers - Create a new picker
export async function POST(req: NextRequest) {
  try {
    // Write operations require admin role
    const userRole = await getAuthenticatedUserRole(req);
    
    if (!userRole || userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const pickerData = await req.json();
    
    // Validate required fields
    if (!pickerData.name || pickerData.target === undefined) {
      return NextResponse.json({ error: 'Name and target are required' }, { status: 400 });
    }
    
    // Create the picker
    const newPicker = await createPicker({
      name: pickerData.name,
      target: Number(pickerData.target),
      active: pickerData.active !== undefined ? pickerData.active : true,
      linesCompleted: 0,
      hourlyData: {}
    });
    
    return NextResponse.json(newPicker, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/pickers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/pickers/:id - Update a picker
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Write operations require admin role
    const userRole = await getAuthenticatedUserRole(req);
    
    if (!userRole || userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json({ error: 'Picker ID is required' }, { status: 400 });
    }
    
    const pickerData = await req.json();
    
    // Update the picker
    await updatePicker(id, {
      name: pickerData.name,
      target: pickerData.target !== undefined ? Number(pickerData.target) : undefined,
      active: pickerData.active
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/pickers/:id:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/pickers/:id - Delete a picker
export async function DELETE(req: NextRequest) {
  try {
    // Write operations require admin role
    const userRole = await getAuthenticatedUserRole(req);
    
    if (!userRole || userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json({ error: 'Picker ID is required' }, { status: 400 });
    }
    
    // Delete the picker
    await deletePicker(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/pickers/:id:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 