/* ==========================================================================
   A JOURNEY THROUGH THE DAY - SCRIPT.JS
   Features: Parallax scroll, dynamic color blending, celestial arc,
             particle canvas (petals, embers, stars, meteors),
             interactive quotes, and responsive audio player.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // --- Elements & State ---
  const skyBg = document.getElementById('skyBg');
  const sun = document.getElementById('sun');
  const moon = document.getElementById('moon');
  const journeyProgressBar = document.getElementById('journeyProgressBar');
  const timeIcon = document.getElementById('timeIcon');
  const timeLabel = document.getElementById('timeLabel');
  const navDots = document.querySelectorAll('.nav-dot');

  // Parallax layers
  const mountainsBack = document.getElementById('mountainsBack');
  const mountainsMid = document.getElementById('mountainsMid');
  const mountainsFront = document.getElementById('mountainsFront');
  const treesFront = document.getElementById('treesFront');

  // Audio elements
  const bgAudio = document.getElementById('bgAudio');
  const playBtn = document.getElementById('playBtn');
  const playIcon = document.getElementById('playIcon');
  const vinylDisc = document.getElementById('vinylDisc');
  const audioFileInput = document.getElementById('audioFileInput');
  const musicToast = document.getElementById('musicToast');
  const toastClose = document.getElementById('toastClose');

  let isPlaying = false;
  let audioContext = null;

  // --- Sound Effects Synthesizer (Web Audio API) for gentle micro-interactions ---
  function playGentleChime(freq = 528, type = 'sine', duration = 0.8) {
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioContext.currentTime + duration);

      gain.gain.setValueAtTime(0.08, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.start();
      osc.stop(audioContext.currentTime + duration);
    } catch (e) {
      // Audio context might fail on autoplay restrictions; silent fail is ok
    }
  }

  // --- Audio Player Logic (Glue Song - beabadoobee) ---
  function toggleAudio() {
    if (!isPlaying) {
      bgAudio.play().then(() => {
        isPlaying = true;
        updateAudioUI(true);
        if (musicToast) musicToast.classList.add('hidden');
      }).catch(err => {
        console.warn("Autoplay / source error:", err);
        // If file not found yet, alert gently and trigger file selector
        playGentleChime(440, 'triangle', 0.5);
        const confirmPick = confirm(
          "File 'glue-song.mp3' belum ditemukan di folder.\n\nApakah kamu ingin memilih file MP3 sekarang dari perangkatmu?"
        );
        if (confirmPick && audioFileInput) {
          audioFileInput.click();
        }
      });
    } else {
      bgAudio.pause();
      isPlaying = false;
      updateAudioUI(false);
    }
  }

  function updateAudioUI(playing) {
    if (playing) {
      vinylDisc.classList.add('spinning');
      if (playIcon) playIcon.setAttribute('data-lucide', 'pause');
    } else {
      vinylDisc.classList.remove('spinning');
      if (playIcon) playIcon.setAttribute('data-lucide', 'play');
    }
    if (window.lucide) window.lucide.createIcons();
  }

  if (playBtn) playBtn.addEventListener('click', toggleAudio);
  if (vinylDisc) vinylDisc.addEventListener('click', toggleAudio);

  // File picker handler so user can upload/pick glue-song.mp3 directly from HP/Laptop
  if (audioFileInput) {
    audioFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const fileURL = URL.createObjectURL(file);
        bgAudio.src = fileURL;
        bgAudio.play().then(() => {
          isPlaying = true;
          updateAudioUI(true);
          if (musicToast) musicToast.classList.add('hidden');
          playGentleChime(659, 'sine', 0.6);
        }).catch(err => console.error(err));
      }
    });
  }

  if (toastClose) {
    toastClose.addEventListener('click', () => {
      if (musicToast) musicToast.classList.add('hidden');
    });
  }

  // Auto-hide toast after 8 seconds
  setTimeout(() => {
    if (musicToast && !isPlaying) {
      musicToast.classList.add('hidden');
    }
  }, 8000);

  // --- Color Interpolation for Dynamic Sky ---
  // Helper to parse hex to rgb
  function hexToRgb(hex) {
    const bigint = parseInt(hex.replace('#', ''), 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    };
  }

  function lerp(start, end, t) {
    return start + (end - start) * t;
  }

  function interpolateColor(color1, color2, factor) {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    const r = Math.round(lerp(rgb1.r, rgb2.r, factor));
    const g = Math.round(lerp(rgb1.g, rgb2.g, factor));
    const b = Math.round(lerp(rgb1.b, rgb2.b, factor));
    return `rgb(${r}, ${g}, ${b})`;
  }

  // Keyframes for the 4 Times of Day
  const timePalettes = [
    // 0: Pagi (Dawn / Sunrise) - 0.0 to 0.25
    {
      progress: 0.0,
      skyStart: '#ff9a76',
      skyMid: '#ffc3a0',
      skyEnd: '#c4e0e5',
      sunOpacity: 1,
      moonOpacity: 0,
      sunTop: 32, // percentage
      sunLeft: 50,
      moonTop: 85,
      moonLeft: 50,
      textColor: '#2d2640',
      textMuted: '#5e5270',
      mountainFilter: 'brightness(1) saturate(1.1) hue-rotate(0deg)',
      icon: '🌅',
      label: '06:30 • Fajar Pagi'
    },
    // 1: Siang (Bright Day) - 0.33
    {
      progress: 0.33,
      skyStart: '#38bdf8',
      skyMid: '#7dd3fc',
      skyEnd: '#bae6fd',
      sunOpacity: 1,
      moonOpacity: 0,
      sunTop: 12,
      sunLeft: 50,
      moonTop: 95,
      moonLeft: 50,
      textColor: '#0f172a',
      textMuted: '#334155',
      mountainFilter: 'brightness(1.15) saturate(1.2) hue-rotate(-20deg)',
      icon: '☀️',
      label: '12:00 • Siang Cerah'
    },
    // 2: Senja (Golden Hour / Sunset) - 0.66
    {
      progress: 0.66,
      skyStart: '#ea580c',
      skyMid: '#f43f5e',
      skyEnd: '#7c3aed',
      sunOpacity: 0.75,
      moonOpacity: 0.2,
      sunTop: 65,
      sunLeft: 50,
      moonTop: 45,
      moonLeft: 50,
      textColor: '#ffffff',
      textMuted: '#fed7aa',
      mountainFilter: 'brightness(0.65) saturate(1.5) hue-rotate(30deg)',
      icon: '🌇',
      label: '17:45 • Lembayung Senja'
    },
    // 3: Malam (Starry Midnight) - 1.0
    {
      progress: 1.0,
      skyStart: '#050711',
      skyMid: '#0f172a',
      skyEnd: '#1e1b4b',
      sunOpacity: 0,
      moonOpacity: 1,
      sunTop: 95,
      sunLeft: 50,
      moonTop: 20,
      moonLeft: 50,
      textColor: '#f8fafc',
      textMuted: '#cbd5e1',
      mountainFilter: 'brightness(0.3) saturate(0.8) hue-rotate(60deg)',
      icon: '🌙',
      label: '22:00 • Malam Berbintang'
    }
  ];

  // --- Dynamic Scroll Handler ---
  function handleScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(Math.max(scrollTop / (scrollHeight || 1), 0), 1);

    // Update Progress Bar
    if (journeyProgressBar) {
      journeyProgressBar.style.width = `${progress * 100}%`;
    }

    // Determine Palette Segment
    let p1 = timePalettes[0];
    let p2 = timePalettes[1];
    let factor = 0;

    if (progress <= timePalettes[1].progress) {
      p1 = timePalettes[0];
      p2 = timePalettes[1];
      factor = (progress - p1.progress) / (p2.progress - p1.progress);
    } else if (progress <= timePalettes[2].progress) {
      p1 = timePalettes[1];
      p2 = timePalettes[2];
      factor = (progress - p1.progress) / (p2.progress - p1.progress);
    } else {
      p1 = timePalettes[2];
      p2 = timePalettes[3];
      factor = (progress - p1.progress) / (p2.progress - p1.progress);
    }

    // Interpolate Sky Colors
    const currentSkyStart = interpolateColor(p1.skyStart, p2.skyStart, factor);
    const currentSkyMid = interpolateColor(p1.skyMid, p2.skyMid, factor);
    const currentSkyEnd = interpolateColor(p1.skyEnd, p2.skyEnd, factor);

    document.documentElement.style.setProperty('--sky-gradient-start', currentSkyStart);
    document.documentElement.style.setProperty('--sky-gradient-mid', currentSkyMid);
    document.documentElement.style.setProperty('--sky-gradient-end', currentSkyEnd);

    // Celestial movement
    const currentSunTop = lerp(p1.sunTop, p2.sunTop, factor);
    const currentSunOpacity = lerp(p1.sunOpacity, p2.sunOpacity, factor);
    const currentMoonTop = lerp(p1.moonTop, p2.moonTop, factor);
    const currentMoonOpacity = lerp(p1.moonOpacity, p2.moonOpacity, factor);

    if (sun) {
      sun.style.top = `${currentSunTop}%`;
      sun.style.opacity = currentSunOpacity;
    }
    if (moon) {
      moon.style.top = `${currentMoonTop}%`;
      moon.style.opacity = currentMoonOpacity;
    }

    // Update Mountain Filters and Parallax
    const mountainFilter = factor < 0.5 ? p1.mountainFilter : p2.mountainFilter;
    if (mountainsBack) {
      mountainsBack.style.filter = mountainFilter;
      mountainsBack.style.transform = `translateY(${scrollTop * 0.08}px)`;
    }
    if (mountainsMid) {
      mountainsMid.style.filter = mountainFilter;
      mountainsMid.style.transform = `translateY(${scrollTop * 0.04}px)`;
    }
    if (mountainsFront) {
      mountainsFront.style.filter = mountainFilter;
      mountainsFront.style.transform = `translateY(${scrollTop * 0.02}px)`;
    }
    if (treesFront) {
      treesFront.style.filter = mountainFilter;
    }

    // Update HUD Indicator
    const activePalette = factor < 0.5 ? p1 : p2;
    if (timeIcon && timeLabel) {
      timeIcon.textContent = activePalette.icon;
      timeLabel.textContent = activePalette.label;
    }

    // Update Nav Dots
    const sections = ['pagi', 'siang', 'senja', 'malam'];
    const currentSectionIdx = Math.min(Math.floor(progress * 4), 3);
    navDots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentSectionIdx);
    });
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Initial run

  // Nav Dot Click Scroll
  navDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const targetId = dot.getAttribute('data-target');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Replay Journey Button
  const replayJourneyBtn = document.getElementById('replayJourneyBtn');
  if (replayJourneyBtn) {
    replayJourneyBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      playGentleChime(528, 'sine', 1.0);
    });
  }

  // --- AMBIENT CANVAS PARTICLES (Petals, Leaves, Stars, Fireflies, Meteors) ---
  const canvas = document.getElementById('ambientCanvas');
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // Particle sets
  const particles = [];
  const maxParticles = window.innerWidth < 768 ? 40 : 85;

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 2.8 + 0.8;
      this.speedX = (Math.random() - 0.5) * 0.6;
      this.speedY = Math.random() * 0.7 + 0.2;
      this.opacity = Math.random() * 0.7 + 0.3;
      this.phase = Math.random() * Math.PI * 2;
    }

    update(scrollPct) {
      this.phase += 0.03;
      // Drift
      this.x += this.speedX + Math.sin(this.phase) * 0.4;
      this.y += this.speedY;

      if (this.y > height + 20) {
        this.y = -10;
        this.x = Math.random() * width;
      }
      if (this.x > width + 20) this.x = -10;
      if (this.x < -20) this.x = width + 10;
    }

    draw(scrollPct) {
      ctx.save();
      if (scrollPct < 0.3) {
        // Pagi: Soft pink blossom petals / dandelion
        ctx.fillStyle = `rgba(255, 182, 193, ${this.opacity * 0.7})`;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.size * 1.6, this.size, this.phase, 0, Math.PI * 2);
        ctx.fill();
      } else if (scrollPct < 0.6) {
        // Siang: Sun dust specks
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity * 0.45})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (scrollPct < 0.8) {
        // Senja: Golden glowing embers
        ctx.fillStyle = `rgba(251, 191, 36, ${this.opacity * 0.8})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#f59e0b';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Malam: Twinkling stardust & fireflies
        const twinkle = Math.sin(this.phase) * 0.4 + 0.6;
        ctx.fillStyle = `rgba(254, 240, 138, ${this.opacity * twinkle})`;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#fef08a';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Meteor / Shooting star in night mode
  let meteor = null;
  function spawnMeteor() {
    meteor = {
      x: Math.random() * width * 0.7 + width * 0.1,
      y: Math.random() * height * 0.3,
      length: Math.random() * 90 + 70,
      speed: Math.random() * 8 + 10,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
      opacity: 1
    };
  }

  setInterval(() => {
    const scrollPct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1);
    if (scrollPct > 0.65 && !meteor && Math.random() > 0.3) {
      spawnMeteor();
    }
  }, 3500);

  for (let i = 0; i < maxParticles; i++) {
    particles.push(new Particle());
  }

  function animateCanvas() {
    ctx.clearRect(0, 0, width, height);
    const scrollPct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1);

    // Draw particles
    particles.forEach(p => {
      p.update(scrollPct);
      p.draw(scrollPct);
    });

    // Draw Shooting Star
    if (meteor) {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${meteor.opacity})`;
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#bae6fd';
      ctx.beginPath();
      ctx.moveTo(meteor.x, meteor.y);
      const tailX = meteor.x - Math.cos(meteor.angle) * meteor.length;
      const tailY = meteor.y - Math.sin(meteor.angle) * meteor.length;
      ctx.lineTo(tailX, tailY);
      ctx.stroke();
      ctx.restore();

      meteor.x += Math.cos(meteor.angle) * meteor.speed;
      meteor.y += Math.sin(meteor.angle) * meteor.speed;
      meteor.opacity -= 0.025;

      if (meteor.opacity <= 0) {
        meteor = null;
      }
    }

    requestAnimationFrame(animateCanvas);
  }
  animateCanvas();


  // ==========================================================================
  // INTERACTIVE FEATURE 1: PAGI - WAX-SEALED ENVELOPE
  // ==========================================================================
  const morningEnvelope = document.getElementById('morningEnvelope');
  if (morningEnvelope) {
    morningEnvelope.addEventListener('click', () => {
      morningEnvelope.classList.toggle('opened');
      playGentleChime(659, 'sine', 0.6);
      
      // Auto-start Glue Song softly if not already playing upon first interaction
      if (!isPlaying) {
        bgAudio.play().then(() => {
          isPlaying = true;
          updateAudioUI(true);
          if (musicToast) musicToast.classList.add('hidden');
        }).catch(() => {
          // Silent fallback if browser restricts
        });
      }
    });
  }


  // ==========================================================================
  // INTERACTIVE FEATURE 2: SIANG - BREATHE WHEEL & CAPSULES
  // ==========================================================================
  // Breathing text cycle
  const breatheText = document.getElementById('breatheText');
  if (breatheText) {
    const breathStages = [
      { text: 'Tarik Napas 🌿', duration: 4000 },
      { text: 'Tahan Sejenak ✨', duration: 3000 },
      { text: 'Hembuskan... ☁️', duration: 4000 }
    ];
    let currentStage = 0;

    function runBreathingCycle() {
      breatheText.textContent = breathStages[currentStage].text;
      setTimeout(() => {
        currentStage = (currentStage + 1) % breathStages.length;
        runBreathingCycle();
      }, breathStages[currentStage].duration);
    }
    runBreathingCycle();
  }

  // Booster capsules modal
  const capsuleItems = document.querySelectorAll('.capsule-item');
  const capsulePopup = document.getElementById('capsulePopup');
  const capsulePopupText = document.getElementById('capsulePopupText');
  const capsulePopupClose = document.getElementById('capsulePopupClose');

  capsuleItems.forEach(item => {
    item.addEventListener('click', () => {
      const msg = item.getAttribute('data-message');
      if (capsulePopup && capsulePopupText) {
        capsulePopupText.textContent = msg;
        capsulePopup.classList.add('active');
        playGentleChime(784, 'sine', 0.5);
      }
    });
  });

  if (capsulePopupClose) {
    capsulePopupClose.addEventListener('click', () => {
      capsulePopup.classList.remove('active');
    });
  }


  // ==========================================================================
  // INTERACTIVE FEATURE 3: SENJA - GLOWING SUNSET LANTERNS
  // ==========================================================================
  const lanternBoxes = document.querySelectorAll('.lantern-box');
  const sunsetQuoteText = document.getElementById('sunsetQuoteText');
  const sunsetQuoteCard = document.getElementById('sunsetQuoteCard');

  lanternBoxes.forEach(box => {
    box.addEventListener('click', () => {
      const quote = box.getAttribute('data-quote');
      if (sunsetQuoteText) {
        sunsetQuoteText.style.opacity = '0';
        setTimeout(() => {
          sunsetQuoteText.textContent = quote;
          sunsetQuoteText.style.opacity = '1';
        }, 200);
      }

      // Add gentle lift animation
      const visual = box.querySelector('.lantern-visual');
      if (visual) {
        visual.style.transform = 'translateY(-16px) scale(1.1)';
        visual.style.boxShadow = '0 0 40px rgba(251, 146, 60, 0.9)';
        setTimeout(() => {
          visual.style.transform = '';
          visual.style.boxShadow = '';
        }, 1200);
      }

      playGentleChime(587, 'triangle', 0.8);
    });
  });


  // ==========================================================================
  // INTERACTIVE FEATURE 4: MALAM - CONSTELLATION & BEDTIME AFFIRMATIONS
  // ==========================================================================
  const interactiveStars = document.querySelectorAll('.interactive-star');
  const whisperText = document.getElementById('whisperText');

  interactiveStars.forEach((star, index) => {
    star.addEventListener('click', () => {
      const whisper = star.getAttribute('data-whisper');
      if (whisperText) {
        whisperText.style.opacity = '0';
        setTimeout(() => {
          whisperText.textContent = whisper;
          whisperText.style.opacity = '1';
        }, 200);
      }

      // Star sparkle sound with ascending scale
      const notes = [523.25, 659.25, 783.99, 1046.50];
      playGentleChime(notes[index % notes.length], 'sine', 0.9);

      // Star pulse boost
      const core = star.querySelector('.star-core');
      if (core) {
        core.style.boxShadow = '0 0 35px #ffffff, 0 0 60px #fde047';
        setTimeout(() => {
          core.style.boxShadow = '';
        }, 1000);
      }
    });
  });

});
