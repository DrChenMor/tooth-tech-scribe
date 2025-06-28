import { Link } from 'react-router-dom';
import { Mail, Twitter, Linkedin, Github, ArrowUp, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-900 text-slate-300 mt-16">
      {/* Main Footer Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Smile className="text-blue-400" size={32} />
              <span className="text-xl font-bold text-white">Dental AI Insights</span>
            </div>
            <p className="text-sm leading-relaxed">
              Your trusted source for the latest in AI-powered dental technology, 
              research breakthroughs, and industry insights.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                <Github size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/articles" className="block text-sm hover:text-blue-400 transition-colors">
                All Articles
              </Link>
              <Link to="/categories" className="block text-sm hover:text-blue-400 transition-colors">
                Categories
              </Link>
              <Link to="/about" className="block text-sm hover:text-blue-400 transition-colors">
                About Us
              </Link>
              <Link to="/contact" className="block text-sm hover:text-blue-400 transition-colors">
                Contact
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Topics</h3>
            <div className="space-y-2">
              <Link to="/category/AI Technology" className="block text-sm hover:text-blue-400 transition-colors">
                AI Technology
              </Link>
              <Link to="/category/Research" className="block text-sm hover:text-blue-400 transition-colors">
                Research
              </Link>
              <Link to="/category/Industry" className="block text-sm hover:text-blue-400 transition-colors">
                Industry News
              </Link>
              <Link to="/category/Tools" className="block text-sm hover:text-blue-400 transition-colors">
                Tools & Software
              </Link>
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Stay Updated</h3>
            <p className="text-sm">
              Get the latest AI dental insights delivered to your inbox weekly.
            </p>
            <div className="space-y-2">
              <Input 
                type="email" 
                placeholder="Enter your email"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-blue-400"
              />
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm">
              <p>&copy; {new Date().getFullYear()} DentaAI Insights. All rights reserved.</p>
              <div className="flex space-x-4">
                <a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-blue-400 transition-colors">Cookie Policy</a>
              </div>
            </div>
            
            {/* Back to Top Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollToTop}
              className="text-slate-400 hover:text-blue-400 hover:bg-slate-800"
            >
              <ArrowUp size={16} className="mr-1" />
              Back to Top
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;