import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertProjectSchema } from "@shared/schema";

const setupSchema = z.object({
  thorName: z.string().optional().refine((val) => !val || /^[a-z0-9-]{1,32}$/.test(val), {
    message: "THORName must be lowercase letters, digits, and dashes only (1-32 chars)"
  }),
  mayaName: z.string().optional().refine((val) => !val || /^[a-z0-9-]{1,32}$/.test(val), {
    message: "MayaName must be lowercase letters, digits, and dashes only (1-32 chars)"
  }),
  chainflipAddress: z.string().optional(),
});

type SetupForm = z.infer<typeof setupSchema>;

interface SetupModalProps {
  open: boolean;
  onComplete: () => void;
  isRequired?: boolean;
}

export default function SetupModal({ open, onComplete, isRequired = false }: SetupModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      thorName: "",
      mayaName: "",
      chainflipAddress: "",
    },
    mode: "onSubmit",
  });

  const onSubmit = async (data: SetupForm) => {
    setIsLoading(true);
    try {
      await apiRequest("PATCH", "/api/project", {
        ...data,
        setupCompleted: "true",
      });
      toast({
        title: "Setup completed",
        description: "Your tracking addresses have been saved",
      });
      onComplete();
    } catch (error: any) {
      toast({
        title: "Setup failed",
        description: error.message || "Could not save tracking addresses",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    try {
      await apiRequest("PATCH", "/api/project", {
        setupCompleted: "later",
      });
      onComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not skip setup",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    // Only allow closing if setup is not required
    if (!isOpen && !isRequired) {
      onComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Setup</DialogTitle>
          <DialogDescription>
            Add your tracking addresses to start monitoring your revenue
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Tracking Addresses</h3>
              <FormField
                control={form.control}
                name="thorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>THORChain Address</FormLabel>
                    <FormControl>
                      <Input placeholder="thor123..." {...field} />
                    </FormControl>
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
                      <Input placeholder="maya123..." {...field} />
                    </FormControl>
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
                      <Input placeholder="cflip123..." {...field} />
                    </FormControl>
                    <FormDescription>
                      We attribute swaps and fees to your project using these addresses
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={isLoading}
              >
                Do it later
              </Button>
              <Button type="submit" disabled={isLoading} className="ml-auto">
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
