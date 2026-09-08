// Paste your actual Supabase URL & anon key here
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

  let isSubmitting = false;

  function showConfirmation(choice) {
    if (noteSection) noteSection.classList.add('hidden');
    buttonGroup.classList.add('hidden');
    feedbackIcon.textContent = icons[choice] || '💌';
    confirmationMessage.textContent = messages[choice];
    confirmationView.classList.remove('hidden');
  }

  // Single function that performs exactly ONE insert
  async function submitFinalResponse(choice, userMessage) {
    if (isSubmitting) return;
    isSubmitting = true;

    try {
      const payload = {
        choice: choice,
        message: userMessage && userMessage.trim().length > 0 ? userMessage.trim() : null
      };

      const { error } = await supabaseClient
        .from('responses')
        .insert([payload]);

      if (error) throw error;

      showConfirmation(choice);
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Could not save your choice. Please try again.');
      isSubmitting = false;
      buttons.forEach(b => (b.disabled = false));
      if (submitNoteBtn) submitNoteBtn.disabled = false;
      if (skipNoteBtn) skipNoteBtn.disabled = false;
    }
  }

  buttons.forEach(button => {
    button.addEventListener('click', (e) => {
      const choice = button.getAttribute('data-choice');
      if (!choice || isSubmitting) return;

      if (choice === 'yes') {
        if (typeof launchHeartConfetti === 'function') {
          launchHeartConfetti(e.clientX, e.clientY);
        }
        // ONLY reveal note box. DO NOT save to database yet!
        buttonGroup.classList.add('hidden');
        if (noteSection) {
          noteSection.classList.remove('hidden');
        } else {
          submitFinalResponse('yes', null);
        }
      } else {
        // For Maybe or No, save immediately
        buttons.forEach(b => (b.disabled = true));
        submitFinalResponse(choice, null);
      }
    });
  });

  // Tap Send Note -> Creates the single 'yes' entry with the note
  if (submitNoteBtn) {
    submitNoteBtn.addEventListener('click', () => {
      submitNoteBtn.disabled = true;
      skipNoteBtn.disabled = true;
      submitFinalResponse('yes', noteInput.value);
    });
  }

  // Tap Skip -> Creates the single 'yes' entry with no note
  if (skipNoteBtn) {
    skipNoteBtn.addEventListener('click', () => {
      submitNoteBtn.disabled = true;
      skipNoteBtn.disabled = true;
      submitFinalResponse('yes', null);
    });
  }
});
