
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AboutPage = () => {
  const teamMembers = [
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
              
              <Button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg">
                Get in touch →
              </Button>
            </div>
          </div>

          {/* Editorial Team Section */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Editorial Team</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.slice(0, 3).map((member, index) => (
              <Card key={member.name} className="border-0 shadow-none bg-transparent">
                <CardContent className="p-0">
                  <div className={`${member.color} rounded-lg p-8 mb-4 flex items-center justify-center`}>
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={member.image} alt={member.name} />
                      <AvatarFallback className="text-xl font-semibold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg mb-1">{member.name}</h3>
                    <p className="text-muted-foreground text-sm">{member.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 max-w-2xl mx-auto">
            {teamMembers.slice(3).map((member, index) => (
              <Card key={member.name} className="border-0 shadow-none bg-transparent">
                <CardContent className="p-0">
                  <div className={`${member.color} rounded-lg p-8 mb-4 flex items-center justify-center`}>
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={member.image} alt={member.name} />
                      <AvatarFallback className="text-xl font-semibold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg mb-1">{member.name}</h3>
                    <p className="text-muted-foreground text-sm">{member.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
