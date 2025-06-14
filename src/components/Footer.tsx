
const Footer = () => {
  return (
    <footer className="py-8 mt-16 border-t">
      <div className="container mx-auto text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} Dental AI Insights. All rights reserved.</p>
        <p className="mt-2">A Lovable Project</p>
      </div>
    </footer>
  );
};

export default Footer;
