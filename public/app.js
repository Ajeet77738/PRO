document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('#decision-buttons button');
  const buttonGroup = document.getElementById('decision-buttons');
  const confirmationView = document.getElementById('confirmation-view');
  const confirmationMessage = document.getElementById('confirmation-message');

  const messages = {
    yes: 'Thank you for your honest answer 💛',
    maybe: 'Thank you for your honest answer 🙂',
    no: 'Thank you for being honest. Your answer is respected.'
  };

  buttons.forEach(button => {
    button.addEventListener('click', async () => {
      const choice = button.getAttribute('data-choice');
      if (!choice) return;

      buttons.forEach(b => (b.disabled = true));

      try {
        const res = await fetch('/api/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ choice })
        });

        const data = await res.json();
        if (res.ok && data.ok) {
          buttonGroup.classList.add('hidden');
          confirmationMessage.textContent = messages[choice] || 'Thank you for responding.';
          confirmationView.classList.remove('hidden');
        } else {
          alert(data.error || 'Something went wrong. Please try again.');
          buttons.forEach(b => (b.disabled = false));
        }
      } catch (err) {
        alert('Network connection error. Please try again.');
        buttons.forEach(b => (b.disabled = false));
      }
    });
  });
});

