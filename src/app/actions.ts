
'use server';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { getDatabase, ref, get, query, orderByChild, equalTo, update, push, set, remove } from 'firebase/database';
import { customAlphabet } from 'nanoid';
import type { User } from 'firebase/auth';
import axios from 'axios';
import https from 'https';

// --- TYPE DEFINITIONS ---
// This was missing from the previous implementation.
export type UserProfile = {
  fullName: string;
  email: string;
  phoneNumber?: string;
};


// Initialize a secondary Firebase app for creating users without affecting admin session
const secondaryAppConfig = {
  apiKey: "AIzaSyCQKGX0f8Q_59VuCmXvjyipaAE4BfaFHvE",
  authDomain: "studio-2119893974-60441.firebaseapp.com",
  databaseURL: "https://studio-2119893974-60441-default-rtdb.firebaseio.com",
  projectId: "studio-2119893974-60441",
  storageBucket: "studio-211989-60441.appspot.com",
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

const PROBASE_BASE_DOMAIN = "https://paymentservices.probasegroup.com/";
const PROBASE_AUTH_TOKEN = "X6vs7axNEPdCCXcE3wXJd6nmWdC8N9jMACXumn5q6W8M3q6b6WUVnxF8CJQ3wuj74w7Y4f3eHAVu65CUKhWqKsAe8RnCeN8wyNZVUfWUKTHCVc";
const PROBASE_MERCHANT_ID = "52";
const PROBASE_SERVICE_CODE = "0035";
const PROBASE_COMPANY_NAME = "Campus.ZM";
const PROBASE_CALLBACK_URL = ""; 
const PROBASE_SYSTEM_ID = "Clock Tick Invest Plus-9567";
const PROBASE_PASSWORD = "54kRQe5Db5_fv6J#22ev";

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
    
    try {
        await set(paymentsRef, {
            plan,
            amount,
            status: 'pending',
            createdAt: new Date().toISOString(),
        });

        const merchantId = parseInt(PROBASE_MERCHANT_ID, 10);
        const service_code = PROBASE_SERVICE_CODE;
        const domain = PROBASE_BASE_DOMAIN?.replace(/^(https?:\/\/)/, '');
        
        if (!domain || !PROBASE_AUTH_TOKEN || isNaN(merchantId) || !service_code) {
            const errorMsg = "Probase mobile payment gateway credentials are not configured correctly.";
            console.error(errorMsg);
            throw new Error(errorMsg);
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
        };

        const response = await axios.post(requestUrl, payload, {
            headers: { 
                'auth_token': PROBASE_AUTH_TOKEN,
                'Content-Type': 'application/json' 
            },
            httpsAgent: agent,
        });

        const responseData = response.data;

        if (response.status === 200 && responseData.success === true && responseData.status === 0) {
            await update(paymentsRef, { status: 'processing', gatewayReference: responseData.transid });
            return { success: true, message: responseData.message || "Payment initiated. You will receive a prompt on your phone." };
        } else {
            const errorMessage = responseData.errorDescription || responseData.message || "Payment gateway rejected the request.";
            throw new Error(errorMessage);
        }
    } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Could not connect to the payment gateway. Please check server logs.";
        console.error("Probase payment initiation failed:", errorMessage);
        
        try {
             await update(paymentsRef, { 
                status: 'failed', 
                failureReason: `Connection Error: ${errorMessage}`
            });
        } catch (dbError: any) {
             console.error("Failed to update payment status after connection error:", dbError.message);
        }

        return { success: false, message: `Could not connect to the payment gateway. The server logs may have more details.` };
    }
}

/**
 * Looks up the status of a payment transaction.
 * @param {string} paymentReference - The unique reference used for the payment.
 * @returns {Promise<any>} The response data from the transaction lookup API.
 */
