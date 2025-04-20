import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  QueryDocumentSnapshot,
  setDoc,
  writeBatch
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Picker, PickerData, HourKey } from '../types';
import { DashboardState } from '../types/warehouse';

// Auth functions
export const logoutUser = () => signOut(auth);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// Firestore functions
export const addDocument = (collectionName: string, data: any) =>
  addDoc(collection(db, collectionName), data);

export const getDocuments = async (collectionName: string) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateDocument = (collectionName: string, id: string, data: any) =>
  updateDoc(doc(db, collectionName, id), data);

export const deleteDocument = (collectionName: string, id: string) =>
  deleteDoc(doc(db, collectionName, id));

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// Types
export interface HourlyPerformance {
  id: string;
  picker_id: string;
  date: any;
  hour: number;
  lines_picked: number;
  lunch_break: boolean;
}

export interface Shift {
  id: string;
  date: any;
  start_time: any;
  end_time: any | null;
}

// Picker functions
const PICKERS_COLLECTION = 'pickers';

// Fetch all pickers from Firestore
export const fetchPickers = async (): Promise<Picker[]> => {
  try {
    const pickersCollection = collection(db, PICKERS_COLLECTION);
    const pickerSnapshot = await getDocs(pickersCollection);
    
    return pickerSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      } as Picker;
    });
  } catch (error) {
    console.error('Error fetching pickers:', error);
    return []; // Return empty array on error
  }
};

// Get all pickers (alias for fetchPickers for API consistency)
export const getAllPickers = fetchPickers;

// Add a new picker to Firestore
export const addPicker = async (pickerData: PickerData): Promise<string | null> => {
  try {
    const defaultHourlyData: Record<string, number> = {};
    ['9', '10', '11', '12', '13', '14', '15', '16', '17'].forEach(hour => {
      defaultHourlyData[hour] = 0;
    });

    const newPicker = {
      ...pickerData,
      hourlyData: pickerData.hourlyData || defaultHourlyData,
      linesCompleted: pickerData.linesCompleted || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, PICKERS_COLLECTION), newPicker);
    return docRef.id;
  } catch (error) {
    console.error('Error adding picker:', error);
    return null;
  }
};

// Create a new picker (alias for addPicker for API consistency)
export const createPicker = async (pickerData: PickerData): Promise<Picker | null> => {
  const id = await addPicker(pickerData);
  if (id) {
    return {
      id,
      ...pickerData,
      hourlyData: pickerData.hourlyData || {},
      linesCompleted: pickerData.linesCompleted || 0
    } as Picker;
  }
  return null;
};

