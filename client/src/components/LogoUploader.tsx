import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface LogoUploaderProps {
  currentLogoUrl?: string | null;
  onUploadComplete: (logoUrl: string) => void;
}

function normalizeObjectPath(rawPath: string): string {
  if (!rawPath.startsWith("https://storage.googleapis.com/")) {
    return rawPath;
  }

  const url = new URL(rawPath);
  const rawObjectPath = url.pathname;

  const privatePathMatch = rawObjectPath.match(/^\/[^/]+\/.private\/(.+)$/);
  if (privatePathMatch) {
    return `/objects/${privatePathMatch[1]}`;
  }

  return rawObjectPath;
}

export function LogoUploader({ currentLogoUrl, onUploadComplete }: LogoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateProjectMutation = useMutation({
    mutationFn: async (logoUrl: string) => {
      const normalizedPath = normalizeObjectPath(logoUrl);
      
      const response = await fetch("/api/project", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ logoUrl: normalizedPath }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update project");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - strict allowlist
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast({
        title: "Invalid file type",
        description: "Please select PNG, JPG, SVG, or WebP image only",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      // Get upload URL from backend
      const response = await fetch("/api/upload-url", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadURL } = await response.json();

      // Upload file directly to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      // Update project with new logo URL
      await updateProjectMutation.mutateAsync(uploadURL);

      const normalizedPath = normalizeObjectPath(uploadURL);
      onUploadComplete(normalizedPath);

      toast({
        title: "Logo uploaded",
        description: "Your project logo has been updated successfully",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {currentLogoUrl && (
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded border border-border/40 backdrop-blur-xl bg-card/30 flex items-center justify-center overflow-hidden">
            <img 
              src={currentLogoUrl} 
              alt="Project logo" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Current logo (148px width recommended)
          </div>
        </div>
      )}
      
      <div>
        <input
          type="file"
          id="logo-upload"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
          data-testid="input-logo-file"
        />
        <label htmlFor="logo-upload">
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            asChild
            data-testid="button-upload-logo"
          >
            <span className="cursor-pointer">
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Logo
                </>
              )}
            </span>
          </Button>
        </label>
        <p className="text-xs text-muted-foreground mt-2">
          PNG, JPG, or SVG. Max 5MB. 148px width recommended.
        </p>
      </div>
    </div>
  );
}
