
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, database } from '@/lib/firebase';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Printer } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type School = { name: string, address: string, contactPhone: string };
type Student = { id: string; name: string; classId: string; admissionNo?: string, schoolId: string };
type Class = { name: string, grade: number, classTeacherId?: string };
type Teacher = { name: string };
type Subject = { id: string; name: string; grade: number; };
type Results = { [subjectId: string]: { test1?: number; test2?: number; midTerm?: number; finalExam?: number; grade?: string; comment?: string; } };
type ReportCardExtras = {
    attendance?: { totalDays?: string; daysPresent?: string; daysAbsent?: string; punctuality?: string; };
    development?: { participation?: string; homework?: string; sports?: string; behaviour?: string; };
    comments?: { strengths?: string; improvements?: string; };
};

type PerformanceData = {
  subjectName: string;
  continuousAssessment: number | string;
  examMarks: number | string;
  total: number | string;
  grade: string;
  comment: string;
};

export default function ParentReportCardPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [classInfo, setClassInfo] = useState<Class | null>(null);
  const [classTeacher, setClassTeacher] = useState<Teacher | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [extras, setExtras] = useState<ReportCardExtras>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => setUser(user));
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }
    
    const findStudent = async () => {
        const schoolsRef = ref(database, 'schools');
        const schoolsSnap = await get(schoolsRef);
        if(!schoolsSnap.exists()) return null;

        const schoolsData = schoolsSnap.val();
        for (const schoolId in schoolsData) {
            const students = schoolsData[schoolId].students || {};
            for (const studentId in students) {
                if (students[studentId].parentUid === user.uid) {
                    return { id: studentId, ...students[studentId], schoolId };
                }
            }
        }
        return null;
    };

    findStudent().then(foundStudent => {
        if (foundStudent) {
            setStudent(foundStudent);
            fetchData(foundStudent);
        } else {
             toast({ title: 'Error', description: 'Could not find a linked student.', variant: 'destructive' });
             setLoading(false);
        }
    });

  }, [user, toast]);

  const fetchData = async (currentStudent: Student) => {
      const { schoolId, id: studentId } = currentStudent;
      setLoading(true);
      try {
        const schoolRef = ref(database, `schools/${schoolId}`);
        const extrasRef = ref(database, `schools/${schoolId}/reportCardExtras/${studentId}`);
        
        const [schoolSnap, extrasSnap] = await Promise.all([get(schoolRef), get(extrasRef)]);
        
        if (!schoolSnap.exists()) {
            toast({ title: 'Error', description: 'School data not found.', variant: 'destructive' });
            return;
        }

        setSchool(schoolSnap.val());
        if (extrasSnap.exists()) setExtras(extrasSnap.val());

        const classRef = ref(database, `schools/${schoolId}/classes/${currentStudent.classId}`);
        const classSnap = await get(classRef);
        if (!classSnap.exists()) {
            toast({ title: 'Error', description: 'Class data for this student is missing.', variant: 'destructive' });
            return;
        }
        
        const classData = classSnap.val();
        setClassInfo(classData);

        if(classData.classTeacherId) {
            const teacherRef = ref(database, `schools/${schoolId}/teachers/${classData.classTeacherId}`);
            const teacherSnap = await get(teacherRef);
            if (teacherSnap.exists()) setClassTeacher(teacherSnap.val());
        }

        let subjects: Subject[] = [];
        if (classData.grade !== undefined) {
          const subjectsQuery = query(ref(database, `schools/${schoolId}/subjects`), orderByChild('grade'), equalTo(classData.grade));
          const subjectsSnap = await get(subjectsQuery);
          subjects = Object.keys(subjectsSnap.val() || {}).map(id => ({ id, ...subjectsSnap.val()[id] }));
        }

        const resultsRef = ref(database, `schools/${schoolId}/results/${studentId}`);
        const resultsSnap = await get(resultsRef);
        const results: Results = resultsSnap.exists() ? resultsSnap.val() : {};

        const perfData = subjects.map(subject => {
            const subjectResults = results[subject.id] || {};
            const caScores = [subjectResults.test1, subjectResults.test2, subjectResults.midTerm].filter(s => typeof s === 'number') as number[];
            const examScore = subjectResults.finalExam;
            const caAvg = caScores.length > 0 ? (caScores.reduce((a, b) => a + b, 0) / caScores.length) : 'N/A';
            const allScores = [...caScores, examScore].filter(s => typeof s === 'number') as number[];
            const total = allScores.length > 0 ? (allScores.reduce((a,b) => a + b, 0) / allScores.length) : 'N/A';

            return {
                subjectName: subject.name,
                continuousAssessment: typeof caAvg === 'number' ? caAvg.toFixed(1) : caAvg,
                examMarks: typeof examScore === 'number' ? examScore : 'N/A',
                total: typeof total === 'number' ? total.toFixed(1) : total,
                grade: subjectResults.grade || 'N/A',
                comment: subjectResults.comment || 'N/A',
            };
        });
        setPerformanceData(perfData);

      } catch (error) {
        console.error("Error fetching report card data:", error);
        toast({ title: 'Error', description: 'Failed to fetch report card data.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
  
  const handlePrint = () => window.print();

  if (loading) {
      return <div className="p-8"><Skeleton className="h-[800px] w-full" /></div>
  }
  
  if (!student) {
      return <div className="p-8 text-center text-muted-foreground">No student data found for this account.</div>
  }

  return (
    <>
      <div className="bg-muted/40 p-4 print:hidden flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-lg font-semibold">Student Report Card</h1>
        <Button size="sm" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Report
        </Button>
      </div>

       <style jsx global>{`
          @media print {
            body { background: white; }
            .report-card { border: none; margin: 0; padding: 0; box-shadow: none; }
            .print-container { padding: 0; }
          }
          .report-card {
            font-family: "Arial", sans-serif;
            background: white;
            color: black;
            padding: 30px;
            max-width: 900px;
            margin: 2rem auto;
            border: 1px solid #ccc;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .report-card h1, .report-card h2, .report-card h3 { text-align: center; margin-bottom: 10px; }
          .report-card h1 { font-size: 1.5rem; }
          .report-card h2 { font-size: 1.25rem; }
          .report-card h3 { font-size: 1.1rem; }
          .report-card .school-info { text-align: center; margin-bottom: 30px; }
          .report-card .student-info, .report-card .attendance, .report-card .grades, .report-card .development, .report-card .comments, .report-card .signatures { margin-bottom: 25px; }
          .report-card table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .report-card table, .report-card th, .report-card td { border: 1px solid #444; }
          .report-card th, .report-card td { padding: 8px; text-align: center; font-size: 0.9rem; }
          .report-card .section-title { font-weight: bold; margin-bottom: 10px; text-decoration: underline; }
          .report-card .signatures div { display: inline-block; width: 45%; margin-top: 40px; }
          .report-card .footer { text-align: center; font-size: 0.9em; color: #666; margin-top: 40px; }
      `}</style>

      <div className="print-container">
        <div className="report-card">
            <div className="school-info">
                <h1>Ministry of Education - Zambia</h1>
                <h2>{school?.name}</h2>
                <p>{school?.address} • {school?.contactPhone}</p>
                <h3>Term Report Card – Term 2 2024</h3>
            </div>

            <div className="student-info">
                <p><strong>Student Name:</strong> {student?.name}</p>
                <p><strong>Grade:</strong> {classInfo?.name} &nbsp;&nbsp; <strong>Admission No:</strong> {student?.admissionNo || 'N/A'}</p>
                <p><strong>Class Teacher:</strong> {classTeacher?.name || 'N/A'}</p>
            </div>

            <div className="attendance">
                <div className="section-title">Attendance</div>
                <table>
                <thead>
                    <tr>
                        <th>Total Days</th>
                        <th>Days Present</th>
                        <th>Days Absent</th>
                        <th>Punctuality</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{extras.attendance?.totalDays || '-'}</td>
                        <td>{extras.attendance?.daysPresent || '-'}</td>
                        <td>{extras.attendance?.daysAbsent || '-'}</td>
                        <td>{extras.attendance?.punctuality || '-'}</td>
                    </tr>
                </tbody>
                </table>
            </div>

            <div className="grades">
                <div className="section-title">Academic Performance</div>
                 <table>
                    <thead>
                        <tr>
                            <th>Subject</th>
                            <th>Continuous Assessment (Avg)</th>
                            <th>Exam Marks</th>
                            <th>Total (Avg)</th>
                            <th>Grade</th>
                            <th>Teacher’s Comment</th>
                        </tr>
                    </thead>
                    <tbody>
                       {performanceData.map(p => (
                         <tr key={p.subjectName}>
                            <td>{p.subjectName}</td>
                            <td>{p.continuousAssessment}</td>
                            <td>{p.examMarks}</td>
                            <td>{p.total}</td>
                            <td>{p.grade}</td>
                            <td>{p.comment}</td>
                        </tr>
                       ))}
                    </tbody>
                </table>
            </div>
            
            <div className="development">
                <div className="section-title">Personal & Co-Curricular Development</div>
                <table>
                <thead>
                    <tr>
                        <th>Area</th>
                        <th>Remarks</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>Class Participation</td><td>{extras.development?.participation || '-'}</td></tr>
                    <tr><td>Homework & Assignments</td><td>{extras.development?.homework || '-'}</td></tr>
                    <tr><td>Sports & Games</td><td>{extras.development?.sports || '-'}</td></tr>
                    <tr><td>Behaviour / Social Skills</td><td>{extras.development?.behaviour || '-'}</td></tr>
                </tbody>
                </table>
            </div>

            <div className="comments">
                <div className="section-title">Comments & Next Steps</div>
                <p><strong>Strengths:</strong> {extras.comments?.strengths || ''}</p>
                <p><strong>Areas for Improvement:</strong> {extras.comments?.improvements || ''}</p>
            </div>

            <div className="signatures">
                <div>
                ___________________________<br />
                <strong>Class Teacher</strong>
                </div>
                <div>
                ___________________________<br />
                <strong>Head Teacher / Principal</strong>
                </div>
            </div>

            <div className="footer">
                This is a computer-generated report card for internal use only.
            </div>
        </div>
      </div>
    </>
  );
}
