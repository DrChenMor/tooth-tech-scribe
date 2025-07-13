
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const AuthPage = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSigningUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        console.error('Signup error:', error);
        toast({ 
          variant: "destructive", 
          title: "Signup Error", 
          description: error.message || "Failed to create account. Please try again." 
        });
      } else {
        toast({ 
          title: "Check your email", 
          description: "A confirmation link has been sent to your email." 
        });
        setIsSigningUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.error('Login error:', error);
        toast({ 
          variant: "destructive", 
          title: "Login Error", 
          description: error.message || "Invalid email or password. Please try again." 
        });
      } else {
        toast({ title: "Successfully logged in!" });
        navigate('/admin');
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) {
      toast({
        variant: "destructive",
        title: "Reset Error",
        description: error.message || "Failed to send reset email."
      });
    } else {
      toast({
        title: "Check your email",
        description: "A password reset link has been sent to your email."
      });
      setShowForgot(false);
      setForgotEmail('');
    }
    setForgotLoading(false);
  };

  if (session) {
    return <Navigate to="/admin" />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="mx-auto max-w-sm w-full">
          <CardHeader>
            <CardTitle className="text-2xl">{isSigningUp ? 'Sign Up' : showForgot ? 'Reset Password' : 'Sign In'}</CardTitle>
            <CardDescription>
              {isSigningUp
                ? 'Create an account to get started'
                : showForgot
                  ? 'Enter your email to receive a password reset link.'
                  : 'Enter your email below to login to your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showForgot ? (
              <form onSubmit={handleForgotPassword} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={forgotLoading}>
                  {forgotLoading ? 'Sending...' : 'Send reset link'}
                </Button>
                <div className="mt-2 text-center text-sm">
                  <button type="button" onClick={() => setShowForgot(false)} className="underline">
                    Back to sign in
                  </button>
                </div>
              </form>
            ) : (
              <>
                <form onSubmit={handleAuthAction} className="grid gap-4">
                  {isSigningUp && (
                    <div className="grid gap-2">
                      <Label htmlFor="full-name">Full Name</Label>
                      <Input id="full-name" placeholder="John Doe" required={isSigningUp} value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Processing...' : (isSigningUp ? 'Create an account' : 'Sign in')}
                  </Button>
                </form>
                <div className="mt-4 text-center text-sm">
                  {!isSigningUp && (
                    <button type="button" onClick={() => setShowForgot(true)} className="underline mr-4">
                      Forgot password?
                    </button>
                  )}
                  {isSigningUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button onClick={() => setIsSigningUp(!isSigningUp)} className="underline">
                    {isSigningUp ? 'Sign in' : 'Sign up'}
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default AuthPage;
