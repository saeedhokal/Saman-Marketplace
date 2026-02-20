import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Phone, Lock, User, Mail, ArrowLeft, ShieldCheck } from "lucide-react";
import samanLogo from "@/assets/saman-logo.jpg";
import { sendOTP, verifyOTP } from "@/lib/firebase";

interface LoginFormValues {
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function Auth() {
  const [, setLocation] = useLocation();
  const { login, register, isLoggingIn, isRegistering, user } = useAuth();
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  const [isNewUser, setIsNewUser] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<LoginFormValues | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);

  const form = useForm<LoginFormValues>({
    defaultValues: {
      phone: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleOtpDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/[^0-9]/g, '').split('').slice(0, 6);
      const newDigits = [...otpDigits];
      digits.forEach((d, i) => {
        if (index + i < 6) newDigits[index + i] = d;
      });
      setOtpDigits(newDigits);
      setOtpCode(newDigits.join(''));
      const nextIndex = Math.min(index + digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }
    
    const digit = value.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    setOtpCode(newDigits.join(''));
    
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    try {
      if (isNewUser) {
        setPendingFormData(data);
        setIsSendingOTP(true);
        try {
          await sendOTP(data.phone);
          setOtpStep(true);
          toast({
            title: isRTL ? "تم إرسال الرمز" : "Code Sent",
            description: isRTL ? "تم إرسال رمز التحقق إلى هاتفك" : "A verification code has been sent to your phone",
          });
        } catch (error: any) {
          console.error('[Auth] OTP send error:', error);
          let errorMsg = isRTL ? "فشل إرسال الرمز. حاول مرة أخرى." : "Failed to send verification code. Please try again.";
          if (error.code === 'auth/too-many-requests') {
            errorMsg = isRTL ? "محاولات كثيرة. حاول لاحقاً." : "Too many attempts. Please try again later.";
          } else if (error.code === 'auth/invalid-phone-number') {
            errorMsg = isRTL ? "رقم هاتف غير صالح" : "Invalid phone number. Please check and try again.";
          }
          toast({ variant: "destructive", title: isRTL ? "خطأ" : "Error", description: errorMsg });
        } finally {
          setIsSendingOTP(false);
        }
      } else {
        await login({ phone: data.phone, password: data.password });
        toast({
          title: "Welcome back!",
          description: "You have been logged in successfully.",
        });
        setLocation("/");
      }
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

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6 || !pendingFormData) return;
    
    setIsVerifyingOTP(true);
    try {
      const idToken = await verifyOTP(otpCode);
      
      await register({
        firebaseIdToken: idToken,
        password: pendingFormData.password,
        firstName: pendingFormData.firstName,
        lastName: pendingFormData.lastName,
        email: pendingFormData.email || undefined,
      });
      
      toast({
        title: isRTL ? "مرحباً بك في سمان!" : "Welcome to Saman Marketplace!",
        description: isRTL ? "تم إنشاء حسابك بنجاح" : "Your account has been created.",
      });
      setLocation("/");
    } catch (error: any) {
      console.error('[Auth] OTP verify error:', error);
      let errorMsg = isRTL ? "رمز غير صحيح. حاول مرة أخرى." : "Invalid code. Please try again.";
      if (error.code === 'auth/invalid-verification-code') {
        errorMsg = isRTL ? "الرمز غير صحيح" : "The code you entered is incorrect.";
      } else if (error.code === 'auth/code-expired') {
        errorMsg = isRTL ? "انتهت صلاحية الرمز. أعد الإرسال." : "Code expired. Please request a new one.";
      } else if (error.message && !error.code) {
        errorMsg = error.message;
      }
      toast({ variant: "destructive", title: isRTL ? "خطأ" : "Error", description: errorMsg });
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const handleResendOTP = async () => {
    if (!pendingFormData) return;
    setIsSendingOTP(true);
    try {
      await sendOTP(pendingFormData.phone);
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpCode("");
      toast({
        title: isRTL ? "تم إعادة الإرسال" : "Code Resent",
        description: isRTL ? "تم إرسال رمز جديد" : "A new verification code has been sent.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: isRTL ? "خطأ" : "Error",
        description: isRTL ? "فشل إعادة الإرسال" : "Failed to resend code. Please try again.",
      });
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleForgotPassword = async () => {
    const phone = form.getValues("phone");
    if (!phone) {
      toast({
        variant: "destructive",
        title: isRTL ? "مطلوب" : "Required",
        description: isRTL ? "يرجى إدخال رقم هاتفك أولاً" : "Please enter your phone number first",
      });
      return;
    }

    setIsSendingReset(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      toast({
        title: isRTL ? "تم الإرسال" : "Reset Link Sent",
        description: data.message,
      });
      setShowForgotPassword(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: isRTL ? "خطأ" : "Error",
        description: error.message,
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  const isLoading = isLoggingIn || isRegistering;

  if (otpStep && pendingFormData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #3d3d3d 100%)' }}>
        <Card className="w-full max-w-md border-2" style={{ borderColor: '#f97316' }}>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-orange-500" />
            </div>
            <CardTitle className="text-2xl font-bold" style={{ color: '#f97316' }}>
              {isRTL ? 'تحقق من رقمك' : 'Verify Your Number'}
            </CardTitle>
            <CardDescription className="text-base" style={{ color: '#8a8a8a' }}>
              {isRTL 
                ? `أدخل الرمز المرسل إلى ${pendingFormData.phone}` 
                : `Enter the 6-digit code sent to ${pendingFormData.phone}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center gap-2" dir="ltr">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { otpInputRefs.current[index] = el; }}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold rounded-lg border-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  style={{ borderColor: digit ? '#f97316' : undefined }}
                  data-testid={`input-otp-${index}`}
                />
              ))}
            </div>

            <Button
              className="w-full text-white font-semibold"
              style={{ backgroundColor: '#f97316' }}
              disabled={otpCode.length !== 6 || isVerifyingOTP}
              onClick={handleVerifyOTP}
              data-testid="button-verify-otp"
            >
              {isVerifyingOTP ? (
                <>
                  <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {isRTL ? 'جارٍ التحقق...' : 'Verifying...'}
                </>
              ) : (
                isRTL ? 'تحقق وإنشاء الحساب' : 'Verify & Create Account'
              )}
            </Button>

            <div className="flex items-center justify-between flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                style={{ borderColor: '#f97316', color: '#f97316' }}
                onClick={() => {
                  setOtpStep(false);
                  setOtpDigits(["", "", "", "", "", ""]);
                  setOtpCode("");
                }}
                data-testid="button-back-from-otp"
              >
                <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                {isRTL ? 'رجوع' : 'Back'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isSendingOTP}
                onClick={handleResendOTP}
                style={{ color: '#f97316' }}
                data-testid="button-resend-otp"
              >
                {isSendingOTP ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  isRTL ? 'إعادة إرسال الرمز' : 'Resend Code'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        <div id="recaptcha-container"></div>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #3d3d3d 100%)' }}>
        <Card className="w-full max-w-md border-2" style={{ borderColor: '#f97316' }}>
          <CardHeader className="text-center pb-2">
            <img 
              src={samanLogo} 
              alt="Saman Marketplace" 
              className="mx-auto mb-4 w-24 h-24 rounded-2xl object-cover shadow-lg"
            />
            <CardTitle className="text-2xl font-bold" style={{ color: '#f97316' }}>
              {isRTL ? 'استعادة كلمة المرور' : 'Reset Password'}
            </CardTitle>
            <CardDescription className="text-base" style={{ color: '#8a8a8a' }}>
              {isRTL ? 'أدخل رقم هاتفك وسنرسل رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' : 'Enter your phone number and we\'ll send a password reset link to your recovery email'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...form}>
              <FormField
                control={form.control}
                name="phone"
                rules={{ 
                  required: "Phone number is required",
                  minLength: { value: 9, message: "Please enter a valid phone number" }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('phoneNumber')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                        <Input
                          type="tel"
                          placeholder="+971 50 123 4567"
                          className={isRTL ? 'pr-10' : 'pl-10'}
                          data-testid="input-forgot-phone"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>

            <Button
              className="w-full text-white font-semibold"
              style={{ backgroundColor: '#f97316' }}
              disabled={isSendingReset}
              onClick={handleForgotPassword}
              data-testid="button-send-reset"
            >
              {isSendingReset ? (
                <>
                  <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {isRTL ? 'جارٍ الإرسال...' : 'Sending...'}
                </>
              ) : (
                isRTL ? 'إرسال رابط إعادة التعيين' : 'Send Reset Link'
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              style={{ borderColor: '#f97316', color: '#f97316' }}
              onClick={() => setShowForgotPassword(false)}
              data-testid="button-back-to-login"
            >
              <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {isRTL ? 'العودة لتسجيل الدخول' : 'Back to Login'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #3d3d3d 100%)' }}>
      <Card className="w-full max-w-md border-2" style={{ borderColor: '#f97316' }}>
        <CardHeader className="text-center pb-2">
          <img 
            src={samanLogo} 
            alt="Saman Marketplace" 
            className="mx-auto mb-4 w-24 h-24 rounded-2xl object-cover shadow-lg"
          />
          <CardTitle className="text-2xl font-bold" style={{ color: '#f97316' }}>{t('appName')}</CardTitle>
          <CardDescription className="text-base" style={{ color: '#8a8a8a' }}>{t('appSubtitle')}</CardDescription>
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
                    <FormLabel>{t('phoneNumber')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                        <Input
                          type="tel"
                          placeholder="+971 50 123 4567"
                          className={isRTL ? 'pr-10' : 'pl-10'}
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
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <FormLabel>{t('password')}</FormLabel>
                      {!isNewUser && (
                        <button
                          type="button"
                          className="text-xs font-medium hover:underline"
                          style={{ color: '#f97316' }}
                          onClick={() => setShowForgotPassword(true)}
                          data-testid="button-forgot-password"
                        >
                          {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                        </button>
                      )}
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Lock className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                        <Input
                          type="password"
                          placeholder={t('enterPassword')}
                          className={isRTL ? 'pr-10' : 'pl-10'}
                          data-testid="input-password"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isNewUser && (
                <>
                  <FormField
                    control={form.control}
                    name="firstName"
                    rules={{ 
                      required: isNewUser ? "First name is required" : false,
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRTL ? 'الاسم الأول' : 'First Name'}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                            <Input
                              type="text"
                              placeholder={isRTL ? 'أدخل اسمك الأول' : 'Enter your first name'}
                              className={isRTL ? 'pr-10' : 'pl-10'}
                              data-testid="input-firstname"
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
                    name="lastName"
                    rules={{ 
                      required: isNewUser ? "Last name is required" : false,
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRTL ? 'اسم العائلة' : 'Last Name'}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                            <Input
                              type="text"
                              placeholder={isRTL ? 'أدخل اسم العائلة' : 'Enter your last name'}
                              className={isRTL ? 'pr-10' : 'pl-10'}
                              data-testid="input-lastname"
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
                    name="email"
                    rules={{
                      pattern: {
                        value: /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Please enter a valid email address",
                      }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {isRTL ? 'البريد الإلكتروني' : 'Email'}
                          <span className="text-muted-foreground text-xs font-normal ml-1">
                            ({isRTL ? 'اختياري - لاستعادة كلمة المرور' : 'Optional - for password recovery'})
                          </span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                            <Input
                              type="email"
                              placeholder={isRTL ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                              className={isRTL ? 'pr-10' : 'pl-10'}
                              data-testid="input-email"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <Button
                type="submit"
                className="w-full text-white font-semibold"
                style={{ backgroundColor: '#f97316' }}
                disabled={isLoading || isSendingOTP}
                data-testid="button-submit"
              >
                {(isLoading || isSendingOTP) ? (
                  <>
                    <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {isSendingOTP 
                      ? (isRTL ? 'جارٍ إرسال الرمز...' : 'Sending code...') 
                      : (isNewUser ? t('registering') : t('loggingIn'))}
                  </>
                ) : (
                  isNewUser ? (isRTL ? 'إرسال رمز التحقق' : 'Send Verification Code') : t('login')
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
                {isNewUser ? t('alreadyHaveAccount') : t('dontHaveAccount')}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isRTL ? 'بالمتابعة، فإنك توافق على شروط الخدمة وسياسة الخصوصية' : 'By continuing, you agree to our Terms of Service and Privacy Policy'}
          </p>
        </CardContent>
      </Card>
      <div id="recaptcha-container"></div>
    </div>
  );
}
