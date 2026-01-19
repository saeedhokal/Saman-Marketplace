import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Phone, ArrowLeft } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface PhoneFormValues {
  phone: string;
  firstName?: string;
  lastName?: string;
}

export default function Auth() {
  const [, setLocation] = useLocation();
  const { requestOtp, verifyOtp, isRequestingOtp, isVerifyingOtp, user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [otp, setOtp] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  const phoneForm = useForm<PhoneFormValues>({
    defaultValues: {
      phone: "",
      firstName: "",
      lastName: "",
    },
  });

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const onRequestOtp = async (data: PhoneFormValues) => {
    try {
      const result = await requestOtp({ phone: data.phone });
      setPhone(data.phone);
      setFirstName(data.firstName || "");
      setLastName(data.lastName || "");
      if (result.devCode) {
        setDevCode(result.devCode);
      }
      setStep("otp");
      toast({
        title: "OTP Sent",
        description: "Please enter the verification code sent to your phone.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to send OTP",
        description: error.message,
      });
    }
  };

  const onVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid code",
        description: "Please enter the 6-digit code.",
      });
      return;
    }

    try {
      const result = await verifyOtp({ 
        phone, 
        code: otp,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });
      toast({
        title: result.isNewUser ? "Welcome to Saman Marketplace!" : "Welcome back!",
        description: result.isNewUser 
          ? "Your account has been created." 
          : "You have been logged in successfully.",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: error.message,
      });
      setOtp("");
    }
  };

  const goBack = () => {
    setStep("phone");
    setOtp("");
    setDevCode(null);
  };

  if (step === "otp") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute left-4 top-4"
              onClick={goBack}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-bold">Verify Phone</CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to {phone}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {devCode && (
              <div className="p-3 bg-muted rounded-md text-center">
                <p className="text-sm text-muted-foreground">Development Mode</p>
                <p className="text-lg font-mono font-bold">{devCode}</p>
              </div>
            )}
            
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                data-testid="input-otp"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              className="w-full"
              onClick={onVerifyOtp}
              disabled={isVerifyingOtp || otp.length !== 6}
              data-testid="button-verify"
            >
              {isVerifyingOtp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Continue"
              )}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={goBack}
              disabled={isVerifyingOtp}
            >
              Use a different number
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Saman Marketplace</CardTitle>
          <CardDescription>UAE Spare Parts Marketplace</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...phoneForm}>
            <form onSubmit={phoneForm.handleSubmit(onRequestOtp)} className="space-y-4">
              <FormField
                control={phoneForm.control}
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={phoneForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John"
                          data-testid="input-firstname"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={phoneForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Doe"
                          data-testid="input-lastname"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isRequestingOtp}
                data-testid="button-send-otp"
              >
                {isRequestingOtp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  "Continue with Phone"
                )}
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
