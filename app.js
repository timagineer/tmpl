/**
 * <progress-bar>
 *
 * Attributes:
 *   value  - current progress value (default: 0)
 *   max    - maximum value (default: 100)
 *   label  - accessible label for screen readers (default: "Progress")
 *
 * CSS custom properties (inherited from parent/root):
 *   --progress-track  - track background color
 *   --radius   - track border-radius
 *   --space-30 - track block-size
 *   --blue-4 - fill color
 *
 * Usage:
 *   <progress-bar value="35" max="100" label="Form completion"></progress-bar>
 *
 * Update:
 *   document.querySelector('progress-bar').setAttribute('value', '50');
 */
customElements.define('progress-bar', class extends HTMLElement {
    static observedAttributes = ['value', 'max', 'label'];

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                .track {
                    background: var(--progress-track);
                    border-radius: var(--radius);
                    block-size: var(--space-30);
                    overflow: hidden;
                }
                .fill {
                    background: var(--progress-fill);
                    block-size: 100%;
                    min-inline-size: 1%;
                    inline-size: 0%;
                    transition: inline-size var(--duration-slow) var(--ease-out-quad);
                }
            </style>
            <div class="track" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" aria-label="">
                <div class="fill"></div>
            </div>
        `;
    }

    connectedCallback() { this.#update(); }
    attributeChangedCallback() { this.#update(); }

    #update() {
        const value = Number(this.getAttribute('value')) || 0;
        const max = Number(this.getAttribute('max')) || 100;
        const pct = Math.min(100, Math.max(0, (value / max) * 100));
        const track = this.shadowRoot.querySelector('.track');
        const fill = this.shadowRoot.querySelector('.fill');
        track.setAttribute('aria-valuenow', value);
        track.setAttribute('aria-valuemax', max);
        track.setAttribute('aria-label', this.getAttribute('label') || 'Progress');
        fill.style.inlineSize = pct + '%';
    }
});

// Numeric-only input filtering
document.querySelectorAll('input[inputmode="numeric"], input[inputmode="tel"]').forEach(input => {
    input.addEventListener('input', () => {
        input.value = input.value.replace(/[^0-9\-\+\(\)\s]/g, '');
    });
});

function menu() {
    const btn = document.getElementById("main-menu");
    btn.setAttribute("aria-expanded", btn.getAttribute("aria-expanded") === "true" ? "false" : "true");
}

// Validation
function validate() {
    let valid = true;

    // Radio/checkbox groups
    document.querySelectorAll('[role="radiogroup"][aria-required="true"]').forEach(group => {
        const err = group.querySelector('.error-message') || document.getElementById(group.getAttribute('aria-describedby'));
        const tableErr = group.closest('.radio-table')?.querySelector('.error-message');
        if (!group.querySelector('input[type=radio]:checked')) {
            if (err) err.hidden = false;
            if (tableErr) tableErr.hidden = false;
            valid = false;
        } else {
            if (err) err.hidden = true;
        }
    });

    document.querySelectorAll('[role="group"][aria-required="true"]').forEach(group => {
        const err = group.querySelector('.error-message');
        if (!group.querySelector('input[type=checkbox]:checked')) {
            if (err) err.hidden = false;
            valid = false;
        } else {
            if (err) err.hidden = true;
        }
    });

    // Text inputs, selects, textareas
    document.querySelectorAll('input[aria-required="true"], select[aria-required="true"], textarea[aria-required="true"]').forEach(input => {
        const field = input.closest('.field');
        const err = field?.querySelector('.error-message');
        const hint = field?.querySelector('.hint');
        if (!input.value.trim()) {
            input.classList.add('error');
            input.setAttribute('aria-invalid', 'true');
            if (err) err.hidden = false;
            if (hint) hint.hidden = true;
            valid = false;
        } else {
            input.classList.remove('error');
            input.setAttribute('aria-invalid', 'false');
            if (err) err.hidden = true;
            if (hint) hint.hidden = false;
        }
    });

    if (!valid) {
        const firstErr = document.querySelector('.error-message:not([hidden]), .error');
        firstErr?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return valid;
}

// Intercept Next link — validate before navigating
document.querySelector('footer .btn:last-child')?.addEventListener('click', (e) => {
    const link = e.currentTarget;
    if (link.textContent.trim() === 'Begin') return; // start page, no validation
    if (!validate()) {
        e.preventDefault();
    }
});

// Clear error on input
document.querySelectorAll('input[aria-required="true"], select[aria-required="true"], textarea[aria-required="true"]').forEach(input => {
    input.addEventListener('input', () => {
        if (input.value.trim()) {
            const field = input.closest('.field');
            const err = field?.querySelector('.error-message');
            const hint = field?.querySelector('.hint');
            input.classList.remove('error');
            input.setAttribute('aria-invalid', 'false');
            if (err) err.hidden = true;
            if (hint) hint.hidden = false;
        }
    });
    input.addEventListener('change', () => {
        if (input.value.trim()) {
            const field = input.closest('.field');
            const err = field?.querySelector('.error-message');
            const hint = field?.querySelector('.hint');
            input.classList.remove('error');
            input.setAttribute('aria-invalid', 'false');
            if (err) err.hidden = true;
            if (hint) hint.hidden = false;
        }
    });
});

// Clear radio/checkbox group errors on selection
document.querySelectorAll('input[type=radio], input[type=checkbox]').forEach(input => {
    input.addEventListener('change', () => {
        const group = input.closest('[role="radiogroup"], [role="group"]');
        if (group) {
            const err = group.querySelector('.error-message') || document.getElementById(group.getAttribute('aria-describedby'));
            if (err) err.hidden = true;
        }
        // Clear radio-table error when all rows answered
        const table = input.closest('.radio-table');
        if (table) {
            const allAnswered = [...table.querySelectorAll('[role="radiogroup"][aria-required="true"]')]
                .every(row => row.querySelector('input[type=radio]:checked'));
            if (allAnswered) {
                const tableErr = table.querySelector('.error-message');
                if (tableErr) tableErr.hidden = true;
            }
        }
    });
});

// Promote Next to primary when all required fields are filled
function checkFormComplete() {
    const nextBtn = document.querySelector('footer .btn:last-child');
    if (!nextBtn || nextBtn.textContent.trim() === 'Begin') return;

    const requiredInputs = document.querySelectorAll('input[aria-required="true"], select[aria-required="true"], textarea[aria-required="true"]');
    const radioGroups = document.querySelectorAll('[role="radiogroup"][aria-required="true"]');
    const checkboxGroups = document.querySelectorAll('[role="group"][aria-required="true"]');

    let allFilled = true;

    requiredInputs.forEach(input => {
        if (!input.value.trim()) allFilled = false;
    });

    radioGroups.forEach(group => {
        if (!group.querySelector('input[type=radio]:checked')) allFilled = false;
    });

    checkboxGroups.forEach(group => {
        if (!group.querySelector('input[type=checkbox]:checked')) allFilled = false;
    });

    nextBtn.classList.toggle('primary', allFilled);
}

document.querySelectorAll('[aria-required="true"]').forEach(input => {
    input.addEventListener('input', checkFormComplete);
    input.addEventListener('change', checkFormComplete);
});

document.querySelectorAll('input[type=radio], input[type=checkbox]').forEach(input => {
    input.addEventListener('change', checkFormComplete);
});

checkFormComplete();

function save() {
    location.assign('index.html');
}

// Auto-advance switch (index page)
const autoAdvanceToggle = document.getElementById('auto-advance');
if (autoAdvanceToggle) {
    autoAdvanceToggle.checked = localStorage.getItem('autoAdvance') !== 'false';
    autoAdvanceToggle.addEventListener('change', () => {
        localStorage.setItem('autoAdvance', autoAdvanceToggle.checked);
    });
}

// Auto-advance on radio pages (only single-question pages)
if (localStorage.getItem('autoAdvance') !== 'false') {
    const radioGroups = document.querySelectorAll('[role="radiogroup"]');
    if (radioGroups.length === 1) {
        radioGroups[0].querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', () => {
                const nextLink = document.querySelector('footer a.btn:last-child');
                if (nextLink && nextLink.textContent.trim() === 'Next') {
                    setTimeout(() => nextLink.click(), 540);
                }
            });
        });
    }
}

// ── Form data persistence (sessionStorage) ──────────────────
const STORAGE_KEY = 'socialHistory';

function getFormData() {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
}

function saveField(name, value) {
    const data = getFormData();
    data[name] = value;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    updateProgress();
}

// Save on input/change for all named fields
document.querySelectorAll('input[name], select[name], textarea[name]').forEach(field => {
    const events = field.type === 'radio' || field.type === 'checkbox' || field.tagName === 'SELECT' ? ['change'] : ['input'];
    events.forEach(evt => {
        field.addEventListener(evt, () => {
            if (field.type === 'radio') {
                saveField(field.name, field.value);
            } else if (field.type === 'checkbox') {
                const checked = [...document.querySelectorAll(`input[name="${field.name}"]:checked`)].map(c => c.value);
                saveField(field.name, checked);
            } else {
                saveField(field.name, field.value);
            }
        });
    });
});

// Restore saved values on page load
function restoreForm() {
    const data = getFormData();
    Object.entries(data).forEach(([name, value]) => {
        const fields = document.querySelectorAll(`[name="${name}"]`);
        if (!fields.length) return;
        const first = fields[0];
        if (first.type === 'radio') {
            const target = document.querySelector(`[name="${name}"][value="${value}"]`);
            if (target) target.checked = true;
        } else if (first.type === 'checkbox') {
            fields.forEach(f => { f.checked = Array.isArray(value) && value.includes(f.value); });
        } else {
            first.value = value;
        }
    });
}

restoreForm();
checkFormComplete();

// ── Progress calculation ────────────────────────────────────
const REQUIRED_FIELDS = {
    firstName: 'text', lastName: 'text', dob: 'text', email: 'text', phone: 'text', state: 'text', address: 'text', zip: 'text',
    q: 'radio',
    childhood: 'checkbox',
    'bio-mother': 'radio', 'bio-father': 'radio', 'adopt-mother': 'radio', 'adopt-father': 'radio',
    'stepmother': 'radio', 'stepfather': 'radio', 'brothers': 'radio', 'sisters': 'radio',
    otherPresent: 'radio', relationship: 'radio',
    medications: 'checkbox', pharmacy: 'text',
    signature: 'text', typedName: 'text', consent: 'checkbox'
};

const TOTAL_REQUIRED = Object.keys(REQUIRED_FIELDS).length; // 25

function calcProgress() {
    const data = getFormData();
    let answered = 0;
    Object.entries(REQUIRED_FIELDS).forEach(([name, type]) => {
        const val = data[name];
        if (!val) return;
        if (type === 'checkbox') {
            if (Array.isArray(val) && val.length > 0) answered++;
        } else if (typeof val === 'string' && val.trim()) {
            answered++;
        }
    });
    if (answered === 0) return 0;
    // Cap at 95% — 100% only after submit/finish
    return Math.round(5 + (answered / TOTAL_REQUIRED) * 90);
}

function updateProgress() {
    const bar = document.querySelector('.cover > progress-bar');
    if (bar && !document.querySelector('.form-card-grid')) {
        const progress = calcProgress();
        bar.setAttribute('value', Math.max(5, progress));
    }
}

updateProgress();

// ── Index page: update Social History card progress ─────────
if (document.querySelector('.form-card-grid')) {
    const complete = sessionStorage.getItem('socialHistoryComplete') === 'true';
    const progress = complete ? 100 : calcProgress();
    const cards = document.querySelectorAll('.form-card');
    const socialCard = cards[3];
    if (socialCard) {
        const bar = socialCard.querySelector('progress-bar');
        const btn = socialCard.querySelector('.btn');
        if (progress > 0 && bar) bar.setAttribute('value', progress);
        if (btn) {
            if (complete) btn.textContent = 'Review ›';
            else if (progress > 0) btn.textContent = 'Resume ›';
        }
    }
}

// ── Force repaint on slider thumbs when color scheme changes (WebKit bug) ───
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    document.querySelectorAll('input[type=range]').forEach(el => {
        el.style.display = 'none';
        el.offsetHeight;
        el.style.display = '';
    });
});
