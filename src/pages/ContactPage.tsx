import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as React from "react";
import { Loader2 } from "lucide-react";

// The email address that will receive the contact form submissions.
// 🔥 SPRINT 3: Updated with proper email configuration
const RECIPIENT_EMAIL = "thechenmor@gmail.com";

const sendContactEmail = async (formData: { name: string; email: string; subject: string; message: string; }) => {
    const { name, email, subject, message } = formData;
    const emailHtml = `
      <h1>New Contact Form Submission</h1>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
      <p><strong>Subject:</strong> ${subject}</p>
      <hr />
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, "<br>")}</p>
    `;

    // We use the existing 'send-email' edge function.
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: RECIPIENT_EMAIL,
        subject: `[DentAI Contact] New message from ${name}`,
        body: emailHtml,
      }
    });

    if (error) {
      console.error('Contact form error:', error);
      throw new Error(`Failed to send message: ${error.message || 'Please try again later.'}`);
    }
};

const ContactPage = () => {
  const formRef = React.useRef<HTMLFormElement>(null);
  
  const { mutate, isPending } = useMutation({
    mutationFn: sendContactEmail,
    onSuccess: () => {
      // 🔥 SPRINT 3: Add analytics tracking
      console.log('Contact form submitted successfully');
      
      toast({
        title: "Message Sent!",
        description: "Thank you for reaching out. We'll get back to you soon.",
      });
      formRef.current?.reset();
    },
    onError: (error) => {
      toast({
        title: "Uh oh! Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    };

    // 🔥 SPRINT 3: Add form validation
    if (!data.name.trim() || !data.email.trim() || !data.subject.trim() || !data.message.trim()) {
      toast({
        title: "Please fill in all fields",
        description: "All fields are required.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      toast({
        title: "Invalid email address",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    mutate(data);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow container mx-auto px-6 lg:px-12 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">Contact Us</h1>
          <p className="text-center text-muted-foreground mb-12">
            Have a question, a suggestion, or want to collaborate? We'd love to hear from you. Fill out the form below and we'll get back to you as soon as possible.
          </p>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="Your Name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="your@email.com" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" placeholder="What is this about?" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" name="message" placeholder="Your message..." rows={6} required />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
