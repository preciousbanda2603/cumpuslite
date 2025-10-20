
'use server';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { getDatabase, ref, get, query, orderByChild, equalTo, update, push, set } from 'firebase/database';
import { customAlphabet } from 'nanoid';

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

const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

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
    const studentQuery = query(studentsRef, orderByChild('admissionNo'), equalTo(admissionNo));
    const studentSnapshot = await get(studentQuery);
    
    if (!studentSnapshot.exists()) {
       throw new Error("No student found with that Admission Number at the selected school.");
    }
    
    let studentId: string | null = null;
    let studentData: any | null = null;
    studentSnapshot.forEach((child) => {
        studentId = child.key;
        studentData = child.val();
    });

    if (!studentId || !studentData) {
        throw new Error("Could not retrieve student data.");
    }
    
    if (studentData.parentUid) {
      throw new Error("This student is already linked to a parent account.");
    }

    const signInMethods = await fetchSignInMethodsForEmail(secondaryAuth, email);
    let user;

    if (signInMethods.length > 0) {
      throw new Error("This email is already in use. Please log in with your existing parent account and use the 'Link Another Child' feature from the dashboard.");
    } else {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        user = userCredential.user;
    }

    const studentUpdateRef = ref(database, `schools/${schoolUid}/students/${studentId}`);
    await update(studentUpdateRef, { parentUid: user.uid, parentName: user.displayName || email.split('@')[0] });

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

        const studentUpdateRef = ref(database, `schools/${schoolUid}/students/${studentId}`);
        const parentUser = auth.currentUser;
        const parentName = parentUser?.displayName || parentUser?.email?.split('@')[0] || 'Parent';

        await update(studentUpdateRef, { parentUid: parentUid, parentName: parentName });

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "An unexpected error occurred." };
    }
}

async function parseCSV(csvData: string): Promise<any[]> {
    const lines = csvData.trim().split('\n');
    const header = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        return header.reduce((obj, nextKey, index) => {
            obj[nextKey] = values[index];
            return obj;
        }, {} as any);
    });
    return data;
}

export async function importStudentsFromCSV(schoolId: string, csvData: string) {
    try {
        const students = await parseCSV(csvData);
        let successCount = 0;
        let failureCount = 0;

        for (const student of students) {
            try {
                const { name, enrollmentDate, dob, gender, classId, parentName, parentPhone, parentEmail } = student;
                const admissionNo = nanoid();
                const password = nanoid(8); // Auto-generate password
                const studentEmail = `${admissionNo.toLowerCase()}@school.app`;

                const userCredential = await createUserWithEmailAndPassword(secondaryAuth, studentEmail, password);
                const studentUser = userCredential.user;

                const newStudentRef = push(ref(database, `schools/${schoolId}/students`));
                await set(newStudentRef, {
                    uid: studentUser.uid,
                    name,
                    admissionNo,
                    classId,
                    enrollmentDate,
                    dob,
                    gender,
                    parentName,
                    parentPhone,
                    parentEmail,
                    status: 'Active',
                    createdAt: new Date().toISOString(),
                });
                successCount++;
            } catch (e) {
                console.error("Failed to import student row:", e, student);
                failureCount++;
            }
        }
        return { success: true, message: `Import complete. ${successCount} students added, ${failureCount} failed.` };
    } catch (error: any) {
        return { success: false, message: `CSV parsing failed: ${error.message}` };
    }
}

export async function importTeachersFromCSV(schoolId: string, csvData: string) {
    try {
        const teachers = await parseCSV(csvData);
        let successCount = 0;
        let failureCount = 0;

        for (const teacher of teachers) {
            try {
                const { name, email, subject, qualifications, salary, startDate, dob, gender } = teacher;
                const password = nanoid(8);

                const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
                const teacherUser = userCredential.user;

                const newTeacherRef = push(ref(database, `schools/${schoolId}/teachers`));
                await set(newTeacherRef, {
                    uid: teacherUser.uid,
                    name,
                    email,
                    subject,
                    qualifications,
                    salary: parseFloat(salary) || 0,
                    startDate,
                    dob,
                    gender,
                    createdAt: new Date().toISOString(),
                });
                successCount++;
            } catch (e) {
                console.error("Failed to import teacher row:", e, teacher);
                failureCount++;
            }
        }
        return { success: true, message: `Import complete. ${successCount} teachers added, ${failureCount} failed.` };
    } catch (error: any) {
        return { success: false, message: `CSV parsing failed: ${error.message}` };
    }
}
