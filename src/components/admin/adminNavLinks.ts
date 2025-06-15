
import { 
  LayoutDashboard, 
  FileEdit, 
  Wand2, 
  Settings, 
  Workflow,
  Brain
} from "lucide-react";

export const adminNavLinks = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "AI Co-Pilot",
    url: "/admin/ai-copilot",
    icon: Brain,
  },
  {
    title: "AI Content Generator",
    url: "/admin/ai-generator",
    icon: Wand2,
  },
  {
    title: "AI Agent (Advanced)",
    url: "/admin/ai-agent-advanced",
    icon: Workflow,
  },
  {
    title: "Workflow Builder",
    url: "/admin/workflow-builder",
    icon: Workflow,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
  },
];