export async function lookupTransaction(paymentReference: string): Promise<any> {
    const requestUrl = 'https://paymentservices.probasegroup.com/pbs/Payments/Api/V1/TransactionLookup';
    
    if (!PROBASE_AUTH_TOKEN) {
        const errorMsg = "Probase auth token is not configured on the server.";
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
    
    console.log(`Looking up Probase transaction ${paymentReference} at ${requestUrl}`);
    
    const payload = {
        paymentReference: paymentReference,
        systemId: PROBASE_SYSTEM_ID,
        password: PROBASE_PASSWORD,
    };

    try {
        const response = await axios.post(requestUrl, payload, {
            headers: {
                'auth_token': PROBASE_AUTH_TOKEN,
                'Content-Type': 'application/json'
            },
            httpsAgent: agent,
        });

        console.log("Probase Lookup Response:", response.data);
        return response.data;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            const errorMessage = error.response.data?.message || `Transaction lookup failed with status: ${error.response.status}.`;
            console.error("Probase lookup failed:", errorMessage, "Status:", error.response.status, "Data:", error.response.data);
            throw new Error(errorMessage);
        }
        console.error("Network error during Probase lookup:", error.message);
        throw new Error(`Could not connect to the payment gateway for lookup. Error: ${error.message}`);
    }
}

/**
 * Initiates a card payment via Probase and returns a checkout URL.
 * @param {number} amount - The amount to be paid.
 * @param {string} transactionId - A unique reference for the payment.
 * @param {UserProfile} userProfile - The profile of the user making the payment.
 * @returns {Promise<{ success: boolean; checkoutUrl?: string; message?: string }>} The result of the card payment initiation.
 */
export async function initiateProbaseCardRedirect(
  amount: number,
  transactionId: string,
  userProfile: UserProfile
): Promise<{ success: boolean; checkoutUrl?: string; message?: string }> {

  if (!PROBASE_BASE_DOMAIN || !PROBASE_AUTH_TOKEN || !PROBASE_MERCHANT_ID || !PROBASE_SERVICE_CODE) {
    const errorMsg = "Probase card redirect gateway credentials are not configured on the server.";
    console.error(errorMsg);
    return { success: false, message: errorMsg };
  }

  const payload = {
    amount: amount.toFixed(2),
    service_code: PROBASE_SERVICE_CODE,
    paymentReference: transactionId,
    customerFirstName: userProfile.fullName.split(' ')[0],
    customerLastName: userProfile.fullName.split(' ').slice(1).join(' ') || userProfile.fullName.split(' ')[0],
    customerEmail: userProfile.email,
    customerMobile: userProfile.phoneNumber || '',
    merchantId: parseInt(PROBASE_MERCHANT_ID, 10),
    paymentDescription: `${PROBASE_COMPANY_NAME || 'Payment'}: ${transactionId}`,
  };
  
  const requestUrl = `https://${PROBASE_BASE_DOMAIN.replace(/^(https?:\/\/)/, '')}/pbs/checkout/v1/request`;
  console.log(`Initiating Probase CARD payment for transaction ${transactionId} to ${requestUrl}`);

  try {
    const response = await axios.post(requestUrl, payload, {
      headers: {
        'auth_token': PROBASE_AUTH_TOKEN,
        'Content-Type': 'application/json'
      },
      httpsAgent: agent
    });
    
    const responseData = response.data;
    console.log("Probase CARD Payment Response:", responseData);

    if (response.status === 200 && responseData.success && responseData.checkoutUrl) {
      return { success: true, checkoutUrl: responseData.checkoutUrl };
    } else {
      const errorMessage = responseData.message || 'Failed to get checkout URL from payment gateway.';
      console.error("Probase card redirect failed:", errorMessage);
      return { success: false, message: errorMessage };
    }

  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      const errorMessage = error.response.data?.message || `Payment gateway returned an error: ${error.response.status}.`;
      console.error("Probase card redirect failed:", errorMessage, "Status:", error.response.status, "Data:", error.response.data);
      return { success: false, message: errorMessage };
    }
    console.error("Network error during Probase card redirect:", error.message);
    return { success: false, message: 'Could not connect to the payment gateway.' };
  }
}
