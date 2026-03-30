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
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, dbId);

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firebase Connection Error: The client is offline. This usually means the Firestore Database has not been created yet in your Firebase Console. Please go to the Firebase Console -> Firestore Database -> Create database.");
    } else {
      console.error("Firebase Connection Error:", error);
    }
  }
}
testConnection();

export default app;
