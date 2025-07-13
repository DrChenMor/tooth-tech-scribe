import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { unsubscribeFromNewsletter, validateEmail } from '@/services/newsletter';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle, Mail } from 'lucide-react';

const UnsubscribePage = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setStatus('idle');

    try {
      const result = await unsubscribeFromNewsletter(email);
      
      if (result.success) {
        setStatus('success');
        setEmail('');
        toast({
          title: "Success!",
          description: result.message,
        });
      } else {
        setStatus('error');
        toast({
          title: "Unsubscribe failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      setStatus('error');
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl shadow-black/10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Unsubscribe from Newsletter
            </h1>
            <p className="text-gray-600">
              We're sorry to see you go. Enter your email to unsubscribe from our newsletter.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white focus:border-red-300/60 focus:shadow-lg focus:shadow-red-500/10 transition-all duration-300 placeholder:text-gray-400"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-red-700/25 hover:-translate-y-0.5 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Unsubscribing...
                </>
              ) : status === 'success' ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Unsubscribed!
                </>
              ) : status === 'error' ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Try Again
                </>
              ) : (
                'Unsubscribe'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-4">
              Changed your mind? You can always resubscribe later.
            </p>
            <a 
              href="/" 
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnsubscribePage; 