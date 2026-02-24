// ... keep previous loadHistory

async function loadHistory() {
  const p = await Profile.get();
  historyEl.innerHTML = p.history.map((h,i) => `
    <div class="history-item">
      ${new Date(h.timestamp).toLocaleString()} — ${h.text}<br>
      <div class="stars" data-index="${i}">
        ${[1,2,3,4,5].map(s => `<span data-star="${s}">${h.rating && h.rating >= s ? '★' : '☆'}</span>`).join('')}
      </div>
    </div>
  `).join('') || '<p>No history yet</p>';

  document.querySelectorAll('.stars span').forEach(star => {
    star.addEventListener('click', async e => {
      const idx = e.target.parentElement.dataset.index;
      const rating = +e.target.dataset.star;
      p.history[idx].rating = rating;
      await Profile.save(p);
      loadHistory();
    });
  });
}
loadHistory();
