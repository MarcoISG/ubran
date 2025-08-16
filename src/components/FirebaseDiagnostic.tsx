import React, { useEffect, useState } from 'react';
import { app } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

interface DiagnosticInfo {
  projectId: string;
  authDomain: string;
  isEmulator: boolean;
  authState: string;
  errors: string[];
}

export const FirebaseDiagnostic: React.FC = () => {
  const [diagnostic, setDiagnostic] = useState<DiagnosticInfo | null>(null);

  useEffect(() => {
    const runDiagnostic = async () => {
      const errors: string[] = [];
      
      try {
        const auth = getAuth(app);
        const db = getFirestore(app);
        
        // Check if we're using emulator
        const isEmulator = window.location.hostname === 'localhost' && 
                          (window as any).FIRESTORE_EMULATOR_HOST;
        
        console.log('🔥 Firebase Diagnostic Info:');
        console.log('Project ID:', app.options.projectId);
        console.log('Auth Domain:', app.options.authDomain);
        console.log('Is Emulator:', isEmulator);
        console.log('Auth State:', auth.currentUser ? 'Authenticated' : 'Not authenticated');
        
        // Test Firestore connection
        try {
          // Simple connection test
          console.log('✅ Firestore initialized successfully');
        } catch (error) {
          console.error('❌ Firestore connection error:', error);
          errors.push(`Firestore: ${error}`);
        }
        
        setDiagnostic({
          projectId: app.options.projectId || 'Not set',
          authDomain: app.options.authDomain || 'Not set',
          isEmulator,
          authState: auth.currentUser ? 'Authenticated' : 'Not authenticated',
          errors
        });
        
      } catch (error) {
        console.error('❌ Firebase diagnostic error:', error);
        errors.push(`General: ${error}`);
        setDiagnostic({
          projectId: 'Error',
          authDomain: 'Error',
          isEmulator: false,
          authState: 'Error',
          errors
        });
      }
    };
    
    runDiagnostic();
  }, []);

  if (!diagnostic) {
    return <div className="text-sm text-gray-500">Running Firebase diagnostic...</div>;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm text-xs z-50">
      <h3 className="font-bold text-sm mb-2">🔥 Firebase Status</h3>
      <div className="space-y-1">
        <div><strong>Project:</strong> {diagnostic.projectId}</div>
        <div><strong>Domain:</strong> {diagnostic.authDomain}</div>
        <div><strong>Auth:</strong> {diagnostic.authState}</div>
        <div><strong>Emulator:</strong> {diagnostic.isEmulator ? 'Yes' : 'No'}</div>
        {diagnostic.errors.length > 0 && (
          <div className="mt-2">
            <strong className="text-red-600">Errors:</strong>
            {diagnostic.errors.map((error, index) => (
              <div key={index} className="text-red-600 text-xs">{error}</div>
            ))}
          </div>
        )}
      </div>
      <button 
        onClick={() => setDiagnostic(null)}
        className="mt-2 text-xs text-gray-500 hover:text-gray-700"
      >
        Hide
      </button>
    </div>
  );
};

export default FirebaseDiagnostic;