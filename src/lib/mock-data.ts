export const students = [
  {
    id: 's1',
    name: 'Alex Johnson',
    interests: ['Soccer', 'Computer Science', 'Chess'],
    activities: ['Soccer Team', 'Coding Club'],
    enrollmentDate: '2022-09-01',
    startingGrade: 8,
    status: 'Active',
  },
  {
    id: 's2',
    name: 'Maria Garcia',
    interests: ['Art', 'Theater', 'History'],
    activities: ['Drama Club', 'School Newspaper'],
    enrollmentDate: '2021-09-01',
    startingGrade: 9,
    status: 'Active',
  },
  {
    id: 's3',
    name: 'Sam Lee',
    interests: ['Basketball', 'Mathematics', 'Music'],
    activities: ['Basketball Team', 'Mathletes', 'School Band'],
    enrollmentDate: '2023-09-01',
    startingGrade: 9,
    status: 'Withdrawn',
  },
];

export const allAnnouncements = [
  'Soccer team tryouts are next Tuesday at 4 PM on the main field.',
  'The Drama Club will hold auditions for the spring play this Friday.',
  'The annual school science fair is coming up. Sign-ups are in the main office.',
  'Picture day is scheduled for next Wednesday. Order forms will be sent home.',
  'Parent-teacher conferences are scheduled for the end of the month.',
  'The coding club is hosting a hackathon next weekend. All skill levels welcome.',
  'The school band will have their fall concert on November 15th.',
  'Basketball team sign-ups are now open for the winter season.',
];

export const teachers = [
    {
        id: "t1",
        name: "Mr. David Armstrong",
        subject: "Mathematics",
        email: "d.armstrong@campus.zm",
        qualifications: "M.Sc. in Mathematics",
        avatar: "https://picsum.photos/seed/t1/100/100"
    },
    {
        id: "t2",
        name: "Ms. Marie Curie",
        subject: "Physics",
        email: "m.curie@campus.zm",
        qualifications: "Ph.D. in Physics",
        avatar: "https://picsum.photos/seed/t2/100/100"
    },
    {
        id: "t3",
        name: "Mrs. Virginia Woolf",
        subject: "English Literature",
        email: "v.woolf@campus.zm",
        qualifications: "M.A. in English Literature",
        avatar: "https://picsum.photos/seed/t3/100/100"
    },
    {
        id: "t4",
        name: "Dr. Alan Turing",
        subject: "Computer Science",
        email: "a.turing@campus.zm",
        qualifications: "Ph.D. in Computer Science",
        avatar: "https://picsum.photos/seed/t4/100/100"
    }
];

export const classAssignments = [
    { class: 'Grade 10 - Mathematics', teacherId: 't1' },
    { class: 'Grade 11 - Physics', teacherId: 't2' },
    { class: 'Grade 12 - English Literature', teacherId: 't3' },
    { class: 'Grade 10 - Computer Science', teacherId: 't4' },
    { class: 'Grade 9 - History', teacherId: 't3' },
];

export const subjects = [
    { id: 'sub-1', name: 'Mathematics' },
    { id: 'sub-2', name: 'Physics' },
    { id: 'sub-3', name: 'English Literature' },
    { id: 'sub-4', name: 'Computer Science' },
    { id: 'sub-5', name: 'History' },
    { id: 'sub-6', name: 'Art' },
    { id: 'sub-7', name: 'Physical Education' },
];
