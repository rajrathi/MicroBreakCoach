// Options page script for Micro-Break Coach
class OptionsController {
  constructor() {
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
      daysActive: 0,
      installDate: new Date().toDateString()
    };
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.updateUI();
    this.updateStats();
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(this.defaultSettings, (settings) => {
        this.settings = settings;
        resolve();
      });
    });
  }

  async saveSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.set(this.settings, () => {
        resolve();
      });
    });
  }

  setupEventListeners() {
    // Interval selection
    document.querySelectorAll('input[name="interval"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.settings.interval = parseInt(e.target.value);
        }
      });
    });

    // Category selection
    document.querySelectorAll('input[name="categories"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateCategories();
      });
    });

    // Sound toggle
    document.getElementById('soundEnabled').addEventListener('change', (e) => {
      this.settings.soundEnabled = e.target.checked;
    });

    // Vibration toggle
    document.getElementById('vibrationEnabled').addEventListener('change', (e) => {
      this.settings.vibrationEnabled = e.target.checked;
    });

    // Action buttons
    document.getElementById('testNotificationBtn').addEventListener('click', () => {
      this.testNotification();
    });

    document.getElementById('pauseRemindersBtn').addEventListener('click', () => {
      this.pauseReminders();
    });

    document.getElementById('takeBreakNowBtn').addEventListener('click', () => {
      this.takeBreakNow();
    });

    document.getElementById('resetStatsBtn').addEventListener('click', () => {
      this.resetStats();
    });

    // Save button
    document.getElementById('saveBtn').addEventListener('click', () => {
      this.saveSettingsWithFeedback();
    });
  }

  updateCategories() {
    const checkedCategories = [];
    document.querySelectorAll('input[name="categories"]:checked').forEach(checkbox => {
      checkedCategories.push(checkbox.value);
    });
    this.settings.categories = checkedCategories;
  }

  updateUI() {
    // Set interval radio button
    document.querySelector(`input[name="interval"][value="${this.settings.interval}"]`).checked = true;

    // Set category checkboxes
    this.settings.categories.forEach(category => {
      const checkbox = document.querySelector(`input[name="categories"][value="${category}"]`);
      if (checkbox) {
        checkbox.checked = true;
      }
    });

    // Set toggles
    document.getElementById('soundEnabled').checked = this.settings.soundEnabled;
    document.getElementById('vibrationEnabled').checked = this.settings.vibrationEnabled;
  }

  updateStats() {
    // Calculate days active
    const installDate = new Date(this.settings.installDate || new Date().toDateString());
    const today = new Date();
    const daysDiff = Math.max(1, Math.floor((today - installDate) / (1000 * 60 * 60 * 24)) + 1);
    
    // Update display with current values
    const todayBreaks = this.getTodayBreaks();
    const totalBreaks = this.settings.totalBreaks || 0;
    const bestStreak = this.settings.bestStreak || 0;
    
    document.getElementById('todayBreaks').textContent = todayBreaks.toString();
    document.getElementById('totalBreaks').textContent = totalBreaks.toString();
    document.getElementById('bestStreak').textContent = bestStreak.toString();
    document.getElementById('daysActive').textContent = daysDiff.toString();
    
    console.log('Stats updated:', { todayBreaks, totalBreaks, bestStreak, daysDiff });
  }

  getTodayBreaks() {
    const today = new Date().toDateString();
    if (this.settings.lastBreakDate === today) {
      return this.settings.streakCount || 0;
    }
    return 0; // Different day, so today's count is 0
  }

  async testNotification() {
    const button = document.getElementById('testNotificationBtn');
    const originalText = button.textContent;
    
    button.textContent = 'Sending...';
    button.disabled = true;
    
    try {
      // Send message to background script to show test notification
      chrome.runtime.sendMessage({ action: 'testNotification' });
      
      button.textContent = 'Sent! ✓';
      button.classList.add('pulse');
      
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
        button.classList.remove('pulse');
      }, 2000);
    } catch (error) {
      button.textContent = 'Error';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
    }
  }

  async pauseReminders() {
    const button = document.getElementById('pauseRemindersBtn');
    const originalText = button.textContent;
    
    button.textContent = 'Pausing...';
    button.disabled = true;
    
    try {
      // Send message to background script
      chrome.runtime.sendMessage({ action: 'pauseReminders', duration: 60 });
      
      button.textContent = 'Paused for 1h ✓';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
    } catch (error) {
      button.textContent = 'Error';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
    }
  }

  async takeBreakNow() {
    const button = document.getElementById('takeBreakNowBtn');
    const originalText = button.textContent;
    
    button.textContent = 'Starting...';
    button.disabled = true;
    
    try {
      // Send message to background script
      chrome.runtime.sendMessage({ action: 'takeBreakNow' });
      
      button.textContent = 'Break started! ✓';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
    } catch (error) {
      button.textContent = 'Error';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
    }
  }

  async resetStats() {
    if (!confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
      return;
    }
    
    const button = document.getElementById('resetStatsBtn');
    const originalText = button.textContent;
    
    button.textContent = 'Resetting...';
    button.disabled = true;
    
    // Reset stats in settings object
    this.settings.streakCount = 0;
    this.settings.totalBreaks = 0;
    this.settings.bestStreak = 0;
    this.settings.lastBreakDate = null;
    this.settings.installDate = new Date().toDateString();
    
    try {
      // Save the reset settings
      await this.saveSettings();
      
      // Update the display immediately with reset values
      document.getElementById('todayBreaks').textContent = '0';
      document.getElementById('totalBreaks').textContent = '0';
      document.getElementById('bestStreak').textContent = '0';
      document.getElementById('daysActive').textContent = '1';
      
      // Also update the full stats display
      this.updateStats();
      
      button.textContent = 'Reset ✓';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
      
    } catch (error) {
      console.error('Error resetting stats:', error);
      button.textContent = 'Error';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
    }
  }

  async saveSettingsWithFeedback() {
    const button = document.getElementById('saveBtn');
    const statusElement = document.getElementById('saveStatus');
    const originalText = button.textContent;
    
    button.textContent = 'Saving...';
    button.disabled = true;
    
    try {
      await this.saveSettings();
      
      // Send message to background script to update alarms
      chrome.runtime.sendMessage({ 
        action: 'updateSettings', 
        settings: this.settings 
      });
      
      button.textContent = 'Saved ✓';
      statusElement.textContent = 'Settings saved successfully!';
      statusElement.className = 'save-status success fade-in';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
        statusElement.textContent = '';
        statusElement.className = 'save-status';
      }, 3000);
      
    } catch (error) {
      button.textContent = 'Error';
      statusElement.textContent = 'Failed to save settings. Please try again.';
      statusElement.className = 'save-status error fade-in';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
        statusElement.textContent = '';
        statusElement.className = 'save-status';
      }, 3000);
    }
  }

  // Auto-save when settings change
  async autoSave() {
    await this.saveSettings();
    
    // Send message to background script
    chrome.runtime.sendMessage({ 
      action: 'updateSettings', 
      settings: this.settings 
    });
  }
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OptionsController();
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'settingsUpdated') {
    // Reload settings if updated from another source
    location.reload();
  }
});

// Auto-save on visibility change (when user navigates away)
document.addEventListener('visibilitychange', () => {
  if (document.hidden && window.optionsController) {
    window.optionsController.autoSave();
  }
});
