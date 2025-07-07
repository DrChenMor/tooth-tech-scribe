
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AboutPage = () => {
  const { data: reporters, isLoading } = useQuery({
    queryKey: ['active-reporters'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('reporters')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fallback team members if no reporters in database
  const fallbackTeamMembers = [
    {
      name: "Dr. Sarah Johnson",
      role: "Dental AI Researcher",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
      color: "bg-blue-100"
    },
    {
      name: "Dr. Michael Chen", 
      role: "Clinical Director",
      image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face",
      color: "bg-green-100"
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "Technology Lead", 
      image: "https://images.unsplash.com/photo-1594824716093-836d4c8c1bf5?w=400&h=400&fit=crop&crop=face",
      color: "bg-red-100"
    },
    {
      name: "Dr. James Wilson",
      role: "Research Scientist",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face", 
      color: "bg-purple-100"
    }
  ];

  const teamMembers = reporters?.length > 0 ? reporters.map((reporter, index) => ({
    name: reporter.name,
    role: reporter.specialties?.[0] || "Content Specialist",
    image: reporter.avatar_url,
    color: ["bg-blue-100", "bg-green-100", "bg-red-100", "bg-purple-100"][index % 4]
  })) : fallbackTeamMembers;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-16">
          {/* Header Section */}
          <div className="text-center mb-16">
            <p className="text-sm text-muted-foreground mb-4 uppercase tracking-wide">About Us</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-8">Your Trusted Source for Insightful Content</h1>
          </div>

          {/* Main Content Section */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <div className="relative">
              <div className="w-full h-80 bg-pink-100 rounded-lg flex items-center justify-center overflow-hidden">
                <div className="w-48 h-48 bg-pink-200 rounded-full flex items-center justify-center">
                  <div className="w-32 h-32 bg-pink-300 rounded-full flex items-center justify-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full shadow-inner"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground leading-relaxed">
                We are a passionate team of writers, creators, and experts dedicated to bringing you the best content in Lifestyle, Business, Travel, Finance, and Technology. Our mission is to empower our readers with practical advice, fresh perspectives, and thought-provoking ideas that make a difference in everyday life.
              </p>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Whether you're looking for tips to elevate your lifestyle, strategies to grow your business, travel inspiration, financial wisdom, or the latest tech trends, we have something for you. We believe in creating content that is not only informative but also engaging and easy to digest.
              </p>
              
              <Button asChild size="lg">
                <Link to="/contact">Get in touch →</Link>
              </Button>
            </div>
          </div>


        {/* === Editorial Team Section === */}
        <section className="py-6 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Meet the Editorial Team</h2>
              <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
                Our experts ensure every article is accurate, insightful, and relevant.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member) => (
                <Card key={member.name} className="border-0 text-center rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group">
                  <CardContent className="p-0">
                    {/* Colorful Background Area */}
                    <div className={`relative h-40 flex items-center justify-center transition-colors duration-300 ${member.color}`}>
                       <Avatar className="w-28 h-28 border-4 border-white shadow-lg transform transition-transform duration-300 group-hover:scale-110">
                        <AvatarImage src={member.image} alt={member.name} />
                        <AvatarFallback className="text-3xl font-semibold bg-gray-200">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    {/* White Content Area */}
                    <div className="bg-white p-6">
                      <h3 className="font-light text-xl text-gray-900 mb-1">{member.name}</h3>
                      <p className="text-primary font-medium text-sm">{member.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
