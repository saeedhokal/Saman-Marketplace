import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { Loader2, Lock, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import samanLogo from "@/assets/saman-logo.jpg";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const { isRTL } = useLanguage();
  const params = new URLSearchParams(search);
  const token = params.get("token");

  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setIsVerifying(false);
      setErrorMessage(isRTL ? "رابط إعادة التعيين غير صالح" : "Invalid reset link");
      return;
    }

    fetch(`/api/auth/reset-password/verify?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.valid) {
          setIsValid(true);
        } else {
          setErrorMessage(data.message || (isRTL ? "انتهت صلاحية الرابط" : "This reset link has expired"));
        }
      })
      .catch(() => {
        setErrorMessage(isRTL ? "فشل في التحقق من الرابط" : "Failed to verify reset link");
      })
      .finally(() => {
        setIsVerifying(false);
      });
  }, [token, isRTL]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 4) {
      toast({
        variant: "destructive",
        title: isRTL ? "خطأ" : "Error",
        description: isRTL ? "يجب أن تكون كلمة المرور 4 أحرف على الأقل" : "Password must be at least 4 characters",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: isRTL ? "خطأ" : "Error",
        description: isRTL ? "كلمتا المرور غير متطابقتين" : "Passwords don't match",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setIsSuccess(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: isRTL ? "خطأ" : "Error",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #3d3d3d 100%)' }}>
      <Card className="w-full max-w-md border-2" style={{ borderColor: '#f97316' }}>
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4">
            <img src={samanLogo} alt="Saman" className="w-20 h-20 rounded-xl object-cover mx-auto" />
          </div>
          <CardTitle className="text-2xl font-bold" style={{ color: '#f97316' }}>
            {isRTL ? 'سمان ماركت بليس' : 'Saman Marketplace'}
          </CardTitle>
          <CardDescription>
            {isRTL ? 'إعادة تعيين كلمة المرور' : 'Reset Your Password'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isVerifying ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <p className="text-muted-foreground">{isRTL ? 'جارِ التحقق...' : 'Verifying your reset link...'}</p>
            </div>
          ) : isSuccess ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <h3 className="text-lg font-semibold text-center">
                {isRTL ? 'تم إعادة تعيين كلمة المرور!' : 'Password Reset Successfully!'}
              </h3>
              <p className="text-muted-foreground text-center text-sm">
                {isRTL ? 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة' : 'You can now log in with your new password'}
              </p>
              <Button
                onClick={() => setLocation("/auth")}
                className="w-full mt-4"
                style={{ backgroundColor: '#f97316' }}
                data-testid="button-go-to-login"
              >
                {isRTL ? 'تسجيل الدخول' : 'Go to Login'}
              </Button>
            </div>
          ) : !isValid ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <XCircle className="h-16 w-16 text-red-500" />
              <h3 className="text-lg font-semibold text-center">
                {isRTL ? 'رابط غير صالح' : 'Invalid or Expired Link'}
              </h3>
              <p className="text-muted-foreground text-center text-sm">
                {errorMessage}
              </p>
              <Button
                onClick={() => setLocation("/auth")}
                variant="outline"
                className="w-full mt-4"
                data-testid="button-back-to-login"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {isRTL ? 'العودة لتسجيل الدخول' : 'Back to Login'}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder={isRTL ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10"
                    data-testid="input-new-password"
                    required
                    minLength={4}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder={isRTL ? 'أعد إدخال كلمة المرور' : 'Re-enter password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    data-testid="input-confirm-password"
                    required
                    minLength={4}
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                style={{ backgroundColor: '#f97316' }}
                disabled={isSubmitting}
                data-testid="button-reset-password"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isRTL ? 'جارِ إعادة التعيين...' : 'Resetting...'}
                  </>
                ) : (
                  isRTL ? 'إعادة تعيين كلمة المرور' : 'Reset Password'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}