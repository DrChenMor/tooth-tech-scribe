import React from 'react';
import SmartChatAgent from '@/components/SmartChatAgent';
import Footer from '@/components/Footer';
import { Bot, Brain, Search, Shield, Zap } from 'lucide-react';

const ChatPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Dental AI Assistant
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
              Get instant, accurate answers about dental technology, AI tools, and industry insights from our comprehensive database.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Only answers from our articles</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <span>Powered by Google's #1 AI model</span>
              </div>
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span>Semantic search technology</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Instant responses</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Smart Search</h3>
                <p className="text-sm text-muted-foreground">
                  Uses advanced AI to understand your questions and find the most relevant information from our articles.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Verified Sources</h3>
                <p className="text-sm text-muted-foreground">
                  Every answer comes with direct links to our published articles, ensuring accuracy and transparency.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">AI-Powered</h3>
                <p className="text-sm text-muted-foreground">
                  Built with Google's Gemini model, the world's most advanced AI for natural language understanding.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Chat Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <SmartChatAgent />
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold mb-2">How accurate are the answers?</h3>
                  <p className="text-muted-foreground">
                    The AI only answers based on information from our published articles, ensuring high accuracy and preventing hallucinations.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold mb-2">Can I see the source articles?</h3>
                  <p className="text-muted-foreground">
                    Yes! Every answer includes direct links to the source articles, so you can read the full content and verify information.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold mb-2">What topics can I ask about?</h3>
                  <p className="text-muted-foreground">
                    You can ask about dental AI tools, diagnostic technologies, practice management, industry trends, and any topic covered in our articles.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold mb-2">Is this service free?</h3>
                  <p className="text-muted-foreground">
                    Yes! The chat assistant is completely free to use, powered by Google's generous free tier of 15,000 requests per day.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ChatPage; 