import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Share, Mail } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useForm } from "@/contexts/form/FormContext";
import { Form } from "@/types/form";

interface ShareFormDialogProps {
  form: Form;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ShareFormDialog: React.FC<ShareFormDialogProps> = ({ form, open, setOpen }) => {
  const { generateAccessLink } = useForm();
  const [accessLink, setAccessLink] = useState<string>(generateAccessLink(form.id));

  const copyAccessLink = () => {
    navigator.clipboard.writeText(accessLink);
    toast({
      title: "Link copied",
      description: "Access link copied to clipboard",
    });
  };

  const shareViaEmail = () => {
    const subject = `Check out this form: ${form.title}`;
    const body = `I thought you might be interested in filling out this form: ${accessLink}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Form</DialogTitle>
          <DialogDescription>
            Share this form with others.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="link" className="text-right">
              Access Link
            </Label>
            <Input type="text" id="link" value={accessLink} readOnly className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" className="mr-2" onClick={copyAccessLink}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Link
          </Button>
          <Button type="button" variant="outline" onClick={shareViaEmail}>
            <Mail className="mr-2 h-4 w-4" />
            Share via Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareFormDialog;
