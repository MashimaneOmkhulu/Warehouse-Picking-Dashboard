import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { verify } from 'jsonwebtoken';

// Helper function to check if the user is an admin
const getAuthenticatedUser = async (req: NextRequest) => {
  const token = req.cookies.get('auth_token')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    // Verify JWT token
    const decoded = verify(token, process.env.JWT_SECRET || 'warehouse-dashboard-secret');
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

// GET /api/users - List all users (admin only)
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user || (user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    const users: any[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        username: data.username,
        role: data.role,
        created_at: data.created_at,
        last_login: data.last_login
      });
    });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/users/:id - Remove user (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user || (user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Prevent deleting yourself
    if (id === (user as any).uid) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }
    
    await deleteDoc(doc(db, 'users', id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/users/:id:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 