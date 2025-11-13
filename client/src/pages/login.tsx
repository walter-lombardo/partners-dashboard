import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import dkitLogo from "@assets/tmAkfS22mCPeHBTusOxQMQyKNe4_1762386813472.png";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/login", data);
      await queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-background/95 p-4">
      <div className="p-6">
        <img 
          src={dkitLogo} 
          alt="dKit" 
          className="h-12 w-auto object-contain"
        />
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md border-card-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Login</CardTitle>
            <CardDescription>Login to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Your email"
                          data-testid="input-email"
                          className="bg-background/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Type password"
                          data-testid="input-password"
                          className="bg-background/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center justify-between">
                  <Button type="submit" disabled={isLoading} data-testid="button-sign-in">
                    {isLoading ? "Logging in..." : "Log in"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setLocation("/onboarding")}
                    className="text-sm text-primary hover:underline font-medium"
                    data-testid="link-create-account"
                  >
                    Register
                  </button>
                </div>
                
                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
