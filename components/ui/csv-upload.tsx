import { ChangeEvent, useRef, useState, useEffect } from 'react';
import { Button } from './button';
import { UploadIcon, XCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CSVUploadProps {
  onFileUpload: (emails: string[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
  shouldReset?: boolean;
}

interface UploadState {
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  fileName?: string;
}

export function CSVUpload({ onFileUpload, onCancel, isLoading, shouldReset }: CSVUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    progress: 0,
    status: 'idle'
  });

  // Reset the upload state when shouldReset changes to true
  useEffect(() => {
    if (shouldReset) {
      setUploadState({
        progress: 0,
        status: 'idle'
      });
    }
  }, [shouldReset]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadState({
      progress: 0,
      status: 'uploading',
      fileName: file.name
    });

    const reader = new FileReader();
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadState(prev => ({
        ...prev,
        progress: Math.min(prev.progress + 5, 95)
      }));
    }, 100);

    reader.onload = (e) => {
      clearInterval(progressInterval);
      const text = e.target?.result as string;
      // Parse CSV content (assuming one email per line)
      const emails = text
        .split('\n')
        .map(line => line.trim())
        .filter(email => email && email.includes('@')); // Basic email validation

      onFileUpload(emails);
      
      setUploadState(prev => ({
        ...prev,
        progress: 100,
        status: 'success'
      }));

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      clearInterval(progressInterval);
      setUploadState(prev => ({
        ...prev,
        status: 'error'
      }));
    };

    reader.readAsText(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleCancel = () => {
    setUploadState({
      progress: 0,
      status: 'idle'
    });
    onCancel();
  };

  return (
    <div className="flex flex-col items-start gap-4 w-full max-w-md">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
      />
      
      {uploadState.status === 'idle' && (
        <Button
          onClick={handleButtonClick}
          variant="outline"
          disabled={isLoading}
          className="flex items-center gap-2 w-full justify-center transition-opacity hover:opacity-90"
        >
          <UploadIcon className="w-4 h-4" />
          {isLoading ? 'Processing...' : 'Import Users from CSV'}
        </Button>
      )}

      {(uploadState.status === 'uploading' || uploadState.status === 'success') && (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground truncate max-w-[200px]">
              {uploadState.fileName}
            </span>
            <span className="text-muted-foreground">
              {uploadState.progress}%
            </span>
          </div>

          <div className="relative w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className={cn(
                "absolute left-0 top-0 h-full transition-all duration-300",
                uploadState.status === 'success' ? "bg-green-500" : "bg-primary"
              )}
              style={{ width: `${uploadState.progress}%` }}
            />
          </div>

          {uploadState.status === 'success' && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Upload complete</span>
              </div>
              <Button
                onClick={handleCancel}
                variant="destructive"
                size="sm"
                className="transition-all hover:opacity-90"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Upload
              </Button>
            </div>
          )}
        </div>
      )}

      {uploadState.status === 'error' && (
        <div className="text-destructive text-sm">
          Error uploading file. Please try again.
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Upload a CSV file containing email addresses (one per line)
      </p>
    </div>
  );
} 