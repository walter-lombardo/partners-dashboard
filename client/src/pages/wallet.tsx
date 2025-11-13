import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Copy, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import type { ApiKey } from "@shared/schema";

// API response type with serialized dates
type ApiKeyResponse = Omit<ApiKey, "createdAt"> & { createdAt: string };

export default function WalletPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: apiKeys = [], isLoading } = useQuery<ApiKeyResponse[]>({
    queryKey: ["/api/keys"],
    staleTime: Infinity,
  });

  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/keys", { name });
      return await res.json() as ApiKeyResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      setNewlyCreatedKey(data.key);
      setKeyName("");
      toast({
        title: "API key created",
        description: "Your new API key has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create API key",
        description: error.message || "Could not create API key",
        variant: "destructive",
      });
    },
  });

  const handleCreateKey = () => {
    if (!keyName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your API key",
        variant: "destructive",
      });
      return;
    }
    createKeyMutation.mutate(keyName);
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: "Copied to clipboard",
      description: "API key has been copied to your clipboard",
    });
  };

  const handleViewDetails = (keyId: string) => {
    setLocation(`/api-keys/${keyId}`);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setNewlyCreatedKey(null);
    setKeyName("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">API Keys</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>Create new Key</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">There are no API keys yet.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.map((apiKey) => (
              <TableRow key={apiKey.id}>
                <TableCell className="font-medium">{apiKey.name}</TableCell>
                <TableCell>{formatDate(apiKey.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="text-sm">{apiKey.key}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyKey(apiKey.key)}
                      className="h-8 w-8"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    {apiKey.status === "active" ? "Configure" : apiKey.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleViewDetails(apiKey.id)}
                    className="text-sm"
                  >
                    Details
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={isCreateModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              {newlyCreatedKey
                ? "Your API key has been created. Make sure to copy it now as you won't be able to see it again."
                : "Create a new api key to use with the dKit SDK/API products"}
            </DialogDescription>
          </DialogHeader>
          {newlyCreatedKey ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Your new API key</Label>
                <div className="flex items-center gap-2">
                  <Input value={newlyCreatedKey} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyKey(newlyCreatedKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button onClick={handleCloseModal}>Done</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="API key name"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateKey();
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateKey}
                  disabled={createKeyMutation.isPending}
                >
                  {createKeyMutation.isPending ? "Creating..." : "Confirm"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
