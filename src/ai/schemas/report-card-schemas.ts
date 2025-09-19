/**
 * @fileOverview Schemas and types for the report card assistant AI flow.
 */

import { z } from 'zod';

const SubjectPerformanceSchema = z.object({
  subjectName: z.string().describe('The name of the subject.'),
  test1: z.number().optional().describe('Score for the first test (out of 100).'),
  test2: z.number().optional().describe('Score for the second test (out of 100).'),
  midTerm: z.number().optional().describe('Score for the mid-term exam (out of 100).'),
  finalExam: z.number().optional().describe('Score for the final exam (out of 100).'),
  grade: z.string().optional().describe('The final letter grade for the subject.'),
  comment: z.string().optional().describe('Any existing comment from the teacher.'),
});

export const ReportCardDataSchema = z.object({
  studentName: z.string().describe("The student's name."),
  performanceData: z.array(SubjectPerformanceSchema).describe("An array of the student's performance in each subject."),
});
export type ReportCardData = z.infer<typeof ReportCardDataSchema>;


export const ReportCardCommentSchema = z.object({
  strengths: z.string().describe("A summary of the student's key strengths, written in a positive and encouraging tone. Mention specific subjects where they excel."),
  improvements: z.string().describe("A summary of areas where the student can improve, framed constructively. Offer specific, actionable advice."),
});
export type ReportCardComment = z.infer<typeof ReportCardCommentSchema>;
