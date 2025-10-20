
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
import { Download } from 'lucide-react';

type ImportDialogProps = {
  title: string;
  description: string;
  templateHeaders: string[];
  onImport: (schoolId: string, csvData: string) => Promise<{ success: boolean; message: string; }>;
  schoolId: string;
  trigger: React.ReactNode;
};

export function ImportDialog({
  title,
  description,
  templateHeaders,
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
    const csvContent = templateHeaders.join(',');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
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
          toast({ title: 'Import Successful', description: result.message });
          setIsOpen(false);
        } else {
          throw new Error(result.message);
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
             <p className="text-xs text-muted-foreground mt-2">Required headers: {templateHeaders.join(', ')}</p>
          </div>
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
