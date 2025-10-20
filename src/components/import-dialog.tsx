
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Download, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

type ImportDialogProps = {
  title: string;
  description: string;
  templateHeaders: string[];
  sampleData?: any[];
  onImport: (schoolId: string, csvData: string) => Promise<{ success: boolean; successCount: number; errorMessages: string[] }>;
  schoolId: string;
  trigger: React.ReactNode;
};

export function ImportDialog({
  title,
  description,
  templateHeaders,
  sampleData = [],
  onImport,
  schoolId,
  trigger,
}: ImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    const header = templateHeaders.join(',');
    const rows = sampleData.map(row => 
      templateHeaders.map(header => `"${row[header] || ''}"`).join(',')
    );
    const csvContent = [header, ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async () => {
    if (!file || !schoolId) {
      toast({ title: 'Error', description: 'Please select a file to import.', variant: 'destructive' });
      return;
    }
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvData = e.target?.result as string;
      try {
        const result = await onImport(schoolId, csvData);
        if (result.success) {
            if (result.errorMessages.length > 0) {
                 toast({
                    title: `Import Partially Successful`,
                    description: (
                        <div>
                            <p>{result.successCount} records imported successfully.</p>
                            <p>{result.errorMessages.length} records failed:</p>
                            <ul className="list-disc pl-5 mt-2 text-xs">
                                {result.errorMessages.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                                {result.errorMessages.length > 5 && <li>...and {result.errorMessages.length - 5} more.</li>}
                            </ul>
                        </div>
                    ),
                    duration: 10000, // Keep toast open longer for reading errors
                });
            } else {
                 toast({ title: 'Import Successful', description: `${result.successCount} records have been imported.` });
            }
          setIsOpen(false);
        } else {
          throw new Error(result.errorMessages[0] || "An unknown error occurred during import.");
        }
      } catch (error: any) {
        toast({ title: 'Import Failed', description: error.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download CSV Template
            </Button>
             <p className="text-xs text-muted-foreground mt-2">The template includes 5 sample rows for guidance. Please replace them with your actual data.</p>
          </div>
          <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                  Ensure the `classId` column in your CSV matches the actual Class IDs from your school's configuration. You can find these IDs by navigating to the "Classes" page and inspecting the URL or data.
              </AlertDescription>
          </Alert>
          <div className="grid gap-2">
            <Label htmlFor="csv-file">Upload CSV File</Label>
            <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={!file || loading}>
            {loading ? 'Importing...' : 'Import Data'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
