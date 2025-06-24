# Audio Files for TherapifyMe

## Ambient Music

To use a real lo-fi ambient track instead of the generated ambient sound:

1. Add a lo-fi ambient music file named `lofi-ambient.mp3` to this directory
2. The file should be:
   - Calming and therapeutic
   - Lo-fi or ambient style
   - Seamlessly loopable
   - 1-5 minutes duration
   - Low energy (not distracting)

## Recommended Sources for Free Lo-Fi Music

- **Freesound.org** - Search for "ambient" or "lofi" with CC0 license
- **YouTube Audio Library** - Ambient category
- **Pixabay Music** - Ambient/chill section
- **Free Music Archive** - Ambient tag

## Current Setup

The app will try to load `/audio/lofi-ambient.mp3` first. If that file doesn't exist, it will fallback to a generated ambient sound with:

- Very low bass tones (55Hz) for grounding
- Gentle mid tones (110Hz) for warmth  
- Soft high tones (165Hz) for presence
- Extremely subtle volume (8%) for non-intrusive background

The generated sound is designed to be therapeutic but if you add a real lo-fi track, it will be much more pleasant!
