
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, Workflow, Sparkles, Code, Settings, Newspaper } from "lucide-react";

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/workflow-builder", label: "Workflow Builder", icon: Workflow },
  { href: "/admin/ai-generator", label: "AI Generator", icon: Sparkles },
  { href: "/admin/ai-agent-advanced", label: "Python Agent", icon: Code },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const AdminSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-background p-4 hidden md:block">
      <div className="flex items-center gap-2 mb-8">
        <Newspaper className="h-8 w-8 text-primary" />
        <h2 className="text-xl font-bold">Denti-AI Admin</h2>
      </div>
      <nav className="flex flex-col gap-2">
        {navLinks.map((link) => (
          <Button
            key={link.href}
            asChild
            variant={location.pathname === link.href ? "secondary" : "ghost"}
            className="justify-start"
          >
            <Link to={link.href}>
              <link.icon className="mr-2 h-4 w-4" />
              {link.label}
            </Link>
          </Button>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
