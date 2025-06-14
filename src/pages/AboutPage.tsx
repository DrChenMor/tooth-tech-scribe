
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Smile } from "lucide-react";

const AboutPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">About Dental AI Insights</h1>
          <div className="flex justify-center mb-8">
            <Smile className="text-primary" size={64} />
          </div>
          <div className="prose lg:prose-xl mx-auto text-muted-foreground">
            <p>
              Welcome to Dental AI Insights, your premier source for the latest advancements, research, and discussions at the intersection of dentistry and artificial intelligence. Our mission is to bridge the gap between cutting-edge technology and clinical practice, providing dental professionals, researchers, and students with valuable, accessible, and up-to-date information.
            </p>
            <p>
              Founded by a team of passionate dental practitioners and AI experts, we believe that artificial intelligence holds the key to revolutionizing patient care, diagnostics, treatment planning, and practice management. From machine learning models that can detect cavities with superhuman accuracy to AI-driven software that streamlines administrative tasks, we cover the topics that matter most.
            </p>
            <p>
              Our blog features in-depth articles, expert interviews, case studies, and reviews of new technologies. We strive to create a community where ideas can be shared, questions can be asked, and the future of dentistry can be shaped together.
            </p>
            <p>
              Thank you for joining us on this exciting journey. We look forward to exploring the future of dental care with you.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
