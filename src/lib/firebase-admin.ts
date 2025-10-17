
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: `https://studio-2119893974-60441-default-rtdb.firebaseio.com`,
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

const dbAdmin = admin.apps.length ? admin.database() : undefined;
const authAdmin = admin.apps.length ? admin.auth() : undefined;

export { admin, dbAdmin, authAdmin };
