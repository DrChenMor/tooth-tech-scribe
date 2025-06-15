
import { SidebarTrigger } from '@/components/ui/sidebar';
import TopNavigation from '@/components/TopNavigation';

const Header = () => {
  return (
    <div className="flex flex-col">
      <TopNavigation />
      <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 md:hidden">
        <SidebarTrigger />
        {/* Mobile menu trigger - only shown on mobile */}
      </header>
    </div>
  );
};

export default Header;
