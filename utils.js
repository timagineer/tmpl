const yr = document.querySelector('footer time');
if (yr) yr.textContent = new Date().getFullYear().toString().slice(-2);