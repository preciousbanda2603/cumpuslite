
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
const database = getDatabase(getApps()[0]); // Use the primary app's database instance

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
  parentName: string;
};

export async function createParentUser(params: CreateParentUserParams) {
    const { email, password, schoolUid, admissionNo, parentName } = params;

    try {
        const studentsRef = ref(database, `schools/${schoolUid}/students`);
        const snapshot = await get(studentsRef);
        if (!snapshot.exists()) {
            throw new Error("No students found at the selected school.");
        }
        
        const studentsData = snapshot.val();
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

        const signInMethods = await fetchSignInMethodsForEmail(secondaryAuth, email);
        let user;

        if (signInMethods.length > 0) {
            // This case should now be handled on the client, but keeping as a failsafe
            throw new Error("This email is already in use. Please log in to link this child.");
        } else {
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            user = userCredential.user;
        }

        const studentUpdateRef = ref(database, `schools/${schoolUid}/students/${studentId}`);
        await update(studentUpdateRef, { parentUid: user.uid, parentName: parentName });

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
        await update(studentUpdateRef, { parentUid: parentUid });

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
        const errorMessages: string[] = [];

        for (const [index, student] of students.entries()) {
            const rowNum = index + 2; // CSV is 1-indexed, and header is row 1
            try {
                const { name, enrollmentDate, dob, gender, classId, parentName, parentPhone, parentEmail } = student;
                if (!name || !classId) {
                    throw new Error("Missing required fields: name and classId.");
                }

                const admissionNo = nanoid();
                const password = nanoid(8);
                const studentEmail = `${admissionNo.toLowerCase()}@school.app`;

                const userCredential = await createUserWithEmailAndPassword(secondaryAuth, studentEmail, password);
                const studentUser = userCredential.user;

                const newStudentRef = push(ref(database, `schools/${schoolId}/students`));
                await set(newStudentRef, {
                    uid: studentUser.uid,
                    name,
                    admissionNo,
                    classId,
                    enrollmentDate: enrollmentDate || '',
                    dob: dob || '',
                    gender: gender || '',
                    parentName: parentName || '',
                    parentPhone: parentPhone || '',
                    parentEmail: parentEmail || '',
                    status: 'Active',
                    createdAt: new Date().toISOString(),
                });
                successCount++;
            } catch (e: any) {
                let reason = "An unknown error occurred.";
                if (e.code === 'auth/email-already-in-use') {
                    reason = `This student seems to have been added already.`;
                } else if (e.message) {
                    reason = e.message;
                }
                errorMessages.push(`Row ${rowNum} (${student.name || 'N/A'}): ${reason}`);
            }
        }
        return { success: true, successCount, errorMessages };
    } catch (error: any) {
        return { success: false, successCount: 0, errorMessages: [`CSV parsing failed: ${error.message}`] };
    }
}

export async function importTeachersFromCSV(schoolId: string, csvData: string) {
    try {
        const teachers = await parseCSV(csvData);
        let successCount = 0;
        const errorMessages: string[] = [];

        for (const [index, teacher] of teachers.entries()) {
             const rowNum = index + 2;
            try {
                const { name, email, subject, qualifications, salary, startDate, dob, gender } = teacher;

                if (!name || !email) {
                    throw new Error("Missing required fields: name and email.");
                }

                const password = nanoid(8);

                const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
                const teacherUser = userCredential.user;

                const newTeacherRef = push(ref(database, `schools/${schoolId}/teachers`));
                await set(newTeacherRef, {
                    uid: teacherUser.uid,
                    name,
                    email,
                    subject: subject || '',
                    qualifications: qualifications || '',
                    salary: parseFloat(salary) || 0,
                    startDate: startDate || '',
                    dob: dob || '',
                    gender: gender || '',
                    createdAt: new Date().toISOString(),
                });
                successCount++;
            } catch (e: any) {
                 let reason = "An unknown error occurred.";
                if (e.code === 'auth/email-already-in-use') {
                    reason = `Email '${teacher.email}' is already in use.`;
                } else if (e.message) {
                    reason = e.message;
                }
                errorMessages.push(`Row ${rowNum} (${teacher.name || 'N/A'}): ${reason}`);
            }
        }
        return { success: true, successCount, errorMessages };
    } catch (error: any) {
        return { success: false, successCount: 0, errorMessages: [`CSV parsing failed: ${error.message}`] };
    }
}
