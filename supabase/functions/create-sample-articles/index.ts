import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sampleArticles = [
  {
    title: "AI-Powered Dental Diagnostics: Revolutionizing Early Detection",
    slug: "ai-powered-dental-diagnostics-revolutionizing-early-detection",
    excerpt: "Discover how artificial intelligence is transforming dental diagnostics with unprecedented accuracy in detecting cavities, gum disease, and oral cancer at early stages.",
    content: `## Introduction

Artificial intelligence is revolutionizing dental diagnostics by providing unprecedented accuracy in detecting various oral health conditions. Modern AI systems can analyze dental images with remarkable precision, often outperforming human dentists in early detection scenarios.

## Key AI Diagnostic Technologies

### 1. Computer Vision for X-Ray Analysis
AI-powered computer vision systems can analyze dental X-rays in seconds, detecting:
- Early-stage cavities that might be missed by the human eye
- Bone loss patterns indicating periodontal disease
- Hidden infections or abscesses
- Root canal complications

### 2. Machine Learning for Risk Assessment
Advanced algorithms can predict patient risk factors for:
- Cavity development based on diet and oral hygiene patterns
- Periodontal disease progression
- Oral cancer likelihood based on tissue analysis

### 3. Real-Time Diagnostic Support
AI systems provide real-time assistance during examinations by:
- Highlighting areas of concern in imaging
- Suggesting additional diagnostic tests
- Providing treatment recommendations based on evidence-based protocols

## Clinical Benefits

The implementation of AI diagnostics has shown:
- 95% accuracy in cavity detection
- 40% reduction in missed diagnoses
- 60% faster diagnostic processes
- Improved patient outcomes through early intervention

## Future Implications

As AI technology continues to advance, we can expect:
- Integration with 3D imaging systems
- Predictive analytics for treatment planning
- Automated patient education and communication
- Enhanced telemedicine capabilities

The future of dental diagnostics is undoubtedly AI-powered, promising better outcomes for both practitioners and patients.`,
    category: "AI Tools",
    author_name: "Dr. Sarah Chen",
    status: "published"
  },
  {
    title: "Top 5 AI Practice Management Tools for Modern Dental Clinics",
    slug: "top-5-ai-practice-management-tools-modern-dental-clinics",
    excerpt: "Explore the most innovative AI-powered practice management solutions that are streamlining operations and improving patient care in dental practices worldwide.",
    content: `## Introduction

Modern dental practices are increasingly turning to AI-powered management tools to streamline operations, improve patient care, and boost efficiency. Here are the top 5 AI tools revolutionizing dental practice management.

## 1. Intelligent Scheduling Systems

### Features:
- Predictive scheduling based on patient history
- Automatic appointment optimization
- Smart reminder systems with natural language processing
- Conflict resolution and rescheduling automation

### Benefits:
- 30% reduction in no-shows
- Improved patient satisfaction
- Optimized staff utilization
- Reduced administrative workload

## 2. AI-Powered Patient Communication

### Features:
- Natural language processing for patient inquiries
- Automated follow-up messages
- Personalized treatment plan explanations
- Multilingual support capabilities

### Benefits:
- 24/7 patient support availability
- Consistent communication quality
- Reduced staff time on routine inquiries
- Enhanced patient engagement

## 3. Smart Inventory Management

### Features:
- Predictive ordering based on usage patterns
- Automated reorder notifications
- Cost optimization algorithms
- Expiration date tracking

### Benefits:
- Reduced waste and costs
- Never run out of essential supplies
- Optimized storage space utilization
- Better budget management

## 4. AI-Driven Financial Analytics

### Features:
- Revenue forecasting and analysis
- Insurance claim optimization
- Payment processing automation
- Financial performance insights

### Benefits:
- Improved cash flow management
- Faster insurance reimbursements
- Better financial decision-making
- Reduced billing errors

## 5. Clinical Decision Support Systems

### Features:
- Treatment plan recommendations
- Drug interaction checking
- Patient risk assessment
- Evidence-based protocol suggestions

### Benefits:
- Enhanced clinical decision-making
- Reduced treatment errors
- Improved patient safety
- Better treatment outcomes

## Implementation Strategy

When implementing AI practice management tools:
1. Start with one system and gradually expand
2. Ensure staff training and buy-in
3. Monitor performance metrics
4. Gather patient feedback
5. Continuously optimize and update

The integration of AI tools in dental practice management is not just a trend—it's the future of efficient, patient-centered dental care.`,
    category: "Practice Management",
    author_name: "Dr. Michael Rodriguez",
    status: "published"
  },
  {
    title: "The Future of Dental Imaging: AI-Enhanced 3D Technology",
    slug: "future-dental-imaging-ai-enhanced-3d-technology",
    excerpt: "Learn how AI is transforming dental imaging with advanced 3D technology, providing more accurate diagnoses and better treatment planning capabilities.",
    content: `## Introduction

The integration of artificial intelligence with 3D dental imaging technology is creating a paradigm shift in how dentists diagnose and plan treatments. This combination offers unprecedented precision and efficiency in dental care.

## AI-Enhanced 3D Imaging Technologies

### 1. Cone Beam Computed Tomography (CBCT) with AI
Modern CBCT systems equipped with AI can:
- Automatically identify anatomical structures
- Detect pathologies with high accuracy
- Generate precise measurements
- Create virtual treatment simulations

### 2. Intraoral Scanning with AI Analysis
AI-powered intraoral scanners provide:
- Real-time image enhancement
- Automatic margin detection
- Occlusion analysis
- Treatment outcome prediction

### 3. AI-Powered Image Reconstruction
Advanced algorithms can:
- Reduce radiation exposure while maintaining image quality
- Reconstruct missing image data
- Enhance image resolution
- Remove artifacts automatically

## Clinical Applications

### Implant Planning
AI-enhanced 3D imaging revolutionizes implant planning by:
- Automatically identifying optimal implant positions
- Predicting bone density and quality
- Simulating different implant scenarios
- Providing precise surgical guides

### Orthodontic Treatment
For orthodontic applications, AI can:
- Predict tooth movement patterns
- Optimize treatment plans
- Monitor progress automatically
- Adjust treatment protocols in real-time

### Endodontic Procedures
In root canal treatments, AI assists by:
- Identifying root canal anatomy
- Detecting hidden canals
- Measuring working lengths
- Predicting treatment outcomes

## Benefits for Dental Professionals

### Improved Accuracy
- 99% accuracy in anatomical structure identification
- Reduced diagnostic errors
- More precise treatment planning
- Better patient outcomes

### Enhanced Efficiency
- 50% faster image analysis
- Automated report generation
- Streamlined workflow integration
- Reduced chair time

### Better Patient Communication
- 3D visualizations for patient education
- Interactive treatment simulations
- Clear before-and-after projections
- Enhanced informed consent

## Future Developments

The future of AI-enhanced dental imaging includes:
- Real-time AI analysis during procedures
- Integration with robotic surgery systems
- Predictive analytics for treatment outcomes
- Augmented reality applications

## Implementation Considerations

When adopting AI-enhanced imaging:
1. Ensure proper training for staff
2. Validate AI recommendations
3. Maintain human oversight
4. Regular system updates
5. Patient education about AI benefits

The combination of AI and 3D imaging represents the cutting edge of dental technology, offering both practitioners and patients unprecedented levels of precision and care.`,
    category: "Imaging Technology",
    author_name: "Dr. Emily Watson",
    status: "published"
  },
  {
    title: "Machine Learning in Periodontal Disease Detection and Treatment",
    slug: "machine-learning-periodontal-disease-detection-treatment",
    excerpt: "Discover how machine learning algorithms are improving the detection, diagnosis, and treatment planning for periodontal diseases with remarkable accuracy.",
    content: `## Introduction

Machine learning is transforming the field of periodontics by providing more accurate detection, diagnosis, and treatment planning for periodontal diseases. These AI systems are helping dentists provide better care and achieve improved patient outcomes.

## AI in Periodontal Disease Detection

### Early Detection Systems
Machine learning algorithms can identify early signs of periodontal disease by analyzing:
- Gingival tissue changes
- Pocket depth measurements
- Bleeding patterns
- Bone loss indicators

### Risk Assessment Models
AI-powered risk assessment tools evaluate:
- Patient medical history
- Lifestyle factors
- Genetic predispositions
- Environmental factors

## Advanced Diagnostic Capabilities

### Image Analysis
AI systems can analyze various imaging modalities:
- Digital radiographs
- Intraoral photographs
- 3D scans
- Microscopic images

### Pattern Recognition
Machine learning excels at identifying:
- Disease progression patterns
- Treatment response indicators
- Recurrence risk factors
- Optimal intervention timing

## Treatment Planning and Optimization

### Personalized Treatment Plans
AI can generate customized treatment plans based on:
- Disease severity
- Patient preferences
- Medical history
- Treatment response predictions

### Outcome Prediction
Machine learning models can predict:
- Treatment success rates
- Healing timelines
- Maintenance requirements
- Long-term prognosis

## Clinical Applications

### Non-Surgical Periodontal Therapy
AI assists in:
- Scaling and root planing optimization
- Antibiotic selection
- Maintenance scheduling
- Progress monitoring

### Surgical Interventions
For surgical cases, AI helps with:
- Flap design optimization
- Graft material selection
- Surgical timing decisions
- Post-operative care planning

## Benefits and Outcomes

### Improved Accuracy
- 95% accuracy in disease detection
- 90% precision in treatment planning
- Reduced misdiagnosis rates
- Better treatment outcomes

### Enhanced Efficiency
- 40% faster diagnosis
- Streamlined treatment planning
- Automated documentation
- Reduced chair time

### Better Patient Care
- Personalized treatment approaches
- Improved patient education
- Enhanced follow-up care
- Better long-term outcomes

## Implementation Strategies

### Phase 1: Data Collection
- Establish baseline measurements
- Implement standardized protocols
- Train staff on new systems
- Validate AI recommendations

### Phase 2: Integration
- Integrate AI tools into workflow
- Monitor performance metrics
- Gather patient feedback
- Optimize system parameters

### Phase 3: Optimization
- Continuous learning and improvement
- Regular system updates
- Performance monitoring
- Outcome analysis

## Future Directions

The future of AI in periodontics includes:
- Real-time monitoring systems
- Predictive maintenance scheduling
- Automated treatment adjustments
- Enhanced patient engagement tools

Machine learning is not just improving periodontal care—it's revolutionizing how we approach the prevention, detection, and treatment of periodontal diseases.`,
    category: "Periodontics",
    author_name: "Dr. James Thompson",
    status: "published"
  },
  {
    title: "AI-Driven Patient Education and Communication in Dentistry",
    slug: "ai-driven-patient-education-communication-dentistry",
    excerpt: "Explore how artificial intelligence is enhancing patient education and communication, leading to better treatment compliance and improved oral health outcomes.",
    content: `## Introduction

Artificial intelligence is revolutionizing patient education and communication in dentistry, creating more engaging, personalized, and effective ways to educate patients about their oral health and treatment options.

## AI-Powered Patient Education Tools

### Interactive Learning Platforms
Modern AI systems provide:
- Personalized learning paths
- Adaptive content delivery
- Interactive 3D visualizations
- Real-time feedback systems

### Virtual Reality and Augmented Reality
VR/AR applications offer:
- Immersive treatment simulations
- Virtual office tours
- Interactive anatomy lessons
- Treatment outcome previews

## Personalized Communication Systems

### Natural Language Processing
AI-powered communication tools can:
- Understand patient questions and concerns
- Provide accurate, personalized responses
- Adapt communication style to patient preferences
- Offer multilingual support

### Predictive Communication
Machine learning enables:
- Proactive patient outreach
- Personalized reminder systems
- Treatment progress updates
- Follow-up care scheduling

## Clinical Applications

### Treatment Planning Education
AI helps patients understand:
- Treatment options and alternatives
- Expected outcomes and timelines
- Potential risks and benefits
- Cost considerations

### Post-Treatment Care
AI systems provide:
- Personalized care instructions
- Recovery progress monitoring
- Complication detection
- Emergency guidance

## Benefits for Patients

### Improved Understanding
- 80% better comprehension of treatment plans
- Enhanced informed consent
- Reduced anxiety about procedures
- Better treatment compliance

### Enhanced Engagement
- Interactive learning experiences
- Personalized content delivery
- 24/7 access to information
- Continuous support availability

### Better Outcomes
- Improved oral hygiene compliance
- Reduced treatment complications
- Faster recovery times
- Better long-term results

## Benefits for Dental Practices

### Increased Efficiency
- Automated patient education
- Reduced staff time on explanations
- Streamlined communication
- Better resource utilization

### Improved Patient Satisfaction
- More engaging educational content
- Personalized communication
- Better treatment understanding
- Enhanced patient experience

### Better Practice Management
- Reduced no-shows
- Improved treatment acceptance rates
- Better patient retention
- Enhanced practice reputation

## Implementation Strategies

### Technology Integration
- Choose appropriate AI platforms
- Ensure seamless integration
- Train staff on new systems
- Monitor performance metrics

### Content Development
- Create engaging educational materials
- Develop personalized content templates
- Ensure accuracy and relevance
- Regular content updates

### Patient Adoption
- Introduce AI tools gradually
- Provide training and support
- Gather feedback and optimize
- Measure engagement metrics

## Future Developments

The future of AI in patient education includes:
- Voice-activated assistants
- Emotion recognition systems
- Predictive health coaching
- Integration with wearable devices

## Best Practices

### Content Quality
- Ensure medical accuracy
- Use clear, simple language
- Include visual aids
- Regular content updates

### Personalization
- Adapt to patient preferences
- Consider cultural factors
- Address specific concerns
- Provide relevant examples

### Accessibility
- Ensure universal design
- Provide multiple formats
- Support various devices
- Include translation options

AI-driven patient education is transforming how dental practices communicate with patients, leading to better understanding, improved compliance, and enhanced outcomes.`,
    category: "Patient Care",
    author_name: "Dr. Lisa Park",
    status: "published"
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Creating sample articles...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const results = [];
    let created = 0;
    let failed = 0;

    for (const article of sampleArticles) {
      try {
        // Check if article already exists
        const { data: existing } = await supabase
          .from('articles')
          .select('id')
          .eq('slug', article.slug)
          .single();

        if (existing) {
          console.log(`⚠️ Article "${article.title}" already exists, skipping`);
          results.push({ title: article.title, status: 'skipped', reason: 'already exists' });
          continue;
        }

        // Create the article
        const { data, error } = await supabase
          .from('articles')
          .insert([{
            ...article,
            published_date: new Date().toISOString(),
            author_avatar_url: null,
            image_url: null,
            seo_score: null,
            seo_details: null,
            source_references: []
          }])
          .select()
          .single();

        if (error) {
          console.error(`❌ Error creating article "${article.title}":`, error);
          failed++;
          results.push({ title: article.title, status: 'failed', error: error.message });
        } else {
          console.log(`✅ Created article: "${article.title}" (ID: ${data.id})`);
          created++;
          results.push({ title: article.title, status: 'created', id: data.id });
        }

      } catch (error) {
        console.error(`❌ Error processing article "${article.title}":`, error);
        failed++;
        results.push({ title: article.title, status: 'failed', error: error.message });
      }
    }

    console.log(`🎉 Sample articles creation completed: ${created} created, ${failed} failed`);

    return new Response(JSON.stringify({
      success: true,
      message: `Created ${created} sample articles, ${failed} failed`,
      created,
      failed,
      total: sampleArticles.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in create-sample-articles:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 