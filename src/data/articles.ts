
export interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  author: {
    name: string;
    avatarUrl: string;
  };
  publishedDate: string;
  category: string;
}

export const articles: Article[] = [
  {
    id: 1,
    slug: 'the-rise-of-ai-in-dental-diagnostics',
    title: 'The Rise of AI in Dental Diagnostics',
    excerpt: 'Artificial intelligence is transforming how dentists diagnose conditions, from cavities to oral cancers. Discover the latest breakthroughs.',
    content: `<p>The integration of artificial intelligence (AI) in dental diagnostics marks a significant leap forward for the field. By leveraging machine learning algorithms, dentists can now analyze radiographs with unprecedented accuracy, identifying early signs of decay and periodontal disease long before they become visible to the naked eye.</p><p>AI-powered systems are trained on vast datasets of dental images, enabling them to recognize subtle patterns that may elude human observation. This not only enhances diagnostic precision but also streamlines the clinical workflow, allowing for more efficient patient care.</p><h2>Key Applications</h2><ul><li>Automated caries detection on bitewing radiographs.</li><li>Early identification of periapical lesions.</li><li>Assessment of bone loss for periodontal disease diagnosis.</li><li>Cephalometric analysis for orthodontics.</li></ul><p>As technology continues to evolve, the role of AI in dentistry is set to expand, promising a future where diagnostics are faster, more accurate, and more accessible than ever before.</p>`,
    imageUrl: 'https://images.unsplash.com/photo-1629904850761-e8b4de3d932b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
    author: {
      name: 'Dr. Evelyn Reed',
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
    },
    publishedDate: 'June 10, 2025',
    category: 'Industry',
  },
  {
    id: 2,
    slug: 'how-ai-is-revolutionizing-dental-practice-management',
    title: 'How AI is Revolutionizing Dental Practice Management',
    excerpt: 'From scheduling appointments to managing patient records, AI is streamlining the administrative side of dental clinics, freeing up time for patient care.',
    content: `<p>Beyond the clinical applications, AI is making significant waves in dental practice management. AI-driven software is automating tedious administrative tasks, leading to increased efficiency and reduced operational costs.</p><p>These systems can optimize appointment scheduling to minimize downtime, automate insurance claim processing, and provide valuable insights into practice performance through data analytics. By handling the backend operations, AI allows dental professionals to focus on what they do best: providing exceptional patient care.</p><h2>Transforming Operations</h2><ul><li>Intelligent appointment scheduling and reminders.</li><li>Automated billing and insurance verification.</li><li>Predictive analytics for patient flow and resource allocation.</li><li>Personalized patient communication and follow-ups.</li></ul><p>The adoption of AI in practice management is not just about technology; it's about creating a more patient-centric and efficient dental practice for the modern era.</p>`,
    imageUrl: 'https://images.unsplash.com/photo-15518b5338-b03a761827a8?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
    author: {
      name: 'John Carter',
      avatarUrl: 'https://i.pravatar.cc/150?img=2',
    },
    publishedDate: 'June 5, 2025',
    category: 'Tools',
  },
    {
    id: 3,
    slug: 'top-5-ai-powered-tools-for-modern-dentists',
    title: 'Top 5 AI-Powered Tools for Modern Dentists',
    excerpt: 'A curated list of the most impactful AI tools that are changing the game for clinicians and dental clinics worldwide.',
    content: `<p>The market is now brimming with innovative AI-powered tools designed to support dental professionals. Navigating the options can be challenging, so we've compiled a list of top-tier solutions that are making a real difference.</p><p>From diagnostic aids to treatment planning software, these tools are at the forefront of the dental technology revolution. They empower dentists with data-driven insights, improve treatment outcomes, and enhance the overall patient experience.</p><h2>Must-Have AI Tools</h2><ol><li><strong>Overjet:</strong> An FDA-cleared AI platform for analyzing dental radiographs and quantifying disease.</li><li><strong>Pearl:</strong> Offers a suite of AI solutions for pathology detection and practice intelligence.</li><li><strong>DentalMonitoring:</strong> A remote monitoring solution that uses AI to track treatment progress, especially in orthodontics.</li><li><strong>VideaHealth:</strong> Provides AI-powered diagnostics to help dentists detect diseases earlier and more accurately.</li><li><strong>Pre-op:</strong> AI-based treatment planning software for restorative dentistry and implantology.</li></ol><p>Investing in these tools can provide a significant return, not just financially, but in the quality of care delivered to patients.</p>`,
    imageUrl: 'https://images.unsplash.com/photo-1580281658223-9b93f18ae9ae?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
    author: {
      name: 'Dr. Anya Sharma',
      avatarUrl: 'https://i.pravatar.cc/150?img=3',
    },
    publishedDate: 'May 28, 2025',
    category: 'Research',
  },
];
