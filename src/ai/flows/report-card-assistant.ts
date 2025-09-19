'use server';
/**
 * @fileOverview An AI assistant for generating student report card comments.
 *
 * - generateReportCardComments - A function that generates comments based on student performance.
 */

import {ai} from '@/ai/genkit';
import {
  ReportCardDataSchema,
  ReportCardCommentSchema,
  type ReportCardData,
  type ReportCardComment,
} from '@/ai/schemas/report-card-schemas';


export async function generateReportCardComments(
  input: ReportCardData
): Promise<ReportCardComment> {
  return reportCardAssistantFlow(input);
}


const prompt = ai.definePrompt({
  name: 'reportCardAssistantPrompt',
  input: {schema: ReportCardDataSchema},
  output: {schema: ReportCardCommentSchema},
  prompt: `You are an experienced and insightful educator tasked with writing comments for a student's report card.
Analyze the provided academic performance data for {{studentName}}.

Based on the data, generate a summary of the student's strengths and areas for improvement.
- The tone should be professional, encouraging, and constructive.
- Be specific where possible, referencing subject names to support your points.
- If scores are consistently high (e.g., above 80), focus on strengths like diligence, understanding, or excellence.
- If scores are low (e.g., below 50), identify these as areas for improvement and suggest actionable steps like seeking help, practicing more, or focusing on fundamentals.
- If scores are mixed, highlight the strong subjects as strengths and the weaker ones as areas for improvement.

Here is the student's performance data:
{{#each performanceData}}
- Subject: {{subjectName}}
  - Test 1: {{#if test1}}{{test1}}{{else}}N/A{{/if}}
  - Test 2: {{#if test2}}{{test2}}{{else}}N/A{{/if}}
  - Mid-Term: {{#if midTerm}}{{midTerm}}{{else}}N/A{{/if}}
  - Final Exam: {{#if finalExam}}{{finalExam}}{{else}}N/A{{/if}}
  - Grade: {{#if grade}}{{grade}}{{else}}N/A{{/if}}
  - Teacher Comment: {{#if comment}}{{comment}}{{else}}N/A{{/if}}
{{/each}}
`,
});

const reportCardAssistantFlow = ai.defineFlow(
  {
    name: 'reportCardAssistantFlow',
    inputSchema: ReportCardDataSchema,
    outputSchema: ReportCardCommentSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
