// Replace with your actual Supabase URL and anon public key
const SUPABASE_URL = 'https://ofixhravfmtuuthpavcw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9maXhocmF2Zm10dXV0aHBhdmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3OTQ2MDEsImV4cCI6MjEwNDM3MDYwMX0.7qYlmuSXOjcZeYgr4COHl0SAucherfxaOjnsmv8Smno';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('#decision-buttons button');
  const buttonGroup = document.getElementById('decision-buttons');
  const confirmationView = document.getElementById('confirmation-view');
  const confirmationMessage = document.getElementById('confirmation-message');

  const messages = {
    yes: 'Thank you for your honesty. I am looking forward to giving this a chance with you 💛',
    maybe: 'Thank you. I would love to continue talking and getting to know each other 🙂',
    no: 'Thank you for being open and honest. Your decision is completely respected 🤍'
  };

  buttons.forEach(button => {
    button.addEventListener('click', async () => {
      const choice = button.getAttribute('data-choice');
      if (!choice) return;

      // Lock buttons while writing to Supabase
      buttons.forEach(b => (b.disabled = true));

      try {
        const { error } = await supabaseClient
          .from('responses')
          .insert([{ choice }]);

        if (!error) {
          buttonGroup.classList.add('hidden');
          confirmationMessage.textContent = messages[choice] || 'Thank you for responding.';
          confirmationView.classList.remove('hidden');
        } else {
          alert('Could not save your choice. Please check your internet connection.');
          buttons.forEach(b => (b.disabled = false));
        }
      } catch (err) {
        alert('Network connection error. Please try again.');
        buttons.forEach(b => (b.disabled = false));
      }
    });
  });
});
