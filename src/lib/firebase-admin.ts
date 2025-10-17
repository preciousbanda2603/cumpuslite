
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: `https://studio-2119893974-60441-default-rtdb.firebaseio.com`,
  });
}

const db = admin.database();
const auth = admin.auth();

export { admin, db, auth };
