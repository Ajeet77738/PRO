const SUPABASE_URL = 'https://ofixhravfmtuuthpavcw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9maXhocmF2Zm10dXV0aHBhdmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3OTQ2MDEsImV4cCI6MjEwNDM3MDYwMX0.7qYlmuSXOjcZeYgr4COHl0SAucherfxaOjnsmv8Smno';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  if (typeof initAmbientHearts === 'function') initAmbientHearts();
  if (typeof initTouchHearts === 'function') initTouchHearts();

  const buttons = document.querySelectorAll('#decision-buttons button');
  const buttonGroup = document.getElementById('decision-buttons');
  const noteSection = document.getElementById('optional-note-section');
  const noteInput = document.getElementById('visitor-note');
  const submitNoteBtn = document.getElementById('submit-note-btn');
  const skipNoteBtn = document.getElementById('skip-note-btn');
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

  let selectedChoice = null;

  async function saveToSupabase(choice, messageText = null) {
    try {
      const payload = { choice };
      if (messageText && messageText.trim().length > 0) {
        payload.message = messageText.trim();
      }

      const { error } = await supabaseClient
        .from('responses')
        .insert([payload]);

      if (error) {
        console.error('Supabase insert error:', error);
        alert('Could not save your choice. Please try again.');
        return false;
      }
      return true;
    } catch (err) {
      console.error('Network error:', err);
      alert('Network error. Please try again.');
      return false;
    }
  }

  function showConfirmation(choice) {
    buttonGroup.classList.add('hidden');
    noteSection.classList.add('hidden');
    feedbackIcon.textContent = icons[choice] || '💌';
    confirmationMessage.textContent = messages[choice];
    confirmationView.classList.remove('hidden');
  }

  buttons.forEach(button => {
    button.addEventListener('click', async (e) => {
      const choice = button.getAttribute('data-choice');
      if (!choice) return;

      selectedChoice = choice;

      if (choice === 'yes') {
        if (typeof launchHeartConfetti === 'function') {
          launchHeartConfetti(e.clientX, e.clientY);
        }
        // Hide initial buttons and reveal the optional note box
        buttonGroup.classList.add('hidden');
        noteSection.classList.remove('hidden');
      } else {
        // For 'maybe' or 'no', save immediately without asking for a note
        buttons.forEach(b => (b.disabled = true));
        const ok = await saveToSupabase(choice, null);
        if (ok) {
          showConfirmation(choice);
        } else {
          buttons.forEach(b => (b.disabled = false));
        }
      }
    });
  });

  submitNoteBtn.addEventListener('click', async () => {
    submitNoteBtn.disabled = true;
    skipNoteBtn.disabled = true;

    const text = noteInput.value;
    const ok = await saveToSupabase(selectedChoice, text);

    if (ok) {
      showConfirmation(selectedChoice);
    } else {
      submitNoteBtn.disabled = false;
      skipNoteBtn.disabled = false;
    }
  });

  skipNoteBtn.addEventListener('click', async () => {
    submitNoteBtn.disabled = true;
    skipNoteBtn.disabled = true;

    const ok = await saveToSupabase(selectedChoice, null);

    if (ok) {
      showConfirmation(selectedChoice);
    } else {
      submitNoteBtn.disabled = false;
      skipNoteBtn.disabled = false;
    }
  });
});
