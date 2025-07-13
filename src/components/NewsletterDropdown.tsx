import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { subscribeToNewsletter, validateEmail } from '@/services/newsletter';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle, Mail, X } from 'lucide-react';

interface NewsletterDropdownProps {
  className?: string;
}

export const NewsletterDropdown = ({ className = '' }: NewsletterDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        // Close dropdown after successful subscription
        setTimeout(() => setIsOpen(false), 1500);
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

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="
          bbg-primary hover:bg-primary hover:bg-blue-900 text-white rounded-2xl font-medium p-3 lg:px-6
          transition-all duration-300 
          hover:shadow-lg hover:shadow-blue-500/25 
          hover:-translate-y-0.5
          backdrop-blur-sm
        "
      >
        <Mail className="w-4 h-4 lg:mr-2" />
        <span className="hidden lg:inline">Subscribe</span>
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl shadow-black/10 z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Stay Updated</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Get the latest AI dental insights
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 rounded-xl hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-300/60 focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 placeholder:text-gray-400"
              />
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-300/60 focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 placeholder:text-gray-400"
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bbg-primary hover:bg-primary hover:bg-blue-900 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-700/25 hover:-translate-y-0.5 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                  'Subscribe'
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Weekly updates • No spam • Unsubscribe anytime
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 