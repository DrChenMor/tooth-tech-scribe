import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

// ✅ NEW: Adapted your smart fallback logic for a single, specific image
const getHeroImageWithFallbacks = (imageName: string): string => {
  // Replace with your actual Supabase URL and bucket name
  const supabaseUrl = 'https://nuhjsrmkkqtecfkjrcox.supabase.co'; 
  const bucketName = 'article-images'; // ⚠️ IMPORTANT: REPLACE THIS

  const formats = ['jpg', 'jpeg', 'png', 'webp'];
  
  const imageUrls = formats.map(format => 
    `url("${supabaseUrl}/storage/v1/object/public/${bucketName}/${imageName}.${format}")`
  );
  
  // You can add a final Unsplash/placeholder fallback if you want
  // imageUrls.push(`url("https://images.unsplash.com/your-fallback-image")`);
  
  return imageUrls.join(', ');
};

const AboutPage = () => {
  // Query for reporters (existing code)
  const { data: reporters, isLoading: isLoadingReporters } = useQuery({
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

  const fallbackTeamMembers = [
    {
      name: "Dr. Chen Mor",
      role: "Editor-in-Chief",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face", 
      color: "bg-purple-100"
    }
  ];

  const teamMembers = !isLoadingReporters && reporters?.length > 0 ? reporters.map((reporter, index) => ({
    name: reporter.name,
    role: reporter.specialties?.[0] || "Content Specialist",
    image: reporter.avatar_url,
    color: ["bg-blue-100", "bg-green-100", "bg-red-100", "bg-purple-100"][index % 4]
  })) : fallbackTeamMembers;

  // ✅ Get the background image string
  const heroBackgroundImage = getHeroImageWithFallbacks('about-us-hero');

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
            
            {/* ✅ STEP 2: APPLY THE BACKGROUND IMAGE STYLE */}
            <div 
              className="relative w-full h-96 rounded-lg bg-cover bg-center bg-pink-100" // bg-pink-100 acts as a fallback color
              style={{ backgroundImage: heroBackgroundImage }}
            >
              {/* This div is now just for a subtle overlay if needed, or can be removed */}
              <div className="absolute inset-0 bg-black/10 rounded-lg"></div>
            </div>
            
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground leading-relaxed">
                At DentAI, we explore the dynamic intersection of dentistry and artificial intelligence. Our team is composed of passionate dental professionals and technology experts committed to delivering the most current and relevant content in the field.
              </p>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
              Our mission is to empower you with practical insights and clear analysis of cutting-edge research and tools. Whether you're a practitioner, student, or enthusiast, we provide the essential knowledge to navigate and thrive in the future of dentistry.
              </p>
              
              <Button asChild size="lg" className="group">
                <Link to="/contact">Get in touch →</Link>
              </Button>
            </div>
          </div>


        {/* === Editorial Team Section === */}
        <section className="py-12 bg-slate-50 rounded-3xl">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Meet the Editorial Team</h2>
              <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
                Our experts ensure every article is accurate, insightful, and relevant.
              </p>
            </div>
            
            {/* ✅ THIS IS THE KEY CHANGE: Using Flexbox for centering */}
            <div className="flex flex-wrap justify-center gap-8">
              {isLoadingReporters ? (
                // Show skeletons while loading data
                [...Array(4)].map((_, i) => (
                  <div key={i} className="w-full sm:w-64">
                    <Skeleton className="h-40 w-full rounded-t-2xl" />
                    <div className="bg-white p-6 rounded-b-2xl">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))
              ) : (
                // Render team members once loaded
                teamMembers.map((member) => (
                  <div key={member.name} className="w-full sm:w-64 lg:w-72">
                    <Card className="border-0 text-center rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group">
                      <CardContent className="p-0">
                        <div className={`relative h-40 flex items-center justify-center transition-colors duration-300 ${member.color}`}>
                          <Avatar className="w-28 h-28 border-4 border-white shadow-lg transform transition-transform duration-300 group-hover:scale-110">
                            <AvatarImage src={member.image} alt={member.name} />
                            <AvatarFallback className="text-3xl font-semibold bg-gray-200">
                              {member.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="bg-white p-6">
                          <h3 className="font-semibold text-xl text-gray-900 mb-1">{member.name}</h3>
                          <p className="text-primary font-medium text-sm">{member.role}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))
              )}
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