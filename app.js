document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     1. NAVIGATION & HEADER CONTROL
     ========================================================================== */
  const header = document.querySelector('.main-header');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinksContainer = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('main > section');

  // Shrink header on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    highlightNavOnScroll();
  });

  // Mobile menu toggle
  if (navToggle && navLinksContainer) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !expanded);
      navLinksContainer.classList.toggle('active');
    });

    // Close menu when clicking a link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        navLinksContainer.classList.remove('active');
      });
    });
  }

  // Highlight active nav link on scroll
  function highlightNavOnScroll() {
    let scrollPosition = window.scrollY + 200; // Offset for header

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPosition >= top && scrollPosition < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  /* ==========================================================================
     2. CUSTOM AUDIO PLAYER
     ========================================================================== */
  const tracks = [
    { name: 'Elysian Echoes', src: 'assets/audio/cancion1.wav', duration: '0:10' },
    { name: 'Amber Shadows', src: 'assets/audio/cancion2.wav', duration: '0:10' },
    { name: 'Nocturnal Tide', src: 'assets/audio/cancion3.wav', duration: '0:10' }
  ];

  let currentTrackIndex = 0;
  const audio = new Audio();
  audio.volume = 0.8;

  // DOM Elements
  const playBtn = document.getElementById('btn-play-pause');
  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');
  const muteBtn = document.getElementById('btn-mute');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const volumeIcon = document.getElementById('volume-icon');
  const muteIcon = document.getElementById('mute-icon');
  
  const trackTitle = document.getElementById('current-track-title');
  const albumArtWrapper = document.querySelector('.album-art-wrapper');
  const playlistItems = document.querySelectorAll('.playlist-item');

  const currentTimeLabel = document.getElementById('current-time');
  const durationTimeLabel = document.getElementById('duration-time');
  
  const progressSlider = document.getElementById('progress-slider');
  const progressFill = document.getElementById('progress-fill');
  const progressThumb = document.getElementById('progress-thumb');

  const volumeSlider = document.getElementById('volume-slider');
  const volumeFill = document.getElementById('volume-fill');
  const volumeThumb = document.getElementById('volume-thumb');

  let isMuted = false;
  let savedVolume = 0.8;

  // Initialize first track source
  loadTrack(currentTrackIndex);

  function loadTrack(index) {
    currentTrackIndex = index;
    audio.src = tracks[index].src;
    trackTitle.textContent = tracks[index].name;
    durationTimeLabel.textContent = tracks[index].duration;
    currentTimeLabel.textContent = '0:00';
    updateProgressUI(0);
    
    // Update playlist active item style
    playlistItems.forEach((item, idx) => {
      if (idx === index) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  function playTrack() {
    audio.play().then(() => {
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
      albumArtWrapper.classList.add('playing');
    }).catch(error => {
      console.log('Audio playback was interrupted or blocked:', error);
    });
  }

  function pauseTrack() {
    audio.pause();
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    albumArtWrapper.classList.remove('playing');
  }

  function togglePlay() {
    if (audio.paused) {
      playTrack();
    } else {
      pauseTrack();
    }
  }

  function playNext() {
    let nextIndex = currentTrackIndex + 1;
    if (nextIndex >= tracks.length) nextIndex = 0;
    loadTrack(nextIndex);
    playTrack();
  }

  function playPrev() {
    let prevIndex = currentTrackIndex - 1;
    if (prevIndex < 0) prevIndex = tracks.length - 1;
    loadTrack(prevIndex);
    playTrack();
  }

  // Audio Event Listeners
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const progressPercent = (audio.currentTime / audio.duration) * 100;
    updateProgressUI(progressPercent);
    currentTimeLabel.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener('durationchange', () => {
    if (audio.duration) {
      durationTimeLabel.textContent = formatTime(audio.duration);
    }
  });

  audio.addEventListener('ended', () => {
    playNext();
  });

  // Track buttons action
  playBtn.addEventListener('click', togglePlay);
  nextBtn.addEventListener('click', playNext);
  prevBtn.addEventListener('click', playPrev);

  // Playlist items click
  playlistItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      if (currentTrackIndex === index) {
        togglePlay();
      } else {
        loadTrack(index);
        playTrack();
      }
    });
  });

  // Progress Bar Drag / Click Logic
  function updateProgressUI(percent) {
    progressFill.style.width = `${percent}%`;
    progressThumb.style.left = `${percent}%`;
    progressSlider.setAttribute('aria-valuenow', Math.round(percent));
  }

  function setProgress(e) {
    const width = progressSlider.clientWidth;
    const clickX = e.offsetX !== undefined ? e.offsetX : (e.touches ? e.touches[0].clientX - progressSlider.getBoundingClientRect().left : 0);
    const newPercent = Math.max(0, Math.min(100, (clickX / width) * 100));
    
    updateProgressUI(newPercent);
    if (audio.duration) {
      audio.currentTime = (newPercent / 100) * audio.duration;
    }
  }

  // Slider Mouse/Touch interactions
  let isDraggingProgress = false;

  progressSlider.addEventListener('mousedown', (e) => {
    isDraggingProgress = true;
    setProgress(e);
  });

  document.addEventListener('mousemove', (e) => {
    if (isDraggingProgress) {
      const rect = progressSlider.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newPercent = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
      updateProgressUI(newPercent);
      if (audio.duration) {
        audio.currentTime = (newPercent / 100) * audio.duration;
      }
    }
  });

  document.addEventListener('mouseup', () => {
    isDraggingProgress = false;
  });

  // Keyboard navigation for progress slider (slider focusable)
  progressSlider.addEventListener('keydown', (e) => {
    if (!audio.duration) return;
    let newTime = audio.currentTime;
    if (e.key === 'ArrowRight') {
      newTime = Math.min(audio.duration, audio.currentTime + 5);
    } else if (e.key === 'ArrowLeft') {
      newTime = Math.max(0, audio.currentTime - 5);
    } else {
      return;
    }
    e.preventDefault();
    audio.currentTime = newTime;
    const progressPercent = (newTime / audio.duration) * 100;
    updateProgressUI(progressPercent);
  });

  // Volume Slider Logic
  function updateVolumeUI(volume) {
    const percent = volume * 100;
    volumeFill.style.width = `${percent}%`;
    volumeThumb.style.left = `${percent}%`;
    volumeSlider.setAttribute('aria-valuenow', Math.round(percent));
  }

  function setVolume(e) {
    const width = volumeSlider.clientWidth;
    const clickX = e.offsetX !== undefined ? e.offsetX : 0;
    const volumePercent = Math.max(0, Math.min(100, (clickX / width) * 100));
    const newVolume = volumePercent / 100;
    
    audio.volume = newVolume;
    savedVolume = newVolume;
    updateVolumeUI(newVolume);

    if (newVolume === 0) {
      setMutedState(true);
    } else {
      setMutedState(false);
    }
  }

  let isDraggingVolume = false;

  volumeSlider.addEventListener('mousedown', (e) => {
    isDraggingVolume = true;
    setVolume(e);
  });

  document.addEventListener('mousemove', (e) => {
    if (isDraggingVolume) {
      const rect = volumeSlider.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const volumePercent = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
      const newVolume = volumePercent / 100;
      audio.volume = newVolume;
      savedVolume = newVolume;
      updateVolumeUI(newVolume);

      if (newVolume === 0) {
        setMutedState(true);
      } else {
        setMutedState(false);
      }
    }
  });

  document.addEventListener('mouseup', () => {
    isDraggingVolume = false;
  });

  // Keyboard navigation for volume slider
  volumeSlider.addEventListener('keydown', (e) => {
    let newVolume = audio.volume;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      newVolume = Math.min(1.0, audio.volume + 0.1);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      newVolume = Math.max(0.0, audio.volume - 0.1);
    } else {
      return;
    }
    e.preventDefault();
    audio.volume = newVolume;
    savedVolume = newVolume;
    updateVolumeUI(newVolume);
    setMutedState(newVolume === 0);
  });

  // Mute / Unmute
  muteBtn.addEventListener('click', () => {
    toggleMute();
  });

  function toggleMute() {
    if (isMuted) {
      audio.volume = savedVolume;
      updateVolumeUI(savedVolume);
      setMutedState(false);
    } else {
      audio.volume = 0;
      updateVolumeUI(0);
      setMutedState(true);
    }
  }

  function setMutedState(mute) {
    isMuted = mute;
    if (mute) {
      volumeIcon.classList.add('hidden');
      muteIcon.classList.remove('hidden');
      muteBtn.setAttribute('aria-label', 'Activar sonido');
    } else {
      volumeIcon.classList.remove('hidden');
      muteIcon.classList.add('hidden');
      muteBtn.setAttribute('aria-label', 'Silenciar');
    }
  }

  // Format seconds into MM:SS
  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }

  /* ==========================================================================
     3. INTERSECTIONOBSERVER FALLBACK FOR SCROLL ANIMATIONS
     ========================================================================== */
  // Feature detection check matching CSS @supports
  const nativeScrollAnimationsSupported = CSS.supports('(animation-timeline: view()) and (animation-range: entry)');
  
  if (!nativeScrollAnimationsSupported) {
    const revealElements = document.querySelectorAll('.scroll-reveal');
    
    // Set initial state (opacity 0 and translated down)
    revealElements.forEach(el => {
      el.classList.add('js-reveal');
    });

    const observerOptions = {
      root: null, // Viewport
      threshold: 0.15, // Trigger when 15% visible
      rootMargin: '0px 0px -50px 0px' // Offset to trigger slightly before coming into full view
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          // Once revealed, we can unobserve if we only want entry effect once
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    revealElements.forEach(el => {
      observer.observe(el);
    });
  }

  /* ==========================================================================
     4. BOOKING FORM VALIDATION & INTERACTIVITY
     ========================================================================== */
  const bookingForm = document.getElementById('booking-form');
  const formFeedback = document.getElementById('form-feedback');
  
  if (bookingForm) {
    const nameInput = document.getElementById('contact-name');
    const emailInput = document.getElementById('contact-email');
    const messageInput = document.getElementById('contact-message');

    // Trigger individual error displays on input/blur
    const inputs = [nameInput, emailInput, messageInput];
    inputs.forEach(input => {
      if (!input) return;
      input.addEventListener('blur', () => {
        validateField(input);
      });
      input.addEventListener('input', () => {
        // Clear error as user types if it becomes valid
        if (input.checkValidity()) {
          clearError(input);
        }
      });
    });

    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Validate all fields
      let formIsValid = true;
      inputs.forEach(input => {
        if (!input) return;
        if (!validateField(input)) {
          formIsValid = false;
        }
      });

      if (!formIsValid) {
        showFeedback('Por favor, corrige los campos marcados en rojo antes de enviar.', 'error');
        return;
      }

      // Simulate API call/submission
      const submitBtn = bookingForm.querySelector('.btn-submit');
      const originalBtnText = submitBtn.textContent;
      submitBtn.textContent = 'Enviando...';
      submitBtn.disabled = true;

      setTimeout(() => {
        // Success
        showFeedback('¡Gracias! Tu mensaje ha sido enviado con éxito. Nos contactaremos contigo a la brevedad.', 'success');
        bookingForm.reset();
        
        // Restore button
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
        
        // Remove valid classes after reset
        inputs.forEach(input => {
          if (input) {
            input.classList.remove('valid');
            clearError(input);
          }
        });
      }, 1500);
    });

    function validateField(input) {
      if (!input) return false;
      const errorMsg = document.getElementById(`${input.id.replace('contact-', '')}-error`);
      
      if (!input.checkValidity()) {
        if (errorMsg) errorMsg.style.display = 'block';
        return false;
      } else {
        if (errorMsg) errorMsg.style.display = 'none';
        return true;
      }
    }

    function clearError(input) {
      if (!input) return;
      const errorMsg = document.getElementById(`${input.id.replace('contact-', '')}-error`);
      if (errorMsg) errorMsg.style.display = 'none';
    }

    function showFeedback(message, type) {
      formFeedback.textContent = message;
      formFeedback.className = `form-feedback ${type}`;
      formFeedback.classList.remove('hidden');

      // Scroll to feedback if on mobile
      formFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
});
