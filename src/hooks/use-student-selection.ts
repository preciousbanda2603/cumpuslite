
'use client';

import { useState, useEffect, useCallback } from 'react';
import { auth, database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import type { User } from 'firebase/auth';

type Student = {
    id: string;
    name: string;
    className: string;
    classId: string;
    schoolId: string;
    admissionNo?: string;
};

const STUDENT_ID_KEY = 'selected-student-id';

export function useStudentSelection() {
    const [user, setUser] = useState<User | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(setUser);
        return () => unsubscribe();
    }, []);

    const fetchStudents = useCallback(async (currentUser: User) => {
        setLoading(true);
        const schoolsRef = ref(database, 'schools');
        const snapshot = await get(schoolsRef);
        const parentStudents: Student[] = [];

        if (snapshot.exists()) {
            const schoolsData = snapshot.val();
            for (const schoolId in schoolsData) {
                const studentsData = schoolsData[schoolId].students || {};
                for (const studentId in studentsData) {
                    if (studentsData[studentId].parentUid === currentUser.uid) {
                        parentStudents.push({
                            id: studentId,
                            ...studentsData[studentId],
                            schoolId,
                        });
                    }
                }
            }
        }
        
        setStudents(parentStudents);

        if (parentStudents.length > 0) {
            const storedStudentId = localStorage.getItem(STUDENT_ID_KEY);
            const studentToSelect = parentStudents.find(s => s.id === storedStudentId) || parentStudents[0];
            setSelectedStudent(studentToSelect);
            localStorage.setItem(STUDENT_ID_KEY, studentToSelect.id);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (user) {
            fetchStudents(user);
        }
    }, [user, fetchStudents]);

    const selectStudent = (student: Student) => {
        setSelectedStudent(student);
        localStorage.setItem(STUDENT_ID_KEY, student.id);
        // Force a reload to ensure all components re-fetch data with the new student
        window.location.reload();
    };

    return { students, selectedStudent, selectStudent, loading };
}
