import { Link } from 'react-router-dom';
import { Mail, Twitter, Linkedin, Github, ArrowUp, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// --- Helper Components (to keep code clean while preserving all styles) ---

const BrandSection = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 bg-blue-600/90 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0 hover:bg-blue-700/90 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5">
        <Smile className="text-white" size={20} />
      </div>
      <span className="text-xl font-bold text-blue-900">Dental AI Insights</span>
    </div>
    <p className="text-sm leading-relaxed text-gray-600">
      Your trusted source for the latest in AI-powered dental technology, research breakthroughs, and industry insights.
    </p>
    <div className="flex space-x-3">
      {[Twitter, Linkedin, Github, Mail].map((Icon, index) => (
        <a key={index} href="#" className="w-10 h-10 bg-gray-100/80 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-blue-50/90 hover:text-blue-600 transition-all duration-300 cursor-pointer hover:shadow-md hover:-translate-y-0.5">
          <Icon size={16} />
        </a>
      ))}
    </div>
  </div>
);

const LinkSection = ({ title, links, noTitle = false }) => (
  <div className="space-y-4">
    {!noTitle && <h3 className="text-lg font-semibold text-blue-900">{title}</h3>}
    <div className="space-y-3">
      {links.map((link) => (
        <Link key={link.title} to={link.href} className="block text-sm text-gray-600 hover:text-blue-600 transition-colors duration-300 hover:translate-x-1 transform px-3 py-2 rounded-xl hover:bg-blue-50/50">
          {link.title}
        </Link>
      ))}
    </div>
  </div>
);

const NewsletterSection = () => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-blue-900">Stay Updated</h3>
    <p className="text-sm text-gray-600">
      Get the latest AI dental insights delivered to your inbox weekly.
    </p>
    <div className="space-y-3">
      <Input type="email" placeholder="Enter your email" className="bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-300/60 focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 placeholder:text-gray-400" />
      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 backdrop-blur-sm">
        Subscribe
      </Button>
    </div>
  </div>
);

// --- Main Footer Component ---

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const quickLinks = [
    { title: "All Articles", href: "/articles" },
    { title: "Categories", href: "/categories" },
    { title: "About Us", href: "/about" },
    { title: "Contact", href: "/contact" },
  ];

  const topics = [
    { title: "AI Technology", href: "/category/AI Technology" },
    { title: "Research", href: "/category/Research" },
    { title: "Industry News", href: "/category/Industry" },
    { title: "Tools & Software", href: "/category/Tools" },
  ];

  return (
    <footer className="mt-16 p-4 lg:p-6">
      {/* Main Footer Content with Capsule Style & Hover Animation */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl py-8 px-6 lg:py-12 lg:px-8 shadow-xl shadow-black/5 border border-white/20 hover:shadow-2xl hover:shadow-black/10 transition-all duration-500 ease-out hover:-translate-y-1 relative z-10">
        <div className="container mx-auto">
          
          {/* ✅ DESKTOP: Grid Layout (hidden below 1024px) */}
          <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <BrandSection />
            <LinkSection title="Quick Links" links={quickLinks} />
            <LinkSection title="Topics" links={topics} />
            <NewsletterSection />
          </div>

          {/* ✅ MOBILE & TABLET: Accordion Layout (hidden above 1024px) */}
          <div className="block lg:hidden space-y-8">
            <BrandSection />
            <NewsletterSection />
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="quick-links">
                <AccordionTrigger className="text-lg font-semibold text-blue-900 hover:no-underline">Quick Links</AccordionTrigger>
                <AccordionContent>
                  <LinkSection links={quickLinks} noTitle />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="topics" className="border-b-0">
                <AccordionTrigger className="text-lg font-semibold text-blue-900 hover:no-underline">Topics</AccordionTrigger>
                <AccordionContent>
                  <LinkSection links={topics} noTitle />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

        </div>
      </div>

      {/* Bottom Bar with Copyright */}
      <div className="mt-4">
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl py-4 px-6 shadow-lg shadow-black/5 border border-white/20 transition-all duration-300">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-col md:flex-row items-center gap-x-6 gap-y-2 text-sm">
                <p className="text-gray-600 text-center md:text-left">© {new Date().getFullYear()} DentaAI Insights. All rights reserved.</p>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors duration-300 px-3 py-1 rounded-xl hover:bg-blue-50/50">Privacy Policy</a>
                  <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors duration-300 px-3 py-1 rounded-xl hover:bg-blue-50/50">Terms of Service</a>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={scrollToTop} className="text-gray-500 hover:text-blue-600 hover:bg-blue-50/80 rounded-2xl transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <ArrowUp size={16} className="mr-1" />
                Back to Top
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;