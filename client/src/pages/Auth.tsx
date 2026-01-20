import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Phone, Lock, Car } from "lucide-react";

interface LoginFormValues {
  phone: string;
  password: string;
}

export default function Auth() {
  const [, setLocation] = useLocation();
  const { login, register, isLoggingIn, isRegistering, user } = useAuth();
  const { toast } = useToast();
  const [isNewUser, setIsNewUser] = useState(false);

  const form = useForm<LoginFormValues>({
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      if (isNewUser) {
        await register({ phone: data.phone, password: data.password });
        toast({
          title: "Welcome to Saman Marketplace!",
          description: "Your account has been created.",
        });
      } else {
        await login({ phone: data.phone, password: data.password });
        toast({
          title: "Welcome back!",
          description: "You have been logged in successfully.",
        });
      }
      setLocation("/");
    } catch (error: any) {
      if (error.message === "User not found" && !isNewUser) {
        setIsNewUser(true);
        toast({
          title: "New user?",
          description: "This number isn't registered. Click Sign Up to create an account.",
        });
      } else {
        toast({
          variant: "destructive",
          title: isNewUser ? "Registration failed" : "Login failed",
          description: error.message,
        });
      }
    }
  };

  const isLoading = isLoggingIn || isRegistering;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #3d3d3d 100%)' }}>
      <Card className="w-full max-w-md border-2" style={{ borderColor: '#f97316' }}>
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f97316' }}>
            <Car className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold" style={{ color: '#f97316' }}>Saman Marketplace</CardTitle>
          <CardDescription className="text-base" style={{ color: '#8a8a8a' }}>UAE Spare Parts and Cars Marketplace</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                rules={{ 
                  required: "Phone number is required",
                  minLength: { value: 9, message: "Please enter a valid phone number" }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="+971 50 123 4567"
                          className="pl-10"
                          data-testid="input-phone"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                rules={{ 
                  required: "Password is required",
                  minLength: { value: 1, message: "Please enter a password" }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          className="pl-10"
                          data-testid="input-password"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full text-white font-semibold"
                style={{ backgroundColor: '#f97316' }}
                disabled={isLoading}
                data-testid="button-submit"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isNewUser ? "Creating account..." : "Logging in..."}
                  </>
                ) : (
                  isNewUser ? "Sign Up" : "Login"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                style={{ borderColor: '#f97316', color: '#f97316' }}
                onClick={() => setIsNewUser(!isNewUser)}
                disabled={isLoading}
              >
                {isNewUser ? "Already have an account? Login" : "New user? Sign Up"}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
