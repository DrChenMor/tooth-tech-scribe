
import { Tooth } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="py-6">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Tooth className="text-primary" size={28} />
          <span>Dental AI Insights</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <a href="#" className="hover:text-primary transition-colors">About</a>
          <a href="#" className="hover:text-primary transition-colors">Contact</a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
