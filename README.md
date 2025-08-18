# Micro-Break Coach Chrome Extension

A friendly Chrome extension that reminds you to take healthy micro-breaks with simple exercises and activities.

## Features

### 🧘‍♂️ Smart Break Reminders
- Configurable reminder intervals (15, 30, 45, or 60 minutes)
- Gentle notifications with friendly messages
- Snooze functionality for flexible timing

### 💪 Exercise Categories
- **Stretching**: Neck rolls, shoulder shrugs, wrist stretches, back arches
- **Eye Care**: 20-20-20 rule, eye circles, palm press, blinking exercises  
- **Breathing**: Deep breathing, box breathing, relaxation exercises

### 🎯 Interactive Features
- Animated exercise demonstrations in popup
- Built-in timer for guided breaks
- Simple "Take Break" workflow

### ⚡ Customization Options
- Choose which exercise categories to include
- Enable/disable sound notifications
- Toggle vibration (where supported)
- Pause reminders temporarily

### 📊 Progress Tracking
- Daily break streak counter
- Total breaks taken
- Days active tracking
- Statistics reset option

### 🎨 Clean Design
- Minimal, motivating interface
- Soft colors and rounded elements
- Smooth animations and transitions
- Emoji integration for friendliness

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. Add icon files to the `/icons/` directory (see icons/README.md)

### Icon Requirements
You'll need to add these icon files to the `/icons/` directory:
- `icon16.png` (16×16 pixels)
- `icon32.png` (32×32 pixels)  
- `icon48.png` (48×48 pixels)
- `icon128.png` (128×128 pixels)

## File Structure

```
MicroBreakCoach/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for alarms & notifications
├── popup.html             # Main popup interface
├── popup.css              # Popup styling
├── popup.js               # Popup functionality
├── options.html           # Settings page
├── options.css            # Settings page styling
├── options.js             # Settings functionality
├── icons/                 # Icon files directory
│   └── README.md          # Icon requirements
└── README.md              # This file
```

## Technical Details

### Manifest V3 Features
- Service worker background script
- Chrome storage sync for cross-device settings
- Alarms API for reliable timing
- Notifications API for break reminders

### Browser Permissions
- `alarms`: Schedule break reminders
- `notifications`: Show break notifications
- `storage`: Save user preferences
- `activeTab`: Minimal required access

### Storage Structure
Settings are stored using `chrome.storage.sync`:
```javascript
{
  interval: 30,                    // Minutes between reminders
  soundEnabled: true,              // Play notification sounds
  vibrationEnabled: false,         // Vibrate on notification
  categories: ['stretching', ...], // Enabled exercise types
  streakCount: 0,                  // Daily break count
  lastBreakDate: null,             // Last break date
  isEnabled: true,                 // Extension enabled/disabled
  totalBreaks: 0,                  // Lifetime break count
  bestStreak: 0,                   // Best daily streak
  daysActive: 0                    // Days since install
}
```

### Exercise Data
Exercises are organized by category with timing and descriptions:
```javascript
{
  stretching: [
    { 
      name: "Neck Roll", 
      description: "Slowly roll your neck in a circle", 
      duration: 10, 
      emoji: "🦴" 
    },
    // ...
  ],
  // eyecare, breathing categories...
}
```

## Usage

### Quick Start
1. Install the extension
2. Click the extension icon to open the popup
3. Click "Get Exercise" for your first break
4. Follow the timer and complete the exercise
5. Click "Complete Break" to track your progress

### Customization
1. Click "Settings" in the popup
2. Adjust reminder interval
3. Choose exercise categories
4. Configure notifications
5. Click "Save Settings"

### Break Workflow
1. Notification appears at scheduled time
2. Click notification or extension icon
3. Get a random exercise from your chosen categories
4. Start the guided timer
5. Complete the exercise
6. Track your daily streak

## Development

### Adding New Exercises
Edit the `exercises` object in both `background.js` and `popup.js`:

```javascript
exerciseCategory: [
  {
    name: "Exercise Name",
    description: "Brief instruction",
    duration: 15,  // seconds
    emoji: "🎯"
  }
]
```

### Modifying Intervals
Update the interval options in `options.html` and ensure the values match in the JavaScript files.

### Styling Changes
- `popup.css`: Main popup appearance
- `options.css`: Settings page appearance
- Both use CSS Grid and Flexbox for responsive layouts

## Browser Compatibility

- Chrome 88+ (Manifest V3 support)
- Edge 88+ (Chromium-based)
- Other Chromium browsers with MV3 support

## Privacy

- All data stored locally using Chrome storage
- No external servers or data transmission
- Settings sync across devices via Chrome sync (optional)

## License

MIT License - Feel free to modify and distribute

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues or suggestions:
1. Check existing functionality in popup and options
2. Verify icon files are present and properly sized
3. Test with Developer Tools console for errors
4. Review Chrome extension permissions

---

Made with ❤️ for your wellbeing and productivity!
