'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, AlertCircle, CheckCircle, Loader, Zap } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { cn, formatFileSize } from '@/lib/utils';
import { toast } from 'sonner';

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md', '.markdown'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function UploadZone() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    
    if (rejectedFiles.length > 0) {
      const rejected = rejectedFiles[0];
      if (rejected.errors[0]?.code === 'file-too-large') {
        setError(`File is too large. Maximum size is 10MB.`);
        toast.error('File too large');
      } else if (rejected.errors[0]?.code === 'file-invalid-type') {
        setError(`Invalid file type. Please upload PDF, DOCX, TXT, or MD files.`);
        toast.error('Invalid file type');
      }
      return;
    }
    
    setFiles((prev) => [...prev, ...acceptedFiles]);
    toast.success(`${acceptedFiles.length} file${acceptedFiles.length > 1 ? 's' : ''} added`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    multiple: true,
    maxSize: MAX_FILE_SIZE,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file to analyze');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress('Preparing upload...');
    
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      setProgress('Uploading files...');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || `Server error (${response.status})`);
      }

      if (!result.results || result.results.length === 0) {
        throw new Error('No results returned from server');
      }

      const errors = result.results.filter((r: any) => r.error);
      if (errors.length > 0) {
        const errorMessages = errors.map((e: any) => `${e.filename}: ${e.error}`).join('\n');
        throw new Error(`Processing failed:\n${errorMessages}`);
      }

      const successResult = result.results.find((r: any) => r.documentId);
      if (!successResult) {
        throw new Error('No successful uploads. Please try again.');
      }

      setProgress('Analysis complete! Loading results...');
      
      toast.success('Analysis complete!', {
        description: `Found ${successResult.findingsCount} findings with risk score ${successResult.riskScore}`,
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const resultUrl = `/results/${successResult.documentId}`;
      console.log(`[UploadZone] Navigating to: ${resultUrl}`);
      window.location.href = resultUrl;
      
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
      toast.error(errorMessage);
      setUploading(false);
      setProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-error/10 border border-error/20">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-error" />
          <div className="flex-1">
            <p className="font-medium text-error">Upload Error</p>
            <p className="text-sm mt-1 text-error/90 whitespace-pre-line">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-error/70 hover:text-error transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {progress && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-accent/10 border border-accent/20">
          <Loader className="h-5 w-5 animate-spin text-accent" />
          <p className="text-sm text-accent">{progress}</p>
        </div>
      )}

      <div
        {...getRootProps()}
        className={cn(
          "relative rounded-lg border-2 border-dashed transition-all cursor-pointer",
          "p-12 flex flex-col items-center justify-center text-center",
          isDragActive && "border-accent bg-accent/5 scale-[1.02]",
          error && "border-error/50",
          !isDragActive && !error && "border-border bg-panel hover:border-accent/50 hover:bg-hover"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent mb-6">
          <Upload className="h-8 w-8" />
        </div>
        
        {isDragActive ? (
          <div>
            <p className="text-lg font-medium text-text-primary mb-2">Drop files here</p>
            <p className="text-sm text-text-secondary">Release to upload</p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-medium text-text-primary mb-2">
              Drag & drop documents here
            </p>
            <p className="text-sm text-text-secondary mb-4">
              or click to browse
            </p>
            <p className="text-xs text-text-muted">
              PDF, DOCX, TXT, MD • Max 10MB per file
            </p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-3">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-panel hover:bg-hover transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-accent/10 text-accent flex-shrink-0">
                    <File className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                  className="flex h-8 w-8 items-center justify-center rounded hover:bg-error/10 text-text-muted hover:text-error transition-colors flex-shrink-0 ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <Button 
            onClick={handleUpload} 
            disabled={uploading}
            size="lg"
            className="w-full h-16 text-xl font-black relative overflow-hidden bg-gradient-to-r from-cyan-400 via-accent to-cyan-500 hover:from-cyan-500 hover:via-accent hover:to-cyan-400 border-4 border-cyan-400/80 shadow-2xl shadow-cyan-400/50 transition-all duration-300 hover:scale-[1.02]"
            style={{ color: '#000000' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            {uploading ? (
              <div className="flex items-center justify-center relative z-20">
                <Loader className="h-6 w-6 mr-3 animate-spin" style={{ color: '#000000' }} />
                <span style={{ color: '#000000' }}>ANALYZING...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center relative z-20">
                <Zap className="h-6 w-6 mr-3 animate-pulse" style={{ color: '#000000' }} />
                <span style={{ color: '#000000' }}>START ANALYSIS</span>
                {files.length > 0 && (
                  <span className="ml-3 text-sm font-bold px-3 py-1 bg-black/20 rounded-full" style={{ color: '#000000' }}>
                    {files.length} file{files.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </Button>
        </div>
      )}

      <div className="text-xs text-text-muted space-y-1 pt-2 border-t border-border/50">
        <p>• Supported formats: PDF, DOCX, DOC, TXT, MD</p>
        <p>• Maximum file size: 10MB</p>
        <p>• Processing time: ~5-15 seconds per document</p>
      </div>
    </div>
  );
}
