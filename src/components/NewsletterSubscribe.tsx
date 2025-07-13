import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { subscribeToNewsletter, validateEmail } from '@/services/newsletter';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface NewsletterSubscribeProps {
  variant?: 'default' | 'compact';
  placeholder?: string;
  buttonText?: string;
  className?: string;
}

export const NewsletterSubscribe = ({
  variant = 'default',
  placeholder = 'Enter your email',
  buttonText = 'Subscribe',
  className = ''
}: NewsletterSubscribeProps) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
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
      const result = await subscribeToNewsletter(email, name);
      
      if (result.success) {
        setStatus('success');
        setEmail('');
        setName('');
        toast({
          title: "Success!",
          description: result.message,
        });
      } else {
        setStatus('error');
        toast({
          title: "Subscription failed",
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

  if (variant === 'compact') {
    return (
      <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
        <Input
          type="email"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          className="flex-1 bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-300/60 focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 placeholder:text-gray-400"
        />
        <Button
          type="submit"
          disabled={isLoading}
          className="bbg-primary hover:bg-primary hover:bg-blue-900 text-white rounded-2xl font-medium px-4 transition-all duration-300 hover:shadow-lg hover:shadow-blue-700/25 hover:-translate-y-0.5 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : status === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : status === 'error' ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            buttonText
          )}
        </Button>
      </form>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-blue-900">Stay Updated</h3>
      <p className="text-sm text-gray-600">
        Get the latest AI dental insights delivered to your inbox weekly.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          className="bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-300/60 focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 placeholder:text-gray-400"
        />
        <Input
          type="email"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          className="bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-300/60 focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 placeholder:text-gray-400"
        />
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bbg-primary hover:bg-primary hover:bg-blue-900 text-white rounded-2xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-700/25 hover:-translate-y-0.5 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Subscribing...
            </>
          ) : status === 'success' ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Subscribed!
            </>
          ) : status === 'error' ? (
            <>
              <AlertCircle className="w-4 h-4 mr-2" />
              Try Again
            </>
          ) : (
            buttonText
          )}
        </Button>
      </form>
    </div>
  );
}; 