// Update an existing picker
export const updatePicker = async (id: string, pickerData: Partial<PickerData>): Promise<boolean> => {
  try {
    const pickerRef = doc(db, PICKERS_COLLECTION, id);
    await updateDoc(pickerRef, {
      ...pickerData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error(`Error updating picker ${id}:`, error);
    return false;
  }
};

// Delete a picker by ID
export const deletePicker = async (id: string): Promise<boolean> => {
  try {
    const pickerRef = doc(db, PICKERS_COLLECTION, id);
    await deleteDoc(pickerRef);
    return true;
  } catch (error) {
    console.error(`Error deleting picker ${id}:`, error);
    return false;
  }
};

// Update a picker's performance data
export const updatePickerPerformance = async (
  pickerId: string, 
  hour: HourKey, 
  linesCompleted: number
): Promise<boolean> => {
  try {
    const pickerRef = doc(db, PICKERS_COLLECTION, pickerId);
    const pickerDoc = await getDoc(pickerRef);
    
    if (!pickerDoc.exists()) {
      console.error(`Picker ${pickerId} not found`);
      return false;
    }
    
    const pickerData = pickerDoc.data() as Picker;
    const currentHourlyData = pickerData.hourlyData || {};
    const currentHourValue = currentHourlyData[hour] || 0;
    
    // Calculate the new total lines completed
    const newHourValue = currentHourValue + linesCompleted;
    const totalCurrentLines = pickerData.linesCompleted || 0;
    const newTotalLines = totalCurrentLines + linesCompleted;
    
    await updateDoc(pickerRef, {
      [`hourlyData.${hour}`]: newHourValue,
      linesCompleted: newTotalLines,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error(`Error updating performance for picker ${pickerId}:`, error);
    return false;
  }
};

// Update multiple pickers in bulk
export const updatePickersInBulk = async (
  updates: Array<{ id: string; data: Partial<PickerData> }>
): Promise<boolean> => {
  try {
    // Check if we can use batch processing
    if (updates.length <= 500) { // Firestore has a limit of 500 operations per batch
      const batch = writeBatch(db);
      
      updates.forEach(update => {
        const pickerRef = doc(db, PICKERS_COLLECTION, update.id);
        batch.update(pickerRef, {
          ...update.data,
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
    } else {
      // If too many updates, process them individually
      for (const update of updates) {
        await updatePicker(update.id, update.data);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error updating pickers in bulk:', error);
    return false;
  }
};

// Performance functions
export const getPerformanceData = async (
  date?: Date,
  pickerId?: string,
  hour?: number
): Promise<HourlyPerformance[]> => {
  try {
    const performanceCollection = collection(db, 'hourly_performance');
    let q = query(performanceCollection);
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      q = query(
        performanceCollection, 
        where('date', '>=', Timestamp.fromDate(startOfDay)),
        where('date', '<=', Timestamp.fromDate(endOfDay))
      );
    }
    
    if (pickerId) {
      q = query(performanceCollection, where('picker_id', '==', pickerId));
    }
    
    if (hour !== undefined) {
      q = query(performanceCollection, where('hour', '==', hour));
    }
    
    const snapshot = await getDocs(q);
    const performanceData: HourlyPerformance[] = [];
    
    snapshot.forEach(doc => {
      performanceData.push({
        id: doc.id,
        ...doc.data()
      } as HourlyPerformance);
    });
    
    return performanceData;
  } catch (error) {
    console.error('Error getting performance data:', error);
    throw error;
  }
};

export const addPerformanceRecord = async (
  data: Omit<HourlyPerformance, 'id'>
): Promise<HourlyPerformance> => {
  try {
    // Check if a record for this picker, date, and hour already exists
    const performanceCollection = collection(db, 'hourly_performance');
    
    // Convert the date to a Timestamp if it's not already
    const dateTimestamp = data.date instanceof Timestamp ? 
      data.date : 
      Timestamp.fromDate(new Date(data.date));
    
    const q = query(
      performanceCollection,
      where('picker_id', '==', data.picker_id),
      where('hour', '==', data.hour),
      where('date', '==', dateTimestamp)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      // Update existing record
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, {
        lines_picked: data.lines_picked,
        lunch_break: data.lunch_break
      });
      
      return {
        id: docRef.id,
        ...data
      };
    } else {
      // Create new record
      const newData = {
        ...data,
        date: dateTimestamp
      };
      
      const docRef = await addDoc(performanceCollection, newData);
      
      return {
        id: docRef.id,
        ...newData
      };
    }
  } catch (error) {
    console.error('Error adding performance record:', error);
    throw error;
  }
};

// Shift functions
export const getCurrentShift = async (): Promise<Shift | null> => {
  try {
    const shiftsCollection = collection(db, 'shifts');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const q = query(
      shiftsCollection,
      where('date', '>=', Timestamp.fromDate(today)),
      orderBy('date', 'desc'),
      orderBy('start_time', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const shiftData = snapshot.docs[0].data();
    return {
      id: snapshot.docs[0].id,
      ...shiftData
    } as Shift;
  } catch (error) {
    console.error('Error getting current shift:', error);
    throw error;
  }
};

export const startShift = async (): Promise<Shift> => {
  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const shiftsCollection = collection(db, 'shifts');
    const docRef = await addDoc(shiftsCollection, {
      date: Timestamp.fromDate(today),
      start_time: Timestamp.fromDate(now),
      end_time: null
    });
    
    return {
      id: docRef.id,
      date: Timestamp.fromDate(today),
      start_time: Timestamp.fromDate(now),
      end_time: null
    };
  } catch (error) {
    console.error('Error starting shift:', error);
    throw error;
  }
};

export const endShift = async (shiftId: string): Promise<void> => {
  try {
    const shiftRef = doc(db, 'shifts', shiftId);
    const now = new Date();
    
    await updateDoc(shiftRef, {
      end_time: Timestamp.fromDate(now)
    });
  } catch (error) {
    console.error('Error ending shift:', error);
    throw error;
  }
};

// Dashboard summary
export const getDashboardSummary = async (date?: Date): Promise<any> => {
  try {
    const pickers = await fetchPickers();
    
    const selectedDate = date || new Date();
    const performanceData = await getPerformanceData(selectedDate);
    
    // Calculate total lines picked
    const totalLines = performanceData.reduce((sum, record) => sum + record.lines_picked, 0);
    
    // Calculate lines per picker
    const pickerPerformance: Record<string, number> = {};
    performanceData.forEach(record => {
      if (!pickerPerformance[record.picker_id]) {
        pickerPerformance[record.picker_id] = 0;
      }
      pickerPerformance[record.picker_id] += record.lines_picked;
    });
    
    // Get best and worst performers
    let bestPerformer = { id: '', lines: 0 };
    let worstPerformer = { id: '', lines: Number.MAX_VALUE };
    
    Object.entries(pickerPerformance).forEach(([pickerId, lines]) => {
      if (lines > bestPerformer.lines) {
        bestPerformer = { id: pickerId, lines };
      }
      if (lines < worstPerformer.lines || worstPerformer.id === '') {
        worstPerformer = { id: pickerId, lines };
      }
    });
    
    // Get hourly breakdown
    const hourlyBreakdown: Record<number, number> = {};
    performanceData.forEach(record => {
      if (!hourlyBreakdown[record.hour]) {
        hourlyBreakdown[record.hour] = 0;
      }
      hourlyBreakdown[record.hour] += record.lines_picked;
    });
    
    // Format for frontend
    const hourlyAnalysis = Object.entries(hourlyBreakdown).map(([hour, lines]) => ({
      hour: parseInt(hour),
      lines,
      // Calculate average lines per picker for this hour
      average: lines / pickers.filter(p => p.active).length
    }));
    
    return {
      date: selectedDate,
      totalLines,
      activePickers: pickers.filter(p => p.active).length,
      averageLinesPerPicker: pickers.length > 0 ? totalLines / pickers.filter(p => p.active).length : 0,
      bestPerformer: {
        ...pickers.find(p => p.id === bestPerformer.id),
        lines: bestPerformer.lines
      },
      worstPerformer: {
        ...pickers.find(p => p.id === worstPerformer.id),
        lines: worstPerformer.lines
      },
      hourlyAnalysis
    };
  } catch (error) {
    console.error('Error getting dashboard summary:', error);
    throw error;
  }
};

// Dashboard state functions
export const saveDashboardState = async (
  userId: string,
  stateName: string,
  dashboardState: DashboardState
): Promise<string> => {
  try {
    console.log(`Starting saveDashboardState with state name "${stateName}"`);
    
    // Validate inputs
    if (!stateName || stateName.trim() === '') {
      throw new Error('Invalid state name provided');
    }
    
    if (!dashboardState || typeof dashboardState !== 'object') {
      throw new Error('Invalid dashboard state object');
    }
    
    // Debug: Check state content validity
    console.log('Dashboard state structure check:', {
      hasPickers: Boolean(dashboardState.pickers),
      pickerCount: dashboardState.pickers?.length || 0,
      hasMetrics: Boolean(dashboardState.performanceMetrics),
      stateSize: JSON.stringify(dashboardState).length
    });
    
    // Create a reference to the shared states collection
    const sharedStatesRef = collection(db, 'sharedStates');
    console.log('Created collection reference to sharedStates');
    
    // Check if a state with this name already exists
    const q = query(
      sharedStatesRef,
      where('name', '==', stateName)
    );
    
    console.log('Checking if state already exists with name:', stateName);
    const querySnapshot = await getDocs(q);
    console.log('Query result:', { empty: querySnapshot.empty, size: querySnapshot.size });
    
    let docId;
    
    if (!querySnapshot.empty) {
      // State with this name exists, update it
      const stateDoc = querySnapshot.docs[0];
      docId = stateDoc.id;
      console.log('Updating existing state with ID:', docId);
      
      try {
        await updateDoc(doc(db, 'sharedStates', docId), {
          state: dashboardState,
          updatedAt: serverTimestamp(),
          lastUpdatedBy: userId // Keep track of who last updated it
        });
        console.log('State updated successfully');
      } catch (updateError) {
        console.error('Error during updateDoc:', updateError);
        throw updateError;
      }
    } else {
      // Create a new state
      console.log('Creating new shared state document');
      try {
        const docRef = await addDoc(sharedStatesRef, {
          name: stateName,
          state: dashboardState,
          createdAt: serverTimestamp(),
          createdBy: userId, // Track who created it for audit purposes
          updatedAt: serverTimestamp(),
          lastUpdatedBy: userId
        });
        docId = docRef.id;
        console.log('Created new state with ID:', docId);
      } catch (addError) {
        console.error('Error during addDoc:', addError);
        throw addError;
      }
    }
    
    // Verify the document was created/updated properly
    try {
      const verifyDoc = await getDoc(doc(db, 'sharedStates', docId));
      if (verifyDoc.exists()) {
        console.log('Verified document exists in Firestore');
        return docId;
      } else {
        throw new Error('Document verification failed');
      }
    } catch (verifyError) {
      console.error('Error verifying document:', verifyError);
      return docId; // Return the ID anyway since the save might have succeeded
    }
  } catch (error) {
    console.error('Error saving shared state:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};

export const loadDashboardState = async (
  userId: string,
  stateName?: string
): Promise<{ id: string; name: string; state: DashboardState }[]> => {
  try {
    console.log(`Starting loadDashboardState with state name "${stateName || 'any'}"`);
    
    // Create a reference to the shared states collection
    const sharedStatesRef = collection(db, 'sharedStates');
    console.log('Created collection reference to sharedStates');
    
    // Create a query against the collection
    let q;
    if (stateName) {
      console.log(`Looking for specific state: ${stateName}`);
      q = query(
        sharedStatesRef, 
        where('name', '==', stateName)
      );
    } else {
      console.log('Looking for all states');
      q = query(sharedStatesRef);
    }
    
    console.log('Query created, fetching documents...');
    const querySnapshot = await getDocs(q);
    console.log(`Query result: Found ${querySnapshot.size} documents`);
    
    if (querySnapshot.empty) {
      console.log('No shared states found with that name');
      return [];
    }
    
    // Map the documents to state objects
    const results = [];
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      console.log(`Processing doc ${doc.id}, name: ${data.name}`);
      
      // Check if state data exists and log detailed info
      if (!data.state) {
        console.error(`Document ${doc.id} is missing state data:`, data);
        continue;
      }
      
      // Log the structure of the state to verify it's in the right format
      console.log(`State structure check for ${doc.id}:`, {
        hasPickers: !!data.state.pickers,
        pickerCount: data.state.pickers?.length || 0,
        hasPerformanceMetrics: !!data.state.performanceMetrics,
        shiftProgress: Object.keys(data.state.shiftProgress || {})
      });
      
      results.push({
        id: doc.id,
        name: data.name,
        state: data.state as DashboardState
      });
    }
    
    console.log(`Successfully processed ${results.length} shared states`);
    return results;
  } catch (error) {
    console.error('Error loading shared state:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    return [];
  }
};

export const deleteDashboardState = async (stateId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'sharedStates', stateId));
    return true;
  } catch (error) {
    console.error('Error deleting shared state:', error);
    return false;
  }
};

export const getDashboardStateNames = async (userId: string): Promise<string[]> => {
  try {
    console.log('Getting all shared dashboard state names');
    
    const sharedStatesRef = collection(db, 'sharedStates');
    console.log('Created collection reference to sharedStates');
    
    // Simple query without userId filter - get all states
    const q = query(sharedStatesRef);
    
    console.log('Query created, fetching documents...');
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} shared states`);
    
    // Extract names from the documents and log each one for debugging
    const stateNames: string[] = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`Processing doc ${doc.id}:`, {
        name: data.name,
        createdAt: data.createdAt,
        createdBy: data.createdBy,
        hasState: !!data.state
      });
      
      if (data.name) {
        stateNames.push(data.name);
      } else {
        console.warn(`Document ${doc.id} has no name property`);
      }
    });
    
    console.log('State names:', stateNames);
    return stateNames;
  } catch (error) {
    console.error('Error getting shared state names:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    return [];
  }
};

// Add a function to initialize or update shared state document
export const setupSharedState = async (initialData: Partial<DashboardState> = {}): Promise<void> => {
  try {
    const sharedStateRef = doc(db, 'sharedStates', 'current');
    
    // Check if the document exists
    const docSnapshot = await getDoc(sharedStateRef);
    
    if (!docSnapshot.exists()) {
      // Create new document
      await setDoc(sharedStateRef, {
        ...initialData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('Created new shared state document');
    } else {
      // Update existing document
      await updateDoc(sharedStateRef, {
        ...initialData,
        updatedAt: serverTimestamp()
      });
      console.log('Updated shared state document');
    }
  } catch (error) {
    console.error('Error setting up shared state:', error);
    throw error;
  }
};
