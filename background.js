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
      isEnabled: true,
      totalBreaks: 0,
      bestStreak: 0,
      dailyStreak: 0
    };
    
    this.init();
  }

  async init() {
    console.log('MicroBreakCoach: Initializing...');
    
    // Initialize settings if not exists
    const settings = await this.getSettings();
    console.log('MicroBreakCoach: Current settings:', settings);
    
    if (settings.interval === undefined) {
      console.log('MicroBreakCoach: No settings found, creating defaults');
      await this.saveSettings(this.defaultSettings);
    }
    
    // Set up alarm when extension starts
    await this.setupAlarm();
    console.log('MicroBreakCoach: Initialization complete');
  }

  async clearAllStats() {
    console.log('MicroBreakCoach: Clearing all statistics...');
    
    // Get current settings
    const settings = await this.getSettings();
    
    // Reset only the stats, keep user preferences
    const resetSettings = {
      ...settings,
      streakCount: 0,
      totalBreaks: 0,
      bestStreak: 0,
      dailyStreak: 0,
      lastBreakDate: null,
      installDate: new Date().toDateString(),
      weeklyBreaks: 0,
      monthlyBreaks: 0,
      longestStreakDate: null
    };
    
    await this.saveSettings(resetSettings);
    console.log('MicroBreakCoach: All statistics cleared');
    
    return resetSettings;
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
    console.log('MicroBreakCoach: Setting up alarm with settings:', settings);
    
    // Clear existing alarm
    await chrome.alarms.clear('microBreakReminder');
    console.log('MicroBreakCoach: Cleared existing alarms');
    
    if (settings.isEnabled) {
      // Create new alarm
      const alarmInfo = {
        delayInMinutes: settings.interval,
        periodInMinutes: settings.interval
      };
      
      await chrome.alarms.create('microBreakReminder', alarmInfo);
      console.log('MicroBreakCoach: Created new alarm:', alarmInfo);
      
      // Verify alarm was created
      const alarms = await chrome.alarms.getAll();
      console.log('MicroBreakCoach: All alarms:', alarms);
    } else {
      console.log('MicroBreakCoach: Reminders disabled, no alarm created');
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
    console.log('MicroBreakCoach: Showing break notification');
    const settings = await this.getSettings();
    const exercise = this.getRandomExercise(settings.categories);
    
    const options = {
      type: 'basic',
      iconUrl: '/icons/icon128.png', // Use relative path
      title: `Time for a break! ${exercise.emoji}`,
      message: `${exercise.name}: ${exercise.description}`,
      priority: 2,
      requireInteraction: true,
      buttons: [
        { title: 'Take Break' },
        { title: 'Snooze 5 min' }
      ]
    };
    
    try {
      await chrome.notifications.create('microBreakNotification', options);
      console.log('MicroBreakCoach: Notification created successfully');
    } catch (error) {
      console.error('MicroBreakCoach: Error creating notification:', error);
      
      // Fallback: try without icon
      const fallbackOptions = {
        type: 'basic',
        title: `Time for a break! ${exercise.emoji}`,
        message: `${exercise.name}: ${exercise.description}`,
        priority: 2,
        requireInteraction: true,
        buttons: [
          { title: 'Take Break' },
          { title: 'Snooze 5 min' }
        ]
      };
      
      try {
        await chrome.notifications.create('microBreakNotification', fallbackOptions);
        console.log('MicroBreakCoach: Fallback notification created');
      } catch (fallbackError) {
        console.error('MicroBreakCoach: Fallback notification failed:', fallbackError);
      }
    }
  }

  async showTestNotification() {
    console.log('MicroBreakCoach: Showing TEST notification');
    const settings = await this.getSettings();
    const exercise = this.getRandomExercise(settings.categories);
    
    const options = {
      type: 'basic',
      iconUrl: '/icons/icon128.png',
      title: `🧪 TEST: ${exercise.emoji} ${exercise.name}`,
      message: `This is a test notification. ${exercise.description}`,
      priority: 1,
      requireInteraction: false,
      buttons: [
        { title: 'Test Complete' }
      ]
    };
    
    try {
      await chrome.notifications.create('microBreakTestNotification', options);
      console.log('MicroBreakCoach: Test notification created successfully');
    } catch (error) {
      console.error('MicroBreakCoach: Error creating test notification:', error);
      
      // Fallback: try without icon
      const fallbackOptions = {
        type: 'basic',
        title: `🧪 TEST: ${exercise.emoji} ${exercise.name}`,
        message: `This is a test notification. ${exercise.description}`,
        priority: 1,
        requireInteraction: false
      };
      
      try {
        await chrome.notifications.create('microBreakTestNotification', fallbackOptions);
        console.log('MicroBreakCoach: Test fallback notification created');
      } catch (fallbackError) {
        console.error('MicroBreakCoach: Test fallback notification failed:', fallbackError);
      }
    }
  }

  async incrementStreak() {
    const settings = await this.getSettings();
    const today = new Date().toDateString();
    
    if (settings.lastBreakDate !== today) {
      // First break of the day - reset daily count
      settings.streakCount = 1;
      // Update best streak if current was better
      if (settings.dailyStreak && settings.dailyStreak > (settings.bestStreak || 0)) {
        settings.bestStreak = settings.dailyStreak;
      }
      settings.dailyStreak = 1;
    } else {
      // Same day - increment both counters
      settings.streakCount += 1;
      settings.dailyStreak = (settings.dailyStreak || 0) + 1;
    }
    
    // Always increment total breaks
    settings.totalBreaks = (settings.totalBreaks || 0) + 1;
    settings.lastBreakDate = today;
    
    console.log('MicroBreakCoach: Updated streak:', {
      today: settings.streakCount,
      total: settings.totalBreaks,
      daily: settings.dailyStreak,
      best: settings.bestStreak
    });
    
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
  console.log('MicroBreakCoach: Alarm triggered:', alarm.name);
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
      
      // Try to open popup and show exercise
      try {
        // Always try to send the message first (in case popup is already open)
        chrome.runtime.sendMessage({ action: 'showExercise' }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('Message failed, popup might not be open:', chrome.runtime.lastError.message);
          } else {
            console.log('Exercise message sent successfully:', response);
          }
        });
        
        // Also try to open popup (will fail silently if already open)
        await chrome.action.openPopup();
        
        // Send message again after a short delay to ensure popup is ready
        setTimeout(() => {
          chrome.runtime.sendMessage({ action: 'showExercise' }, (response) => {
            if (chrome.runtime.lastError) {
              console.log('Delayed message failed:', chrome.runtime.lastError.message);
            } else {
              console.log('Delayed exercise message sent:', response);
            }
          });
        }, 150);
        
      } catch (error) {
        console.log('Could not open popup, but message should still work if popup is open');
      }
    } else if (buttonIndex === 1) {
      // Snooze button clicked
      await microBreakCoach.snoozeBreak();
      chrome.notifications.clear(notificationId);
    }
  } else if (notificationId === 'microBreakTestNotification') {
    // Test notification - just clear it, don't increment counter
    console.log('MicroBreakCoach: Test notification button clicked');
    chrome.notifications.clear(notificationId);
  }
});

