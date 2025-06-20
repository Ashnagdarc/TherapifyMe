# Enhanced AI Setup Guide for TherapifyMe

## Overview

TherapifyMe now includes an advanced AI system that combines free and premium AI services to provide personalized therapy responses, voice interactions, and video content.

## Required API Keys

### 1. Hugging Face (Free AI Text Generation) 🤖

- **Purpose**: Generates dynamic, personalized therapy responses
- **Cost**: FREE with rate limits
- **Get your key**: [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
- **Environment variable**: `VITE_HUGGINGFACE_API_KEY`

**Setup Steps:**

1. Create a free account at [huggingface.co](https://huggingface.co)
2. Go to Settings → Access Tokens
3. Create a new token with read permissions
4. Copy the token to your `.env` file

### 2. Tavus (AI Video Generation) 🎥

- **Purpose**: Creates weekly personalized therapy videos with AI avatar
- **Cost**: Paid service (check tavus.io for pricing)
- **Get your key**: [https://tavus.io](https://tavus.io)
- **Environment variable**: `VITE_TAVUS_API_KEY`

### 3. ElevenLabs (AI Voice Generation) 🔊

- **Purpose**: Converts AI responses to natural speech
- **Cost**: Free tier available, then paid
- **Get your key**: [https://elevenlabs.io](https://elevenlabs.io)
- **Environment variable**: `VITE_ELEVENLABS_API_KEY`

### 4. Assembly AI (Enhanced Transcription) 📝

- **Purpose**: Better voice-to-text transcription
- **Cost**: Free tier available
- **Get your key**: [https://www.assemblyai.com](https://www.assemblyai.com)
- **Environment variable**: `VITE_ASSEMBLYAI_API_KEY`
- **Note**: Optional - falls back to browser Web Speech API if not provided

## Environment File Setup

Create a `.env` file in your project root with the following structure:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# AI Services Configuration
VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key_here
VITE_TAVUS_API_KEY=your_tavus_api_key_here
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
VITE_ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
```

## AI System Features

### 🤖 Enhanced AI Response Generation

- **70% AI, 30% Templates**: Intelligent blend of dynamic AI and reliable templates
- **Confidence Scoring**: Automatically falls back to templates if AI confidence is low
- **Anti-Repetition**: Tracks response history to prevent repetitive responses
- **Therapeutic Validation**: Ensures all AI responses meet therapeutic standards

### 🎬 Video Response System

- AI analyzes your check-in text and mood
- Generates personalized video script
- Creates video with AI avatar using Tavus
- Delivers video response in your journal

### 🔊 Voice Interaction

- Record voice check-ins with enhanced transcription
- Receive spoken AI responses
- Multiple therapeutic voice options

### ⚙️ AI Settings Panel

- Configure AI usage percentage (0-100%)
- Adjust confidence threshold
- Run diagnostics to test all services
- Monitor API connection status

## Fallback System

The system is designed to work even without all API keys:

1. **No Hugging Face**: Uses enhanced template system
2. **No Tavus**: Skips video generation
3. **No ElevenLabs**: Uses text-only responses
4. **No Assembly AI**: Uses browser speech recognition

## Testing Your Setup

1. Start the development server: `npm run dev`
2. Go to Dashboard and click the purple "AI" button
3. Click "Run Tests" in the diagnostics section
4. Check which services are connected

## Cost Optimization

### Free Tier Strategy

- Use only Hugging Face (free) for text generation
- Skip Tavus and ElevenLabs for now
- This gives you 70% of the AI benefits at no cost

### Budget-Conscious Setup

1. Start with Hugging Face (free)
2. Add ElevenLabs free tier for voice
3. Add Tavus later for video features

## Troubleshooting

### Common Issues

1. **AI responses not generating**: Check Hugging Face API key
2. **No video creation**: Verify Tavus API key and credits
3. **No voice responses**: Check ElevenLabs API key and quota
4. **Transcription issues**: Verify Assembly AI key or check browser permissions

### Debug Mode

- Open browser developer tools
- Check console for AI service logs
- Look for "🤖 Attempting AI generation..." messages

## Model Information

### Hugging Face Models Used

- **Primary**: `microsoft/DialoGPT-large` - Conversational AI
- **Backup**: `facebook/blenderbot-400M-distill` - Alternative conversational model

### ElevenLabs Voices

- **Calm**: Sarah (therapeutic, soothing)
- **Motivational**: Rachel (energetic, inspiring)
- **Reflective**: Domi (thoughtful, gentle)

## Security Notes

- Never commit your `.env` file to version control
- Keep API keys private and secure
- Rotate keys regularly
- Monitor usage to prevent unexpected charges

## Support

If you need help setting up the AI system:

1. Check the AI diagnostics panel in the app
2. Review console logs for error messages
3. Verify API key format and permissions
4. Test with minimal setup (Hugging Face only) first
