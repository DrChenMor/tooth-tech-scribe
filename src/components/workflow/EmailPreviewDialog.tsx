
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface EmailPreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  body: string;
  recipient: string;
}

export const EmailPreviewDialog = ({
  isOpen,
  onOpenChange,
  subject,
  body,
  recipient,
}: EmailPreviewDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Email Preview</DialogTitle>
          <DialogDescription>
            This is a preview of the email that will be sent.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-sm text-muted-foreground w-16">To:</span>
            <span className="text-sm">{recipient}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-sm text-muted-foreground w-16">Subject:</span>
            <span className="text-sm font-medium">{subject}</span>
          </div>
          <div className="border rounded-md p-4 bg-gray-50 max-h-96 overflow-y-auto">
             <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: body }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

