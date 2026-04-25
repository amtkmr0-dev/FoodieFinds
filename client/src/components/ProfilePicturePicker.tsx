import { type ChangeEvent, useRef, useState } from "react";
import { Camera, Check, ImagePlus, Loader2, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PROFILE_AVATARS, resizeProfilePicture } from "@/lib/profile-pictures";
import { useToast } from "@/hooks/use-toast";

interface ProfilePicturePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentImage?: string;
  fallbackText: string;
  title?: string;
  onSelect: (imageUrl: string) => void;
}

export function ProfilePicturePicker({
  open,
  onOpenChange,
  currentImage,
  fallbackText,
  title = "Change profile picture",
  onSelect,
}: ProfilePicturePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSelect = (imageUrl: string) => {
    onSelect(imageUrl);
    onOpenChange(false);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsProcessing(true);
    try {
      const imageUrl = await resizeProfilePicture(file);
      handleSelect(imageUrl);
      toast({
        title: "Profile picture updated",
        description: "Your photo was resized and saved.",
      });
    } catch (error) {
      toast({
        title: "Could not update photo",
        description: error instanceof Error ? error.message : "Please try a different image.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      event.target.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Pick a character avatar or upload a photo from your gallery.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 rounded-lg border bg-muted/40 p-4">
          <Avatar className="w-20 h-20 border">
            <AvatarImage src={currentImage} alt="Current profile picture" />
            <AvatarFallback>{fallbackText.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">Current picture</p>
            <p className="text-sm text-muted-foreground">Visible on profile, call pages, and creator cards.</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {PROFILE_AVATARS.map((avatar) => {
            const isSelected = currentImage === avatar.url;
            return (
              <button
                key={avatar.id}
                type="button"
                className={`relative rounded-lg border p-2 transition hover:border-primary ${isSelected ? "border-primary bg-primary/10" : "bg-background"}`}
                onClick={() => handleSelect(avatar.url)}
                data-testid={`button-avatar-${avatar.id}`}
                aria-label={`Choose ${avatar.label} avatar`}
              >
                <Avatar className="mx-auto h-14 w-14">
                  <AvatarImage src={avatar.url} alt={avatar.label} />
                  <AvatarFallback>{avatar.label.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                {isSelected && (
                  <span className="absolute right-1 top-1 rounded-full bg-primary p-0.5 text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          data-testid="input-profile-picture"
        />
        <Button
          variant="outline"
          className="w-full"
          onClick={() => inputRef.current?.click()}
          disabled={isProcessing}
          data-testid="button-choose-gallery-photo"
        >
          {isProcessing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="mr-2 h-4 w-4" />
          )}
          {isProcessing ? "Processing photo" : "Choose from gallery"}
        </Button>

        <div className="flex items-start gap-2 rounded-lg bg-primary/10 p-3 text-sm text-muted-foreground">
          <Upload className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          Photos are resized before saving so profile images stay lightweight.
        </div>
      </DialogContent>
    </Dialog>
  );
}
