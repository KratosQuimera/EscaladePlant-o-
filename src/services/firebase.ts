import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  Firestore
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import configJson from '../../firebase-applet-config.json';

export const firebaseConfig = {
  apiKey: configJson.apiKey,
  authDomain: configJson.authDomain,
  projectId: configJson.projectId,
  storageBucket: configJson.storageBucket,
  messagingSenderId: configJson.messagingSenderId,
  appId: configJson.appId,
  firestoreDatabaseId: configJson.firestoreDatabaseId,
};

// Inicialização segura do Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inicialização do Firestore com o databaseId provisionado
export const firestore: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Inicialização do Firebase Auth
export const auth = getAuth(app);

// Autenticação anônima para sessões web transparentes e seguras
export async function ensureFirebaseAuth(): Promise<void> {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  } catch (error) {
    console.warn('Sessão Firebase Auth anônima:', error);
  }
}

// Teste de conexão obrigatório conforme especificação Firebase
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(firestore, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.error('Verifique a configuração do Firebase / conexão offline.');
      return false;
    }
    // Documento inexistente ou permissão é esperado no teste de conexão
    return true;
  }
}

// Executar autenticação e teste
ensureFirebaseAuth();
testConnection();
