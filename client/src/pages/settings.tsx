import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertProjectSchema, type MeResponse } from "@shared/schema";
import { z } from "zod";
import { LogoUploader } from "@/components/LogoUploader";

type SettingsForm = z.infer<typeof insertProjectSchema>;

export default function SettingsPage() {
  const { toast } = useToast();

  const { data: meData, isLoading } = useQuery<MeResponse>({
    queryKey: ["/api/me"],
  });

  const form = useForm<SettingsForm>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: "",
      logoUrl: "",
      dappUrl: "",
      btcAddress: "",
      thorName: "",
      mayaName: "",
      chainflipAddress: "",
    },
    values: meData?.project ? {
      name: meData.project.name || "",
      logoUrl: meData.project.logoUrl || "",
      dappUrl: meData.project.dappUrl || "",
      btcAddress: meData.project.btcAddress || "",
      thorName: meData.project.thorName || "",
      mayaName: meData.project.mayaName || "",
      chainflipAddress: meData.project.chainflipAddress || "",
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      // Mark setup as completed if addresses are provided
      const hasAddresses = data.thorName || data.mayaName || data.chainflipAddress;
      return apiRequest("PATCH", "/api/project", {
        ...data,
        setupCompleted: hasAddresses ? "true" : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SettingsForm) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your project details and tracking IDs</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-card-border">
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>Basic information about your project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My DeFi Project" data-testid="input-project-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <label className="text-sm font-medium mb-2 block">Project Logo</label>
                <LogoUploader 
                  currentLogoUrl={meData?.project?.logoUrl}
                  onUploadComplete={(logoUrl) => {
                    form.setValue("logoUrl", logoUrl);
                  }}
                />
              </div>
              <FormField
                control={form.control}
                name="dappUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>dApp Link</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.app" data-testid="input-dapp-url" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader>
              <CardTitle>Tracking IDs</CardTitle>
              <CardDescription>Identifiers used to attribute swaps and fees to your project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="thorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>THORChain Address</FormLabel>
                    <FormControl>
                      <Input placeholder="your-thorname" data-testid="input-thor-name" {...field} />
                    </FormControl>
                    <FormDescription>
                      Lowercase letters, digits, and dashes only (1-32 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mayaName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mayachain Address</FormLabel>
                    <FormControl>
                      <Input placeholder="your-mayaname" data-testid="input-maya-name" {...field} />
                    </FormControl>
                    <FormDescription>
                      Lowercase letters, digits, and dashes only (1-32 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chainflipAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chainflip Address</FormLabel>
                    <FormControl>
                      <Input placeholder="0xabc...def" data-testid="input-chainflip-address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save">
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
