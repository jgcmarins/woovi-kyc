import { Camera, Loader2, Upload } from 'lucide-react';
import { FC, useCallback, useRef, useState } from 'react';

import { useKYC } from '../context/KYCContext';
import type { KYCUploadedDocument } from '../types';
import {
  Button,
  FilePreviewCard,
  type FilePreviewData,
  FilePreviewDialog,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Typography,
} from '../ui';
import { CameraModal } from './CameraModal';

const ACCEPTED_TYPES = 'image/png,image/jpeg,image/jpg,application/pdf';

type DocumentTypeOption = {
  value: string;
  label: string;
};

type DocumentUploaderProps = {
  documentTypeOptions: DocumentTypeOption[];
  documents: readonly KYCUploadedDocument[];
  onDocumentUploaded?: (doc: KYCUploadedDocument) => void;
  onDocumentRemoved?: (documentId: string) => void;
  disabled?: boolean;
  enableCamera?: boolean;
  maxDocuments?: number;
};

export const DocumentUploader: FC<DocumentUploaderProps> = ({
  documentTypeOptions,
  documents,
  onDocumentUploaded,
  onDocumentRemoved,
  disabled,
  enableCamera,
  maxDocuments,
}) => {
  const { uploadFile, notifyFileRemoved, onError } = useKYC();
  const [uploading, setUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(documentTypeOptions[0]?.value ?? '');
  const [previewDoc, setPreviewDoc] = useState<FilePreviewData | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentsRef = useRef(documents);
  documentsRef.current = documents;

  const cleanup = useCallback(() => {
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      if (!selectedDocType) return;

      setUploading(true);

      try {
        const url = await uploadFile(file, {
          documentType: selectedDocType,
          fileName: file.name,
          mimeType: file.type,
        });

        const newDoc: KYCUploadedDocument = {
          id: crypto.randomUUID(),
          documentType: selectedDocType,
          url,
          fileName: file.name,
          mimeType: file.type,
        };

        if (maxDocuments) {
          const currentDocs = documentsRef.current;
          for (const existing of currentDocs) {
            onDocumentRemoved?.(existing.id);
            notifyFileRemoved(existing.url);
          }
        }

        onDocumentUploaded?.(newDoc);
      } catch (err) {
        onError?.(err instanceof Error ? err : new Error(String(err)));
      } finally {
        cleanup();
      }
    },
    [selectedDocType, uploadFile, maxDocuments, onDocumentUploaded, onDocumentRemoved, notifyFileRemoved, onError, cleanup],
  );

  const handleFileSelected = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      processFile(file);
    },
    [processFile],
  );

  const handleCameraCapture = useCallback(
    (file: File) => {
      processFile(file);
    },
    [processFile],
  );

  const handleRemove = useCallback(
    (doc: KYCUploadedDocument) => {
      onDocumentRemoved?.(doc.id);
      notifyFileRemoved(doc.url);
    },
    [onDocumentRemoved, notifyFileRemoved],
  );

  const getDocTypeLabel = (value: string) =>
    documentTypeOptions.find((o) => o.value === value)?.label ?? value;

  return (
    <div className="space-y-4">
      {!disabled && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          {documentTypeOptions.length > 1 && (
            <div className="flex-1">
              <Typography variant="body2" className="mb-1 font-medium">
                Selecione um documento e clique em upload
              </Typography>
              <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !selectedDocType}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {uploading ? 'Enviando...' : 'Upload'}
            </Button>
            {enableCamera && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCameraOpen(true)}
                disabled={uploading || !selectedDocType}
              >
                <Camera className="mr-2 h-4 w-4" />
                Câmera
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileSelected}
            className="hidden"
          />
          {enableCamera && (
            <CameraModal
              open={cameraOpen}
              onClose={() => setCameraOpen(false)}
              onCapture={handleCameraCapture}
            />
          )}
        </div>
      )}

      {documents.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {documents.map((doc) => (
            <FilePreviewCard
              key={doc.id}
              label={getDocTypeLabel(doc.documentType)}
              fileName={doc.fileName}
              mimeType={doc.mimeType}
              previewUrl={doc.url}
              onPreview={setPreviewDoc}
              onRemove={disabled ? undefined : () => handleRemove(doc)}
            />
          ))}
        </div>
      )}

      <FilePreviewDialog data={previewDoc} onClose={() => setPreviewDoc(null)} />
    </div>
  );
};
