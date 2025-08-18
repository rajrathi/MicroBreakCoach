// Background service worker for Micro-Break Coach
class MicroBreakCoach {
  constructor() {
    this.exercises = {
      stretching: [
        { name: "Neck Roll", description: "Slowly roll your neck in a circle", duration: 10, emoji: "🦴" },
        { name: "Shoulder Shrug", description: "Lift and drop your shoulders", duration: 10, emoji: "💪" },
        { name: "Wrist Stretch", description: "Extend arm, pull hand back gently", duration: 15, emoji: "🤲" },
        { name: "Back Arch", description: "Arch your back gently while seated", duration: 10, emoji: "🏹" }
      ],
      eyecare: [
        { name: "20-20-20 Rule", description: "Look at something 20ft away for 20 seconds", duration: 20, emoji: "👀" },
        { name: "Eye Circles", description: "Move eyes in slow circles", duration: 15, emoji: "🔄" },
        { name: "Palm Press", description: "Cover eyes with palms for dark rest", duration: 15, emoji: "🙈" },
        { name: "Blink Exercise", description: "Rapid blinking for 10 seconds", duration: 10, emoji: "😊" }
      ],
      breathing: [
        { name: "Deep Breathing", description: "Breathe in for 4, hold for 4, out for 4", duration: 20, emoji: "🫁" },
        { name: "Box Breathing", description: "4-4-4-4 breathing pattern", duration: 30, emoji: "📦" },
        { name: "Relaxing Exhale", description: "Long slow exhales to relax", duration: 15, emoji: "😌" },
        { name: "Energy Breath", description: "Quick energizing breaths", duration: 10, emoji: "⚡" }
      ]
    };
    
    this.defaultSettings = {
      interval: 30,
      soundEnabled: true,
      vibrationEnabled: false,
      categories: ['stretching', 'eyecare', 'breathing'],
      streakCount: 0,
      lastBreakDate: null,
      isEnabled: true
    };
    
    this.init();
  }

  async init() {
    // Set up alarm when extension starts
    await this.setupAlarm();
    
    // Initialize settings if not exists
    const settings = await this.getSettings();
    if (!settings.interval) {
      await this.saveSettings(this.defaultSettings);
    }
  }

  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(this.defaultSettings, (result) => {
        resolve(result);
      });
    });
  }

  async saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(settings, () => {
        resolve();
      });
    });
  }

  async setupAlarm() {
    const settings = await this.getSettings();
    
    // Clear existing alarm
    chrome.alarms.clear('microBreakReminder');
    
    if (settings.isEnabled) {
      // Create new alarm
      chrome.alarms.create('microBreakReminder', {
        delayInMinutes: settings.interval,
        periodInMinutes: settings.interval
      });
    }
  }

  getRandomExercise(categories) {
    const availableExercises = [];
    
    categories.forEach(category => {
      if (this.exercises[category]) {
        availableExercises.push(...this.exercises[category]);
      }
    });
    
    if (availableExercises.length === 0) {
      return this.exercises.stretching[0]; // fallback
    }
    
    return availableExercises[Math.floor(Math.random() * availableExercises.length)];
  }

  async showBreakNotification() {
    const settings = await this.getSettings();
    const exercise = this.getRandomExercise(settings.categories);
    
    const options = {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: `Time for a break! ${exercise.emoji}`,
      message: `${exercise.name}: ${exercise.description}`,
      priority: 2,
      requireInteraction: true,
      buttons: [
        { title: 'Take Break' },
        { title: 'Snooze 5 min' }
      ]
    };
    
    chrome.notifications.create('microBreakNotification', options);
    
    // Play sound if enabled
    if (settings.soundEnabled) {
      // Note: Chrome extensions can't play audio in background
      // Sound will be handled in popup when opened
    }
  }

  async incrementStreak() {
    const settings = await this.getSettings();
    const today = new Date().toDateString();
    
    if (settings.lastBreakDate !== today) {
      // First break of the day
      settings.streakCount = 1;
    } else {
      settings.streakCount += 1;
    }
    
    settings.lastBreakDate = today;
    await this.saveSettings(settings);
  }

  async snoozeBreak() {
    chrome.alarms.clear('microBreakReminder');
    chrome.alarms.create('microBreakReminder', {
      delayInMinutes: 5
    });
  }
}

// Initialize the extension
const microBreakCoach = new MicroBreakCoach();

// Handle alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'microBreakReminder') {
    microBreakCoach.showBreakNotification();
  }
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (notificationId === 'microBreakNotification') {
    if (buttonIndex === 0) {
      // Take Break button clicked
      await microBreakCoach.incrementStreak();
      chrome.notifications.clear(notificationId);
      
      // Open popup for exercise
      chrome.action.openPopup();
    } else if (buttonIndex === 1) {
      // Snooze button clicked
      await microBreakCoach.snoozeBreak();
      chrome.notifications.clear(notificationId);
    }
  }
});

// Handle notification clicks
chrome.notifications.onClicked.addListener(async (notificationId) => {
  if (notificationId === 'microBreakNotification') {
    await microBreakCoach.incrementStreak();
    chrome.notifications.clear(notificationId);
    chrome.action.openPopup();
  }
});

// Handle storage changes (when settings are updated)
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.interval) {
    microBreakCoach.setupAlarm();
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  microBreakCoach.setupAlarm();
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  microBreakCoach.init();
});

// Handle messages from popup and options
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  switch (message.action) {
    case 'testNotification':
      await microBreakCoach.showBreakNotification();
      break;
      
    case 'snooze':
      await microBreakCoach.snoozeBreak();
      break;
      
    case 'toggleReminders':
      const settings = await microBreakCoach.getSettings();
      settings.isEnabled = message.enabled;
      await microBreakCoach.saveSettings(settings);
      await microBreakCoach.setupAlarm();
      break;
      
    case 'updateSettings':
      await microBreakCoach.saveSettings(message.settings);
      await microBreakCoach.setupAlarm();
      break;
      
    case 'pauseReminders':
      chrome.alarms.clear('microBreakReminder');
      chrome.alarms.create('microBreakReminder', {
        delayInMinutes: message.duration
      });
      break;
      
    case 'takeBreakNow':
      await microBreakCoach.showBreakNotification();
      break;
  }
  
  sendResponse({ success: true });
});
