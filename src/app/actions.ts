
'use server';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { getDatabase, ref, get, query, orderByChild, equalTo, update, push, set, remove } from 'firebase/database';
import { customAlphabet } from 'nanoid';
import type { User } from 'firebase/auth';
import axios from 'axios';
import https from 'https';


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

const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

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
             const signInMethods = await fetchSignInMethodsForEmail(secondaryAuth, email);
             if (signInMethods.length > 0) {
                 throw new Error("This student is already linked to a parent account.");
             } else {
                 throw new Error("This student is already linked to a parent account. Please contact the school to change the linked parent.");
             }
        }

        const signInMethods = await fetchSignInMethodsForEmail(secondaryAuth, email);
        let user;

        if (signInMethods.length > 0) {
            throw new Error("This email is already in use. Please log in to link this child from your dashboard.");
        } else {
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            user = userCredential.user;
        }

        const studentUpdateRef = ref(database, `schools/${schoolUid}/students/${studentId}`);
        await update(studentUpdateRef, { parentUid: user.uid });

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
    const headerLine = lines[0].endsWith('\r') ? lines[0].slice(0, -1) : lines[0];
    const header = headerLine.split(',').map(h => h.trim());
    
    const data = lines.slice(1).map(line => {
        const cleanedLine = line.endsWith('\r') ? line.slice(0, -1) : line;
        const values = cleanedLine.split(',').map(v => v.trim());
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
            const rowNum = index + 2;
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

// Super Admin Actions
export async function updateSchool(schoolId: string, updates: { name?: string; status?: 'active' | 'suspended'; subscription?: 'free' | 'basic' | 'premium', settings?: any }) {
    const schoolRef = ref(database, `schools/${schoolId}`);
    return update(schoolRef, updates);
}

export async function deleteSchool(schoolId: string) {
    const schoolRef = ref(database, `schools/${schoolId}`);
    return remove(schoolRef);
}

// --- Probase Payment Gateway Integration ---

const PROBASE_BASE_DOMAIN = process.env.PROBASE_BASE_DOMAIN;
const PROBASE_AUTH_TOKEN = process.env.PROBASE_AUTH_TOKEN;
const PROBASE_MERCHANT_ID = process.env.PROBASE_MERCHANT_ID;
const PROBASE_SERVICE_CODE = process.env.PROBASE_SERVICE_CODE;
const PROBASE_COMPANY_NAME = process.env.PROBASE_COMPANY_NAME;
const PROBASE_CALLBACK_URL = process.env.PROBASE_CALLBACK_URL;

const agent = new https.Agent({
  rejectUnauthorized: false,
});

export async function initiateSubscriptionPayment(params: {
    schoolId: string;
    plan: 'basic' | 'premium';
    mobileNumber: string;
    amount: number;
}): Promise<{ success: boolean; message: string }> {
    const { schoolId, plan, mobileNumber, amount } = params;
    const transactionId = `SUB-${schoolId}-${plan.toUpperCase()}-${nanoid()}`;

    const paymentsRef = ref(database, `schools/${schoolId}/payments/${transactionId}`);
    await set(paymentsRef, {
        plan,
        amount,
        status: 'pending',
        createdAt: new Date().toISOString(),
    });

    const merchantId = PROBASE_MERCHANT_ID ? parseInt(PROBASE_MERCHANT_ID, 10) : NaN;
    const service_code = PROBASE_SERVICE_CODE;
    const domain = PROBASE_BASE_DOMAIN?.replace(/^(https?:\/\/)/, '');

    if (!domain || !PROBASE_AUTH_TOKEN || isNaN(merchantId) || !service_code) {
        const errorMsg = "Probase payment gateway credentials are not configured correctly.";
        console.error(errorMsg);
        await update(paymentsRef, { status: 'failed', failureReason: errorMsg });
        return { success: false, message: errorMsg };
    }
    
    const requestUrl = `https://${domain}/pbs/Payments/Api/V1/ProcessTransaction`; 
    
    const payload = {
        amount: amount.toFixed(2),
        service_code: service_code,
        bss_notification: true,
        mobile: mobileNumber,
        merchantId: merchantId,
        paymentDescription: `${PROBASE_COMPANY_NAME || 'Campus.ZM Subscription'}: ${plan} plan`,
        paymentReference: transactionId,
        callbackUrl: PROBASE_CALLBACK_URL || '',
    };
    
    try {
        const response = await axios.post(requestUrl, payload, {
            headers: { 'auth_token': PROBASE_AUTH_TOKEN, 'Content-Type': 'application/json' },
            httpsAgent: agent,
        });

        const responseData = response.data;

        if (response.status === 200 && responseData.success === true && responseData.status === 0) {
            await update(paymentsRef, { status: 'processing', gatewayReference: responseData.transid });
            return { success: true, message: responseData.message || "Payment initiated. You will receive a prompt on your phone." };
        } else {
            const errorMessage = responseData.errorDescription || responseData.message || "Payment gateway rejected the request.";
            await update(paymentsRef, { status: 'failed', failureReason: errorMessage });
            return { success: false, message: errorMessage };
        }
    } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Network error during payment initiation.";
        await update(paymentsRef, { status: 'failed', failureReason: errorMessage });
        console.error("Probase payment failed:", errorMessage);
        return { success: false, message: `Could not connect to payment gateway. ${errorMessage}` };
    }
}

    