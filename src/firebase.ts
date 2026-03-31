import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, getDocFromServer, doc, initializeFirestore } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)" 
  ? firebaseConfig.firestoreDatabaseId 
  : undefined;

// Initialize Firestore with long-polling for better stability in some environments
export const db = dbId 
  ? initializeFirestore(app, { experimentalForceLongPolling: true }, dbId)
  : initializeFirestore(app, { experimentalForceLongPolling: true });

export let isFirestoreOffline = false;
const connectionListeners: ((offline: boolean) => void)[] = [];

export function onFirestoreConnectionChange(callback: (offline: boolean) => void) {
  connectionListeners.push(callback);
  callback(isFirestoreOffline);
  return () => {
    const index = connectionListeners.indexOf(callback);
    if (index > -1) connectionListeners.splice(index, 1);
  };
}

function setFirestoreOffline(offline: boolean) {
  isFirestoreOffline = offline;
  connectionListeners.forEach(cb => cb(offline));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    setFirestoreOffline(false);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('the client is offline')) {
        setFirestoreOffline(true);
        console.error("Firebase Connection Error: The client is offline. This usually means the Firestore Database has not been created yet in your Firebase Console. Please go to the Firebase Console -> Firestore Database -> Create database.");
      } else if (error.message.includes('insufficient permissions')) {
        // If we get a permission error, it means we ARE connected to a database, 
        // but the rules are blocking this specific test path.
        setFirestoreOffline(false); 
        console.log("Firestore connected, but test path is restricted (this is normal if rules are active).");
      } else {
        console.error("Firebase Connection Error:", error);
      }
    }
  }
}
testConnection();

export default app;
