# 🧠 TherapifyMe

> **AI-Powered Mental Wellness Companion**  
> Your personal journey to emotional well-being through voice-based check-ins, AI analysis, and personalized video therapy sessions.

[![Built with Bolt.new](https://img.shields.io/badge/Built%20with-Bolt.new-blue?style=for-the-badge)](https://bolt.new)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Latest-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tavus](https://img.shields.io/badge/Tavus-Video%20AI-FF6B6B?style=for-the-badge)](https://tavus.io/)

---

## 🌟 **Project Overview**

TherapifyMe is a cutting-edge mental wellness application that combines voice technology, artificial intelligence, and personalized video therapy to provide users with a comprehensive emotional support system. Built as a modern web application, it offers an innovative approach to mental health care through technology.

### 🎯 **Core Mission**

Democratize access to mental health support by providing personalized, AI-driven therapeutic experiences that adapt to each user's unique emotional journey.

---

## ✨ **Key Features**

### 🎤 **Voice-Based Check-ins**

- **Interactive Orb Interface**: Large, dynamic orb that changes color and size based on recording state
- **Real-time Voice Transcription**: Automatic speech-to-text conversion
- **Editable Transcriptions**: Users can review and edit their transcribed thoughts
- **Mood Selection**: Comprehensive mood tracking with 10 emotional states

### 🤖 **AI-Powered Analysis**

- **Intelligent Response Generation**: Personalized therapeutic insights based on user input
- **Crisis Detection**: Real-time monitoring for concerning content with safety interventions
- **Mood Pattern Analysis**: Advanced analytics to track emotional trends over time
- **Contextual Understanding**: AI that learns from user preferences and history

### 🎬 **Personalized Video Therapy**

- **Tavus AI Integration**: Professional video responses featuring "Linda" persona
- **Individual Check-in Videos**: Immediate video responses after each session
- **Weekly Therapy Sessions**: Comprehensive video summaries with insights and exercises
- **Custom Therapeutic Scripts**: Personalized content based on user's emotional state

### 📊 **Advanced Analytics Dashboard**

- **Real-time Mood Trends**: 7-day mood visualization with intensity tracking
- **Streak Tracking**: Gamified consistency encouragement
- **Progress Insights**: Detailed analytics on emotional patterns
- **Performance Optimization**: 3-5x faster loading with intelligent caching

### 🔒 **Enterprise-Grade Security**

- **Crisis Prevention System**: Automatic detection of concerning keywords
- **Emergency Intervention**: Progressive safety responses (severity 1-10 scale)
- **Data Encryption**: End-to-end security for sensitive mental health data
- **Privacy Compliance**: HIPAA-ready security protocols

### 📱 **Modern User Experience**

- **Unified Dark Theme**: Consistent, calming interface design
- **Responsive Design**: Seamless experience across all devices
- **Offline Support**: Basic functionality available without internet
- **Progressive Web App**: App-like experience in the browser

---

## 🛠 **Technology Stack**

### **Frontend**

- **React 18.2.0** - Modern UI library with hooks and concurrent features
- **TypeScript** - Type-safe development for better code quality
- **Vite** - Lightning-fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **Lucide React** - Beautiful, customizable icon library

### **Backend & Database**

- **Supabase** - Complete backend-as-a-service platform
- **PostgreSQL 15.8.1** - Robust relational database with advanced features
- **Row Level Security (RLS)** - Database-level security policies
- **Real-time Subscriptions** - Live data updates across the application

### **AI & Media Services**

- **Tavus API** - AI-powered personalized video generation
- **ElevenLabs** - High-quality text-to-speech synthesis
- **OpenAI Whisper** - Advanced speech recognition and transcription
- **Custom AI Response Engine** - Therapeutic content generation

### **Development & Deployment**

- **Bolt.new** - Rapid prototyping and development platform
- **Git** - Version control and collaboration
- **npm** - Package management and scripts
- **ESLint & Prettier** - Code quality and formatting tools

---

## 📁 **Project Structure**

```
TherapifyMe/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Base UI components
│   │   ├── Orb.tsx        # Interactive recording orb
│   │   └── WeeklyVideoPlayer.tsx
│   ├── contexts/          # React context providers
│   │   └── AuthContext.tsx
│   ├── lib/               # Core utilities and configs
│   │   └── supabase.ts
│   ├── pages/             # Application pages
│   │   ├── Dashboard.tsx  # Main interactive dashboard
│   │   ├── JournalPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── AuthPage.tsx
│   ├── services/          # External service integrations
│   │   ├── tavusService.ts
│   │   ├── analyticsService.ts
│   │   ├── crisisDetectionService.ts
│   │   └── transcriptionService.ts
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Helper functions and utilities
│   └── App.tsx           # Main application component
├── supabase/
│   └── migrations/        # Database schema migrations
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 **Installation & Setup**

### **Prerequisites**

- Node.js 18+
- npm or yarn
- Supabase account
- Tavus API account
- ElevenLabs API account (optional)

### **1. Clone the Repository**

```bash
git clone https://github.com/your-username/therapifyme.git
cd therapifyme
```

### **2. Install Dependencies**

```bash
npm install
```

### **3. Environment Configuration**

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Tavus AI Video Generation
VITE_TAVUS_API_KEY=your_tavus_api_key

# ElevenLabs Text-to-Speech (Optional)
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key

# OpenAI (Optional - for enhanced transcription)
VITE_OPENAI_API_KEY=your_openai_api_key
```

### **4. Database Setup**

```bash
# Run Supabase migrations
npx supabase db reset
```

### **5. Start Development Server**

```bash
npm run dev
```

Visit `http://localhost:5173` to see the application running.

### **6. Build for Production**

```bash
npm run build
```

---

## 📊 **Database Schema**

### **Core Tables**

- **`users`** - User profiles and preferences
- **`entries`** - Voice check-in sessions with transcriptions
- **`tavus_videos`** - Generated video therapy sessions

### **Analytics & Safety Tables**

- **`user_sessions`** - Daily analytics and mood trend caching
- **`user_goals`** - Goal tracking and achievement system
- **`entry_tags`** - Advanced tagging and categorization
- **`ai_feedback`** - AI response quality tracking
- **`crisis_resources`** - Crisis prevention and safety resources
- **`crisis_flags`** - Automatic crisis detection and flagging

---

## 🎨 **Key Features Implementation**

### **Interactive Orb Workflow**

1. **Idle State** (Blue) - Tap to start recording
2. **Recording State** (Red) - Grows larger, tap again to stop
3. **Processing State** (Yellow) - Transcribing audio
4. **Reviewing State** (Cyan) - Edit transcription, select mood
5. **Generating State** (Green) - Creating AI analysis and video
6. **Complete State** (Purple) - Show results and video response

### **Crisis Detection System**

- Real-time keyword monitoring during transcription
- Severity scoring (1-10) based on concerning content
- Automatic resource assignment (988 hotline, Crisis Text Line)
- Progressive intervention based on risk level

### **Performance Optimizations**

- Intelligent 5-minute analytics caching
- Pre-calculated mood trends for faster dashboard loading
- Parallel data fetching for optimal performance
- Database indexing on critical query paths

---

## 🔐 **Security & Privacy**

### **Data Protection**

- Input sanitization and XSS protection
- Password strength validation with visual feedback
- Encrypted storage of sensitive user data
- Secure API communication with proper authentication

### **Mental Health Safety**

- Crisis keyword detection in real-time
- Emergency intervention protocols
- Licensed mental health resource integration
- User privacy protection with anonymous analytics

### **Compliance**

- HIPAA-ready security protocols
- GDPR compliance for data handling
- Secure session management
- Regular security audits and updates

---

## 🤝 **Contributing**

We welcome contributions from the community! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### **Development Guidelines**

- Follow TypeScript best practices
- Write comprehensive tests for new features
- Maintain consistent code formatting with Prettier
- Document new features and API changes

---

## 👥 **Project Team**

### **Core Development Team**

- **Daniel Samuel** - Lead Developer & Architecture
- **Godswill Igbava** - Full-Stack Developer
- **Emmanuel Atom** - UI/UX Designer
- **Ojochide** - Project Manager
- **Gloria** - UI/UX Designer

### **Special Recognition**

Built with ❤️ using **Bolt.new** - enabling rapid prototyping and development of complex applications with AI assistance.

---

## 📈 **Roadmap**

### **Upcoming Features**

- [ ] Mobile app versions (iOS/Android)
- [ ] Integration with wearable devices
- [ ] Advanced AI mood prediction
- [ ] Group therapy sessions
- [ ] Therapist dashboard for professionals
- [ ] Multi-language support
- [ ] Voice emotion recognition
- [ ] Habit tracking integration

### **Technical Improvements**

- [ ] Enhanced offline capabilities
- [ ] Real-time collaboration features
- [ ] Advanced analytics dashboard
- [ ] Performance monitoring
- [ ] Automated testing suite
- [ ] CI/CD pipeline setup

---

## 📞 **Support & Resources**

### **Crisis Resources**

- **National Suicide Prevention Lifeline**: 988
- **Crisis Text Line**: Text HOME to 741741
- **International Association for Suicide Prevention**: [iasp.info](https://iasp.info)

### **Technical Support**

- Create an issue in this repository
- Contact the development team
- Check our documentation wiki

### **Mental Health Disclaimer**

TherapifyMe is a wellness companion and not a replacement for professional mental health treatment. If you're experiencing a mental health crisis, please contact emergency services or a mental health professional immediately.

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **Bolt.new** for enabling rapid development
- **Supabase** for providing an excellent backend platform
- **Tavus** for revolutionary AI video technology
- **Mental health professionals** who provided guidance on therapeutic approaches
- **Open source community** for the amazing tools and libraries

---

<div align="center">

**Built with 💙 for mental wellness**

[Website](https://therapifyme.app) • [Documentation](https://docs.therapifyme.app) • [Support](mailto:support@therapifyme.app)

</div>