// Handle notification clicks
chrome.notifications.onClicked.addListener(async (notificationId) => {
  if (notificationId === 'microBreakNotification') {
    await microBreakCoach.incrementStreak();
    chrome.notifications.clear(notificationId);
    
    // Try to open popup and show exercise
    try {
      // Always try to send the message first (in case popup is already open)
      chrome.runtime.sendMessage({ action: 'showExercise' }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Message failed, popup might not be open:', chrome.runtime.lastError.message);
        } else {
          console.log('Exercise message sent successfully:', response);
        }
      });
      
      // Also try to open popup (will fail silently if already open)
      await chrome.action.openPopup();
      
      // Send message again after a short delay to ensure popup is ready
      setTimeout(() => {
        chrome.runtime.sendMessage({ action: 'showExercise' }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('Delayed message failed:', chrome.runtime.lastError.message);
          } else {
            console.log('Delayed exercise message sent:', response);
          }
        });
      }, 150);
      
    } catch (error) {
      console.log('Could not open popup, but message should still work if popup is open');
    }
  } else if (notificationId === 'microBreakTestNotification') {
    // Test notification - just clear it, don't increment counter
    console.log('MicroBreakCoach: Test notification clicked');
    chrome.notifications.clear(notificationId);
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
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Extension] onInstalled event triggered:', details.reason);
  
  // Clear stats when extension is reloaded (reason will be 'install' or 'update')
  if (details.reason === 'install' || details.reason === 'update') {
    console.log('[Extension] Clearing statistics on extension reload...');
    await microBreakCoach.clearAllStats();
  }
  
  microBreakCoach.init();
});

// Handle messages from popup and options
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  switch (message.action) {
    case 'testNotification':
      await microBreakCoach.showTestNotification();
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
      
    case 'resetAllStats':
      // Handle stats reset from options page
      console.log('MicroBreakCoach: Resetting all statistics');
      await microBreakCoach.saveSettings(message.settings);
      // Send message to popup if it's open to update display
      chrome.runtime.sendMessage({ action: 'statsReset' }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Popup not open or stats reset message failed');
        }
      });
      break;
  }
  
  sendResponse({ success: true });
});
