import { Eye, FileText, ImageIcon, Trash2 } from 'lucide-react';
import { FC } from 'react';

import { Button } from './button';
import { Card, CardContent } from './card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';

export type FilePreviewData = {
  fileName: string;
  mimeType: string | null;
  previewUrl: string | null;
};

export type FilePreviewCardProps = {
  label: string;
  fileName: string;
  mimeType: string | null;
  previewUrl: string | null;
  onPreview?: (data: FilePreviewData) => void;
  onRemove?: () => void;
};

export const FilePreviewCard: FC<FilePreviewCardProps> = ({
  label,
  fileName,
  mimeType,
  previewUrl,
  onPreview,
  onRemove,
}) => {
  const isImage = mimeType?.startsWith('image/');

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-muted flex items-center justify-center relative group">
        {isImage && previewUrl ? (
          <img src={previewUrl} alt={fileName} className="w-full h-full object-cover" />
        ) : mimeType === 'application/pdf' ? (
          <FileText className="h-10 w-10 text-red-500" />
        ) : (
          <ImageIcon className="h-10 w-10 text-muted-foreground" />
        )}
        {(onPreview || onRemove) && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {onPreview && previewUrl && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-white hover:text-white hover:bg-white/20"
                onClick={() => onPreview({ fileName, mimeType, previewUrl })}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-white hover:text-white hover:bg-white/20"
                onClick={onRemove}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <p className="text-xs font-medium truncate">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{fileName}</p>
      </CardContent>
    </Card>
  );
};

FilePreviewCard.displayName = 'FilePreviewCard';

export type FilePreviewDialogProps = {
  data: FilePreviewData | null;
  onClose: () => void;
};

export const FilePreviewDialog: FC<FilePreviewDialogProps> = ({ data, onClose }) => (
  <Dialog open={!!data} onOpenChange={() => onClose()}>
    <DialogContent className="max-w-4xl max-h-[90vh]">
      <DialogHeader>
        <DialogTitle>{data?.fileName || 'Visualizar'}</DialogTitle>
      </DialogHeader>
      <div className="flex items-center justify-center overflow-auto max-h-[70vh]">
        {data?.previewUrl && data?.mimeType?.startsWith('image/') ? (
          <img
            src={data.previewUrl}
            alt={data.fileName}
            className="max-w-full max-h-full object-contain"
          />
        ) : data?.previewUrl && data?.mimeType === 'application/pdf' ? (
          <iframe
            src={data.previewUrl}
            className="w-full h-[70vh]"
            title={data.fileName || 'PDF Preview'}
          />
        ) : data?.previewUrl ? (
          <iframe
            src={data.previewUrl}
            className="w-full h-[70vh]"
            title={data.fileName || 'Preview'}
          />
        ) : null}
      </div>
    </DialogContent>
  </Dialog>
);

FilePreviewDialog.displayName = 'FilePreviewDialog';
