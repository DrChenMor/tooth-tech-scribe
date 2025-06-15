
import { SidebarTrigger } from '@/components/ui/sidebar';

const Header = () => {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
      <SidebarTrigger />
      {/* We can add breadcrumbs or a search bar here in the future */}
    </header>
  );
};

export default Header;
