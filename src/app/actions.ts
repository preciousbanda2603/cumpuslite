
'use server';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, get, query, orderByChild, equalTo, update } from 'firebase/database';

// Initialize a secondary Firebase app for creating users without affecting admin session
const secondaryAppConfig = {
  apiKey: "AIzaSyCQKGX0f8Q_59VuCmXvjyipaAE4BfaFHvE",
  authDomain: "studio-2119893974-60441.firebaseapp.com",
  databaseURL: "https://studio-2119893974-60441-default-rtdb.firebaseio.com",
  projectId: "studio-2119893974-60441",
  storageBucket: "studio-2119893974-60441.appspot.com",
  messagingSenderId: "782301073730",
  appId: "1:782301073730:web:15eb1304f7b890411c38db"
};

const secondaryApp = getApps().find(app => app.name === 'secondary') || initializeApp(secondaryAppConfig, 'secondary');
const secondaryAuth = getAuth(secondaryApp);
const database = getDatabase(secondaryApp);

export async function getSchools() {
  const snapshot = await get(ref(database, 'schools'));
  if (snapshot.exists()) {
    const schoolsData = snapshot.val();
    return Object.keys(schoolsData).map(key => ({
      uid: key,
      name: schoolsData[key].name,
    }));
  }
  return [];
}

type CreateParentUserParams = {
  email: string;
  password: any;
  schoolUid: string;
  admissionNo: string;
};

export async function createParentUser(params: CreateParentUserParams) {
  const { email, password, schoolUid, admissionNo } = params;

  try {
    // Step 1: Find the student by admission number within the specific school
    const studentsRef = ref(database, `schools/${schoolUid}/students`);
    const q = query(studentsRef, orderByChild('admissionNo'), equalTo(admissionNo));
    const studentSnapshot = await get(q);
    
    if (!studentSnapshot.exists()) {
       throw new Error("No student found with that Admission Number at the selected school.");
    }
    
    const studentsData = studentSnapshot.val();
    const studentId = Object.keys(studentsData)[0];
    const studentData = studentsData[studentId];


    if (studentData.parentUid) {
      throw new Error("This student is already linked to a parent account.");
    }

    // Step 2: Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const user = userCredential.user;

    // Step 3: Update student record with parent's UID
    const studentRef = ref(database, `schools/${schoolUid}/students/${studentId}`);
    await update(studentRef, { parentUid: user.uid, parentName: user.displayName || email.split('@')[0] });

    return { success: true };
  } catch (error: any) {
    let errorMessage = "An unexpected error occurred. Please try again.";
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = "This email is already registered. Please use a different email or log in.";
    } else if (error.code === 'auth/weak-password') {
      errorMessage = "The password is too weak. Please choose a stronger password.";
    } else {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}

type LinkChildParams = {
    schoolUid: string;
    admissionNo: string;
};

export async function linkChildToParent(params: LinkChildParams) {
    // This function is now empty as it was causing issues and has been removed from the UI flow.
    // The parent registration flow is now the primary way to link children.
    return { success: false, error: "This feature is currently disabled." };
}
