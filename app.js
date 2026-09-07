// Paste your actual Supabase URL & anon key here
const SUPABASE_URL = 'https://ofixhravfmtuuthpavcw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9maXhocmF2Zm10dXV0aHBhdmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3OTQ2MDEsImV4cCI6MjEwNDM3MDYwMX0.7qYlmuSXOjcZeYgr4COHl0SAucherfxaOjnsmv8Smno';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  initAmbientHearts();
  initTouchHearts();

  const buttons = document.querySelectorAll('#decision-buttons button');
  const buttonGroup = document.getElementById('decision-buttons');
  const confirmationView = document.getElementById('confirmation-view');
  const confirmationMessage = document.getElementById('confirmation-message');
  const feedbackIcon = document.getElementById('feedback-icon');

  const messages = {
    yes: 'Thank you for giving this a chance. You made my day so very special! 💛',
    maybe: 'Thank you for your honesty. I look forward to getting to know you better 🙂',
    no: 'Thank you for being open and honest. Your decision is respected completely 🤍'
  };

  const icons = {
    yes: '✨💛✨',
    maybe: '🌸✨',
    no: '🤍'
  };

  buttons.forEach(button => {
    button.addEventListener('click', async (e) => {
      const choice = button.getAttribute('data-choice');
      if (!choice) return;

      // Celebrate on 'yes'
      if (choice === 'yes') {
        launchHeartConfetti(e.clientX, e.clientY);
      }

      buttons.forEach(b => (b.disabled = true));

      try {
        const { error } = await supabaseClient
          .from('responses')
          .insert([{ choice }]);

        if (!error) {
          buttonGroup.classList.add('hidden');
          feedbackIcon.textContent = icons[choice] || '💌';
          confirmationMessage.textContent = messages[choice];
          confirmationView.classList.remove('hidden');
        } else {
          alert('Could not save your choice. Please check connection.');
          buttons.forEach(b => (b.disabled = false));
        }
      } catch (err) {
        alert('Connection error. Please try again.');
        buttons.forEach(b => (b.disabled = false));
      }
    });
  });
});

/* --------------------------------------------------
   1. Touch/Click Heart Effect on Screen Tap
-------------------------------------------------- */
function initTouchHearts() {
  const heartPool = ['💖', '💕', '✨', '💛', '🌸', '❤️'];

  window.addEventListener('pointerdown', (e) => {
    // Avoid spamming when tapping buttons directly
    if (e.target.closest('button')) return;

    createTapHeart(e.clientX, e.clientY);
  });

  function createTapHeart(x, y) {
    const heart = document.createElement('div');
    heart.className = 'tap-heart';
    heart.textContent = heartPool[Math.floor(Math.random() * heartPool.length)];
    
    // Slight random rotation angle
    const randomAngle = (Math.random() * 40 - 20) + 'deg';
    heart.style.setProperty('--rot', randomAngle);
    
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;

    document.body.appendChild(heart);

    setTimeout(() => {
      heart.remove();
    }, 1200);
  }
}

/* --------------------------------------------------
   2. Celebration Heart Burst on "Yes"
-------------------------------------------------- */
function launchHeartConfetti(originX, originY) {
  const hearts = ['💛', '💖', '✨', '💕', '🥰'];
  const count = 35;

  for (let i = 0; i < count; i++) {
    const heart = document.createElement('div');
    heart.className = 'tap-heart';
    heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];

    const x = originX || window.innerWidth / 2;
    const y = originY || window.innerHeight / 2;

    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;

    // Disperse outward randomly
    const angle = Math.random() * 2 * Math.PI;
    const distance = 80 + Math.random() * 180;
    const destX = Math.cos(angle) * distance;
    const destY = Math.sin(angle) * distance - 80;

    heart.animate([
      { transform: 'translate(-50%, -50%) scale(0.6)', opacity: 1 },
      { transform: `translate(calc(-50% + ${destX}px), calc(-50% + ${destY}px)) scale(1.6)`, opacity: 0 }
    ], {
      duration: 1400 + Math.random() * 600,
      easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)',
      fill: 'forwards'
    });

    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 2100);
  }
}

/* --------------------------------------------------
   3. Ambient Floating Background Particles
-------------------------------------------------- */
function initAmbientHearts() {
  const canvas = document.getElementById('heart-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width, height;
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const particles = [];
  const particleCount = 28;

  class FloatingParticle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = height + 20 + Math.random() * 40;
      this.size = 10 + Math.random() * 16;
      this.speedY = 0.5 + Math.random() * 1.2;
      this.speedX = (Math.random() - 0.5) * 0.6;
      this.opacity = 0.15 + Math.random() * 0.45;
      this.fadeSpeed = 0.002;
      this.symbol = Math.random() > 0.4 ? '♥' : '✦';
      this.color = Math.random() > 0.5 ? 'rgba(244, 114, 182,' : 'rgba(251, 191, 36,';
    }

    update() {
      this.y -= this.speedY;
      this.x += this.speedX;

      if (this.y < -30) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.font = `${this.size}px serif`;
      ctx.fillStyle = `${this.color}${this.opacity})`;
      ctx.fillText(this.symbol, this.x, this.y);
      ctx.restore();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    const p = new FloatingParticle();
    p.y = Math.random() * height; // Distribute on first load
    particles.push(p);
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }

  animate();
}
