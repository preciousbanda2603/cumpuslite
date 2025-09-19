
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSchoolId } from '@/hooks/use-school-id';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AiSetupGuidePage() {
  const router = useRouter();
  const schoolId = useSchoolId(); // This hook gets the Firebase Project ID

  const consoleLink = `https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?project=${schoolId}`;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col gap-6">
        <div>
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">AI Features Setup Guide</h1>
          <p className="text-muted-foreground">
            A one-time setup is required to enable Generative AI features in your project.
          </p>
        </div>

        <Alert>
            <AlertTitle>Project ID</AlertTitle>
            <AlertDescription>
                Your Google Cloud Project ID is: <span className="font-semibold text-primary">{schoolId || 'Loading...'}</span>.
                You will need this for the following steps.
            </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Step 1: Enable the Generative Language API</CardTitle>
            <CardDescription>
              To use Gemini models, you need to enable the "Generative Language API" in your Google Cloud project.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Click the button below to go directly to the API enablement page for your project.
            </p>
            <Button asChild>
              <a href={consoleLink} target="_blank" rel="noopener noreferrer">
                Enable API in Google Cloud Console
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <p className="text-sm text-muted-foreground">
              A new tab will open. If prompted, make sure you have selected the correct project: <span className="font-semibold">{schoolId}</span>. Then, simply click the "Enable" button on that page.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Add Billing Information (If Required)</CardTitle>
            <CardDescription>
              The Generative Language API requires a billing account to be associated with your project. There is a generous free tier, so you are unlikely to be charged for normal usage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              If the API page asks you to enable billing, you will need to create a billing account and link it to your project.
            </p>
             <Button asChild variant="secondary">
              <a href={`https://console.cloud.google.com/billing?project=${schoolId}`} target="_blank" rel="noopener noreferrer">
                Go to Billing Page
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Step 3: All Done!</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Once the API is enabled, the AI features in your application, like the Report Card Assistant, will start working immediately. You can now return to the dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
