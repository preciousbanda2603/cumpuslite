
'use server';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
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
    const studentsRef = ref(database, `schools/${schoolUid}/students`);
    const studentSnapshot = await get(studentsRef);
    
    if (!studentSnapshot.exists()) {
       throw new Error("No students found at the selected school.");
    }
    
    const studentsData = studentSnapshot.val();
    let studentId: string | null = null;
    let studentData: any | null = null;

    for (const id in studentsData) {
        if (studentsData[id].admissionNo === admissionNo) {
            studentId = id;
            studentData = studentsData[id];
            break;
        }
    }

    if (!studentId || !studentData) {
        throw new Error("No student found with that Admission Number at the selected school.");
    }

    if (studentData.parentUid) {
      throw new Error("This student is already linked to a parent account.");
    }

    // Check if email is already registered
    const signInMethods = await fetchSignInMethodsForEmail(secondaryAuth, email);

    let user;
    if (signInMethods.length > 0) {
      // Email already exists, so we don't create a new user.
      // We assume the user will log in separately.
      // The parent registration page should ideally log them in and get the UID.
      // For now, this action will just link the student if the email exists.
      // A more robust solution would involve verifying ownership of the email.
      // This is a simplified flow.
      return { success: false, error: "This email is already in use. Please log in with your existing parent account and use the 'Link Another Child' feature from the dashboard." };
    } else {
        // Create new user if email doesn't exist
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        user = userCredential.user;
    }

    const studentRef = ref(database, `schools/${schoolUid}/students/${studentId}`);
    await update(studentRef, { parentUid: user.uid, parentName: user.displayName || email.split('@')[0] });

    return { success: true };
  } catch (error: any) {
    let errorMessage = "An unexpected error occurred. Please try again.";
    if (error.code === 'auth/weak-password') {
      errorMessage = "The password is too weak. Please choose a stronger password.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}

type LinkChildParams = {
    schoolUid: string;
    admissionNo: string;
    parentUid: string;
};

export async function linkChildToParent(params: LinkChildParams) {
    const { schoolUid, admissionNo, parentUid } = params;

    if (!parentUid) {
        return { success: false, error: "Authentication error. Could not identify parent." };
    }

    try {
        const studentsRef = ref(database, `schools/${schoolUid}/students`);
        const studentSnapshot = await get(studentsRef);
        
        if (!studentSnapshot.exists()) {
           throw new Error("No students found at the selected school.");
        }
        
        const studentsData = studentSnapshot.val();
        let studentId: string | null = null;
        let studentData: any | null = null;

        for (const id in studentsData) {
            if (studentsData[id].admissionNo === admissionNo) {
                studentId = id;
                studentData = studentsData[id];
                break;
            }
        }

        if (!studentId || !studentData) {
            throw new Error("No student found with that Admission Number at the selected school.");
        }

        if (studentData.parentUid) {
            if (studentData.parentUid === parentUid) {
                throw new Error("This student is already linked to your account.");
            } else {
                 throw new Error("This student is already linked to a different parent account.");
            }
        }

        const studentRef = ref(database, `schools/${schoolUid}/students/${studentId}`);
        const parentSnap = await get(ref(database, `users/${parentUid}`)); // Assuming parent name is stored elsewhere, or get from auth
        const parentName = parentSnap.val()?.displayName || 'Parent';

        await update(studentRef, { parentUid: parentUid, parentName: parentName });

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "An unexpected error occurred." };
    }
}
