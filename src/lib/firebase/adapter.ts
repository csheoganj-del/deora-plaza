/**
 * Firebase Firestore Adapter
 * Provides Supabase-like interface for Firebase operations
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from './client';

export interface FirebaseAdapter {
  from: (table: string) => FirebaseQueryBuilder;
  auth: {
    getSession: () => Promise<{ data: any; error: any }>;
  };
}

export class FirebaseQueryBuilder {
  private tableName: string;
  private constraints: QueryConstraint[] = [];

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = '*') {
    // Firestore doesn't support column selection like SQL
    // We'll fetch all data and filter on client side if needed
    return this;
  }

  eq(column: string, value: any) {
    this.constraints.push(where(column, '==', value));
    return this;
  }

  neq(column: string, value: any) {
    this.constraints.push(where(column, '!=', value));
    return this;
  }

  gt(column: string, value: any) {
    this.constraints.push(where(column, '>', value));
    return this;
  }

  gte(column: string, value: any) {
    this.constraints.push(where(column, '>=', value));
    return this;
  }

  lt(column: string, value: any) {
    this.constraints.push(where(column, '<', value));
    return this;
  }

  lte(column: string, value: any) {
    this.constraints.push(where(column, '<=', value));
    return this;
  }

  order(column: string, ascending: boolean = true) {
    this.constraints.push(orderBy(column, ascending ? 'asc' : 'desc'));
    return this;
  }

  limit(count: number) {
    this.constraints.push(limit(count));
    return this;
  }

  async single() {
    try {
      const firestore = getFirebaseDb();
      if (!firestore) {
        return { data: null, error: { message: 'Firebase not initialized' } };
      }

      const q = query(collection(firestore, this.tableName), ...this.constraints);
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { data: null, error: { message: 'No document found' } };
      }

      const doc = querySnapshot.docs[0];
      return { 
        data: { id: doc.id, ...doc.data() }, 
        error: null 
      };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  async execute() {
    try {
      const firestore = getFirebaseDb();
      if (!firestore) {
        return { data: null, error: { message: 'Firebase not initialized' } };
      }

      const q = query(collection(firestore, this.tableName), ...this.constraints);
      const querySnapshot = await getDocs(q);
      
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  // For compatibility with Supabase syntax
  then(callback: (result: any) => void) {
    return this.execute().then(callback);
  }

  async insert(data: any) {
    try {
      const firestore = getFirebaseDb();
      if (!firestore) {
        return { data: null, error: { message: 'Firebase not initialized' } };
      }

      // Convert timestamps
      const processedData = this.processDataForFirestore(data);
      const docRef = await addDoc(collection(firestore, this.tableName), processedData);
      
      return { 
        data: { id: docRef.id, ...processedData }, 
        error: null 
      };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  async update(data: any) {
    try {
      const firestore = getFirebaseDb();
      if (!firestore) {
        return { data: null, error: { message: 'Firebase not initialized' } };
      }

      if (!data.id) {
        throw new Error('Document ID is required for update');
      }

      const { id, ...updateData } = data;
      const processedData = this.processDataForFirestore(updateData);
      
      await updateDoc(doc(firestore, this.tableName, id), processedData);
      
      return { 
        data: { id, ...processedData }, 
        error: null 
      };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  async delete() {
    try {
      const firestore = getFirebaseDb();
      if (!firestore) {
        return { data: null, error: { message: 'Firebase not initialized' } };
      }

      // This is a simplified version - in practice you'd need to handle the constraints
      // For now, we'll assume single document deletion with ID
      const q = query(collection(firestore, this.tableName), ...this.constraints);
      const querySnapshot = await getDocs(q);
      
      const deletePromises = querySnapshot.docs.map(document => 
        deleteDoc(doc(firestore, this.tableName, document.id))
      );
      
      await Promise.all(deletePromises);
      
      return { data: null, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  // Subscribe to real-time updates
  subscribe(callback: (data: any) => void) {
    const firestore = getFirebaseDb();
    if (!firestore) {
      callback({ data: null, error: { message: 'Firebase not initialized' } });
      return () => {}; // Return empty unsubscribe function
    }

    const q = query(collection(firestore, this.tableName), ...this.constraints);
    
    return onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback({ data, error: null });
    }, (error) => {
      callback({ data: null, error: { message: error.message } });
    });
  }

  private processDataForFirestore(data: any): any {
    const processed = { ...data };
    
    // Convert Date objects to Firestore Timestamps
    Object.keys(processed).forEach(key => {
      if (processed[key] instanceof Date) {
        processed[key] = Timestamp.fromDate(processed[key]);
      } else if (typeof processed[key] === 'string' && this.isISODateString(processed[key])) {
        processed[key] = Timestamp.fromDate(new Date(processed[key]));
      }
    });
    
    return processed;
  }

  private isISODateString(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
  }
}

// Create Firebase adapter with Supabase-like interface
export function createFirebaseAdapter(): FirebaseAdapter | null {
  if (!isFirebaseConfigured()) {
    return null;
  }

  return {
    from: (table: string) => new FirebaseQueryBuilder(table),
    auth: {
      getSession: async () => {
        // Simple health check for Firebase
        try {
          const firestore = getFirebaseDb();
          if (!firestore) {
            return { data: null, error: { message: 'Firebase not initialized' } };
          }

          await getDocs(query(collection(firestore, 'health_check'), limit(1)));
          return { data: { session: null }, error: null };
        } catch (error: any) {
          return { data: null, error: { message: error.message } };
        }
      }
    }
  };
}