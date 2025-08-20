// Popup script for Micro-Break Coach
class PopupController {
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

    this.currentExercise = null;
    this.timerInterval = null;
    this.countdownInterval = null;
    this.remainingTime = 0;
    this.breakStartedFromNotification = false; // Track if break came from notification
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.updateUI();
    this.startCountdownTimer();
    
    // Mark as initialized for external access
    this.initialized = true;
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get({
        interval: 30,
        soundEnabled: true,
        vibrationEnabled: false,
        categories: ['stretching', 'eyecare', 'breathing'],
        streakCount: 0,
        lastBreakDate: null,
        isEnabled: true,
        totalBreaks: 0,
        bestStreak: 0
      }, (settings) => {
        this.settings = settings;
        
        // Check if we need to reset daily counter for new day
        this.checkDailyReset();
        
        resolve();
      });
    });
  }

  checkDailyReset() {
    const today = new Date().toDateString();
    
    // If last break was on a different day, we need to handle the day transition
    if (this.settings.lastBreakDate && this.settings.lastBreakDate !== today) {
      console.log('New day detected, preparing for daily reset');
      // Don't reset here, just log. The actual reset happens when incrementStreak is called
      // This ensures the display shows 0 for today until a break is taken
    }
  }

  async saveSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.set(this.settings, () => {
        resolve();
      });
    });
  }

  setupEventListeners() {
    // Get Exercise button
    document.getElementById('getExerciseBtn').addEventListener('click', () => {
      this.getRandomExercise();
    });

    // Start Timer button
    document.getElementById('startTimerBtn').addEventListener('click', () => {
      this.startTimer();
    });

    // Complete Break button
    document.getElementById('completeBtn').addEventListener('click', () => {
      this.completeBreak();
    });

    // Snooze button
    document.getElementById('snoozeBtn').addEventListener('click', () => {
      this.snoozeBreak();
    });

    // Options button
    document.getElementById('optionsBtn').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    // Enable toggle
    document.getElementById('enableToggle').addEventListener('change', (e) => {
      this.toggleReminders(e.target.checked);
    });
  }

  getRandomExercise() {
    const availableExercises = [];
    
    this.settings.categories.forEach(category => {
      if (this.exercises[category]) {
        availableExercises.push(...this.exercises[category]);
      }
    });
    
    if (availableExercises.length === 0) {
      availableExercises.push(...this.exercises.stretching);
    }
    
    const exercise = availableExercises[Math.floor(Math.random() * availableExercises.length)];
    this.displayExercise(exercise);
    
    // Play sound if enabled
    if (this.settings.soundEnabled) {
      this.playNotificationSound();
    }
    
    // Mark that this break was manually started (not from notification)
    if (!this.breakStartedFromNotification) {
      console.log('Manual break started - will increment counter on completion');
    }
  }

  displayExercise(exercise) {
    this.currentExercise = exercise;
    
    document.getElementById('exerciseEmoji').textContent = exercise.emoji;
    document.getElementById('exerciseName').textContent = exercise.name;
    document.getElementById('exerciseDescription').textContent = exercise.description;
    
    // Update button visibility
    document.getElementById('getExerciseBtn').style.display = 'none';
    document.getElementById('startTimerBtn').style.display = 'block';
    document.getElementById('completeBtn').style.display = 'block';
    
    // Add animation
    const exerciseCard = document.querySelector('.exercise-card');
    exerciseCard.classList.remove('fade-in'); // Remove first to retrigger
    exerciseCard.classList.add('fade-in');
    
    // If this came from a notification, add a special indicator
    if (this.breakStartedFromNotification) {
      const exerciseName = document.getElementById('exerciseName');
      exerciseName.textContent = `🔔 ${exercise.name}`;
      console.log('Exercise displayed from notification');
    }
  }

  startTimer() {
    if (!this.currentExercise) return;
    
    this.remainingTime = this.currentExercise.duration;
    
    // Show timer
    document.getElementById('exerciseTimer').style.display = 'block';
    document.getElementById('startTimerBtn').style.display = 'none';
    
    // Update timer display
    this.updateTimerDisplay();
    
    // Start countdown
    this.timerInterval = setInterval(() => {
      this.remainingTime--;
      this.updateTimerDisplay();
      
      if (this.remainingTime <= 0) {
        this.timerFinished();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    document.getElementById('timerText').textContent = this.remainingTime;
    
    // Add pulse animation when time is low
    if (this.remainingTime <= 3) {
      document.querySelector('.timer-circle').classList.add('pulse');
    }
  }

  timerFinished() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
    
    // Celebration effect
    document.querySelector('.timer-circle').classList.remove('pulse');
    document.getElementById('timerText').textContent = '✓';
    
    // Auto-complete after 2 seconds
    setTimeout(() => {
      this.completeBreak();
    }, 2000);
  }

  async completeBreak() {
    // Only increment counter if this was a manual break (not from notification)
    if (!this.breakStartedFromNotification) {
      console.log('Manual break completed - incrementing counter');
      await this.incrementStreak();
    } else {
      console.log('Notification break completed - counter already incremented');
    }
    
    // Reset the flag for next break
    this.breakStartedFromNotification = false;
    
    // Reset UI
    this.resetExerciseUI();
    
    // Show completion message
    this.showCompletionMessage();
    
    // Update UI to reflect any changes
    this.updateUI();
  }

  async incrementStreak() {
    const today = new Date().toDateString();
    
    if (this.settings.lastBreakDate !== today) {
      // First break of the day - reset daily count
      // Update best streak if current was better
      if (this.settings.streakCount && this.settings.streakCount > (this.settings.bestStreak || 0)) {
        this.settings.bestStreak = this.settings.streakCount;
      }
      this.settings.streakCount = 1;
    } else {
      // Same day - increment
      this.settings.streakCount += 1;
    }
    
    // Always increment total breaks
    this.settings.totalBreaks = (this.settings.totalBreaks || 0) + 1;
    this.settings.lastBreakDate = today;
    
    await this.saveSettings();
  }

  resetExerciseUI() {
    document.getElementById('exerciseEmoji').textContent = '🧘‍♂️';
    document.getElementById('exerciseName').textContent = 'Great job!';
    document.getElementById('exerciseDescription').textContent = 'Break completed! Keep up the good work.';
    
    document.getElementById('exerciseTimer').style.display = 'none';
    document.getElementById('getExerciseBtn').style.display = 'block';
    document.getElementById('startTimerBtn').style.display = 'none';
    document.getElementById('completeBtn').style.display = 'none';
    
    this.currentExercise = null;
    
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  showCompletionMessage() {
    // Temporary celebration
    setTimeout(() => {
      document.getElementById('exerciseName').textContent = 'Ready for a break?';
      document.getElementById('exerciseDescription').textContent = 'Click "Get Exercise" to see your next micro-break activity!';
    }, 3000);
  }

  async snoozeBreak() {
    // Send message to background script
    chrome.runtime.sendMessage({ action: 'snooze' });
    
    // Close popup
    window.close();
  }

  async toggleReminders(enabled) {
    this.settings.isEnabled = enabled;
    await this.saveSettings();
    
    // Send message to background script to update alarms
    chrome.runtime.sendMessage({ action: 'toggleReminders', enabled });
    
    this.updateUI();
    this.startCountdownTimer(); // Restart countdown with new settings
  }

  updateUI() {
    // Update streak counter (this should show today's breaks)
    const todayBreaks = this.getTodayBreaks();
    document.getElementById('streakCount').textContent = todayBreaks;
    
    // Update toggle
    document.getElementById('enableToggle').checked = this.settings.isEnabled;
    
    // Update interval display
    document.getElementById('intervalDisplay').textContent = `${this.settings.interval} min`;
    
    // Update status
    const statusElement = document.getElementById('status');
    if (this.settings.isEnabled) {
      statusElement.textContent = 'Active';
      statusElement.className = 'stat-value status-active';
    } else {
      statusElement.textContent = 'Disabled';
      statusElement.className = 'stat-value status-disabled';
    }
  }

  getTodayBreaks() {
    const today = new Date().toDateString();
    if (this.settings.lastBreakDate === today) {
      return this.settings.streakCount || 0;
    }
    return 0; // Different day, so today's count is 0
  }

  async startCountdownTimer() {
    // Clear any existing countdown
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    if (!this.settings.isEnabled) {
      this.displayCountdown(0, 0, 0, 'Disabled');
      return;
    }

    // Start the countdown
    this.countdownInterval = setInterval(async () => {
      await this.updateCountdown();
    }, 1000);

    // Initial update
    await this.updateCountdown();
  }

  async updateCountdown() {
    try {
      const alarms = await chrome.alarms.getAll();
      const breakAlarm = alarms.find(alarm => alarm.name === 'microBreakReminder');
      
      if (!breakAlarm) {
        this.displayCountdown(0, 0, 0, 'No alarm set');
        return;
      }

      const now = Date.now();
      const timeUntilAlarm = breakAlarm.scheduledTime - now;
      
      if (timeUntilAlarm <= 0) {
        this.displayCountdown(0, 0, 100, 'Break time!');
        return;
      }

      const totalSeconds = Math.ceil(timeUntilAlarm / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      
      // Calculate progress percentage
      const totalInterval = this.settings.interval * 60; // Convert to seconds
      const elapsed = totalInterval - totalSeconds;
      const progressPercent = Math.max(0, Math.min(100, (elapsed / totalInterval) * 100));
      
      this.displayCountdown(minutes, seconds, progressPercent);
      
    } catch (error) {
      console.error('Error updating countdown:', error);
      this.displayCountdown(0, 0, 0, 'Error');
    }
  }

  displayCountdown(minutes, seconds, progressPercent, status = null) {
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    const progressBar = document.getElementById('progressBar');
    const countdownDisplay = document.getElementById('countdownDisplay');

    if (status) {
      // Show status message instead of countdown
      minutesElement.textContent = '--';
      secondsElement.textContent = '--';
      progressBar.style.width = `${progressPercent}%`;
      
      if (status === 'Break time!') {
        countdownDisplay.classList.add('countdown-urgent');
      } else {
        countdownDisplay.classList.remove('countdown-urgent', 'countdown-warning');
      }
      return;
    }

    // Format time with leading zeros
    minutesElement.textContent = minutes.toString().padStart(2, '0');
    secondsElement.textContent = seconds.toString().padStart(2, '0');
    progressBar.style.width = `${progressPercent}%`;

    // Add visual cues based on remaining time
    const totalSeconds = minutes * 60 + seconds;
    
    countdownDisplay.classList.remove('countdown-urgent', 'countdown-warning');
    
    if (totalSeconds <= 60) {
      // Last minute - urgent
      countdownDisplay.classList.add('countdown-urgent');
    } else if (totalSeconds <= 300) {
      // Last 5 minutes - warning
      countdownDisplay.classList.add('countdown-warning');
    }
  }

  async updateNextBreakTime() {
    // This method is kept for backward compatibility but now handled by startCountdownTimer
    await this.updateCountdown();
  }

  playNotificationSound() {
    // Create a short notification sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('Audio not available');
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.popupController = new PopupController();
});

// Clean up intervals when popup is closed
window.addEventListener('beforeunload', () => {
  if (window.popupController && window.popupController.countdownInterval) {
    clearInterval(window.popupController.countdownInterval);
  }
  if (window.popupController && window.popupController.timerInterval) {
    clearInterval(window.popupController.timerInterval);
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showExercise') {
    console.log('Received showExercise message');
    
    // Auto-show exercise if opened from notification
    const showExercise = () => {
      if (window.popupController && window.popupController.initialized) {
        console.log('Auto-showing exercise from notification - popup already open');
        
        // Reset any current exercise state first
        if (window.popupController.currentExercise) {
          window.popupController.resetExerciseUI();
        }
        
        // Mark that this break came from a notification
        window.popupController.breakStartedFromNotification = true;
        window.popupController.getRandomExercise();
        
        // Send response to confirm message was handled
        sendResponse({ success: true, message: 'Exercise shown' });
      } else {
        console.log('Popup controller not ready, trying fallback');
        // Fallback: try clicking the button
        const btn = document.getElementById('getExerciseBtn');
        if (btn && btn.style.display !== 'none') {
          // Mark that this break came from a notification
          if (window.popupController) {
            window.popupController.breakStartedFromNotification = true;
          }
          btn.click();
          sendResponse({ success: true, message: 'Button clicked' });
        } else {
          sendResponse({ success: false, message: 'Button not available' });
        }
      }
    };
    
    // Try immediately
    showExercise();
    
    // Also try with delays as fallback
    setTimeout(() => {
      if (!window.popupController?.currentExercise) {
        console.log('Retrying exercise display after 100ms');
        showExercise();
      }
    }, 100);
    
    setTimeout(() => {
      if (!window.popupController?.currentExercise) {
        console.log('Retrying exercise display after 300ms');
        showExercise();
      }
    }, 300);
    
    // Return true to indicate we'll send a response asynchronously
    return true;
    
  } else if (message.action === 'statsReset') {
    // Handle stats reset message from options page
    console.log('Received stats reset message');
    if (window.popupController && window.popupController.initialized) {
      // Reload settings and update UI
      window.popupController.loadSettings().then(() => {
        window.popupController.updateUI();
        console.log('Popup stats updated after reset');
      });
      sendResponse({ success: true, message: 'Popup stats updated' });
    } else {
      sendResponse({ success: false, message: 'Popup not ready' });
    }
    return true;
  }
});
