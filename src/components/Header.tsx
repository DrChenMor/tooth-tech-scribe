
import { Smile } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';

const Header = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="py-6">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Smile className="text-primary" size={28} />
          <span>Dental AI Insights</span>
        </Link>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <Link to="/about" className="hover:text-primary transition-colors">About</Link>
            <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
          </nav>
          {user ? (
            <div className="flex items-center gap-4">
              {isAdmin && <Button asChild variant="outline" size="sm"><Link to="/admin">Admin</Link></Button>}
              <Button onClick={handleLogout} variant="ghost" size="sm">Logout</Button>
            </div>
          ) : (
            <Button asChild size="sm"><Link to="/auth">Login</Link></Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
