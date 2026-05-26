const base_url = window.location.origin;
const old_texts = [];

function Spinner({ size = 5 }) {
  return `
  <svg aria-hidden="true" id="spinner" class="size-${size} text-white/30 animate-spin fill-white" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
      <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
  </svg>
  `;
}

function useTyping(inputElement, { onStart, onStop, delay = 600 }) {
  let typingTimer;
  let isTyping = false;

  const handleInput = () => {
    const value = inputElement.value;

    if (!isTyping) {
      isTyping = true;
      onStart?.(value);
    }

    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      isTyping = false;
      onStop?.(value);
    }, delay);
  };

  inputElement.addEventListener('input', handleInput);

  return () => {
    inputElement.removeEventListener('input', handleInput);
    clearTimeout(typingTimer);
  };
}

function callNotification(content, status) {
  const html = `
<div class="flex items-center gap-2">
  ${
    status === 'error'
      ? '<i data-lucide="circle-x" class="text-red-500 me-0.5 min-size-4 inline"></i>'
      : '<i data-lucide="circle-check" class="text-green-500 me-0.5 min-size-4 inline"></i>'
  }
  <p class="text-sm">${content}</p>
</div>
`;

  Toastify({
    style: {
      background: `rgb(var(--background))`,
      border: 'solid 1px rgb(var(--border))',
      borderRadius: '8px',
      boxShadow: 'none',
      maxWidth: '520px',
      minWidth: '310px',
      width: 'fit-content',
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 12px',
    },
    escapeMarkup: false,
    text: html,
    duration: 3000,
    close: true,
    gravity: 'top',
    position: 'right',
  }).showToast();

  lucide.createIcons();
}

const toast = {
  success: function (content) {
    callNotification(content, 'success');
  },
  error: function (content) {
    callNotification(content, 'error');
  },
};

function escapeServerIpHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => (
    {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }[char]
  ));
}

function copyTextToClipboard(value) {
  const text = String(value ?? '');

  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise((resolve, reject) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      copied ? resolve() : reject(new Error('copy failed'));
    } catch (error) {
      document.body.removeChild(textarea);
      reject(error);
    }
  });
}

function getServerIpDialog() {
  let dialog = document.getElementById('server-ip-dialog');
  if (dialog) return dialog;

  dialog = document.createElement('div');
  dialog.id = 'server-ip-dialog';
  dialog.className = 'server-ip-overlay hidden';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'server-ip-dialog-title');
  dialog.style.setProperty('position', 'fixed', 'important');
  dialog.style.setProperty('inset', '0', 'important');
  dialog.style.setProperty('z-index', '2147483000', 'important');
  dialog.style.setProperty('align-items', 'center', 'important');
  dialog.style.setProperty('justify-content', 'center', 'important');
  dialog.style.setProperty('width', '100vw', 'important');
  dialog.style.setProperty('height', '100dvh', 'important');

  dialog.addEventListener('click', (event) => {
    if (
      event.target === dialog ||
      event.target.closest('[data-server-ip-close]')
    ) {
      closeServerIpDialog();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !dialog.classList.contains('hidden')) {
      closeServerIpDialog();
    }
  });

  document.body.appendChild(dialog);
  return dialog;
}

function closeServerIpDialog() {
  const dialog = document.getElementById('server-ip-dialog');
  if (!dialog) return;
  if (dialog.classList.contains('hidden')) return;
  if (dialog.dataset.state === 'closing') return;

  dialog.dataset.state = 'closing';

  const finishClose = () => {
    if (dialog.dataset.state !== 'closing') return;

    dialog.classList.add('hidden');
    dialog.dataset.state = 'closed';
    dialog.style.removeProperty('display');
  };

  const modal = dialog.querySelector('.server-ip-modal');
  window.clearTimeout(dialog.__closeTimer);
  modal?.addEventListener('animationend', finishClose, { once: true });
  dialog.__closeTimer = window.setTimeout(finishClose, 320);
}

function openServerIpDialog(javaIp = '', bedrockIp = '') {
  const javaAddress = String(javaIp || '').trim();
  const bedrockAddress = String(bedrockIp || javaAddress).trim();
  if (!javaAddress && !bedrockAddress) return;

  const options = [
    {
      label: 'Java',
      description: 'Minecraft Java Edition',
      value: javaAddress || bedrockAddress,
    },
    {
      label: 'Bedrock',
      description: 'Console, celular e Windows',
      value: bedrockAddress || javaAddress,
    },
  ];

  const dialog = getServerIpDialog();
  const scrollX = window.scrollX || window.pageXOffset || 0;
  const scrollY = window.scrollY || window.pageYOffset || 0;
  window.clearTimeout(dialog.__closeTimer);
  document.body.classList.remove('server-ip-modal-open');

  dialog.innerHTML = `
    <div class="server-ip-modal">
      <button type="button" class="server-ip-close" data-server-ip-close aria-label="Fechar">
        <i data-lucide="x" class="size-4"></i>
      </button>
      <p class="server-ip-kicker">Coxinha SMP</p>
      <h2 class="server-ip-title" id="server-ip-dialog-title">Copiar IP do servidor</h2>
      <div class="server-ip-options">
        ${options
          .map((option) => `
            <button type="button" class="server-ip-copy-option" data-server-ip-copy data-server-ip-label="${escapeServerIpHTML(option.label)}" data-server-ip-value="${escapeServerIpHTML(option.value)}">
              <span>
                <strong>${escapeServerIpHTML(option.label)}</strong>
                <small>${escapeServerIpHTML(option.description)}</small>
              </span>
              <code>${escapeServerIpHTML(option.value)}</code>
              <span class="server-ip-copy-icon" aria-hidden="true">
                <i data-lucide="copy" class="size-4"></i>
              </span>
            </button>
          `)
          .join('')}
      </div>
    </div>
  `;

  dialog.querySelectorAll('[data-server-ip-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const value = button.getAttribute('data-server-ip-value') || '';
      const label = button.getAttribute('data-server-ip-label') || 'IP';
      if (!value) return;

      try {
        await copyTextToClipboard(value);
        button.setAttribute('data-copied', 'true');
        toast.success(`IP ${label} copiado.`);

        setTimeout(() => {
          button.removeAttribute('data-copied');
        }, 1400);
      } catch (error) {
        console.error(error);
        toast.error('Nao foi possivel copiar o IP.');
      }
    });
  });

  dialog.dataset.state = 'open';
  dialog.style.setProperty('display', 'flex', 'important');
  dialog.classList.remove('hidden');

  requestAnimationFrame(() => {
    try {
      window.scrollTo(scrollX, scrollY);
    } catch (_) {}
  });

  if (window.lucide) {
    lucide.createIcons();
  }

  window.setTimeout(() => {
    try {
      window.scrollTo(scrollX, scrollY);
    } catch (_) {}
  }, 80);
}

function getScriptData(id, fallback = []) {
  try {
    const element = document.getElementById(id);
    return JSON.parse(element?.textContent || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function toggleMobileSearch() {
  const container = document.getElementById('mobile-search-container');
  if (!container) return;
  container.classList.toggle('hidden');

  if (!container.classList.contains('hidden')) {
    const input = document.getElementById('search-bar-mobile');
    if (input) input.focus();
  } else {
    const result = document.getElementById('search-result-mobile');
    if (result) result.classList.add('hidden');
  }
}

function handleSearch(inputSelector, resultSelector) {
  const inputElement = document.querySelector(inputSelector);
  const resultElement = document.querySelector(resultSelector);

  if (!inputElement || !resultElement) return;

  inputElement.addEventListener('click', () => {
    if (
      inputElement.value.trim() &&
      resultElement.children.length &&
      !resultElement.innerHTML.includes('flex items-center justify-center')
    ) {
      resultElement.classList.remove('hidden');
    }
  });

  inputElement.addEventListener('focus', () => {
    if (
      inputElement.value.trim() &&
      resultElement.children.length &&
      !resultElement.innerHTML.includes('flex items-center justify-center')
    ) {
      resultElement.classList.remove('hidden');
    }
  });

  useTyping(inputElement, {
    onStart: () => {
      resultElement.innerHTML = `<div class="p-3 flex items-center justify-center">${Spinner({
        size: 10,
      })}</div>`;
      resultElement.classList.remove('hidden');
    },
    onStop: async (content) => {
      if (!content) {
        resultElement.classList.add('hidden');
        return;
      }

      try {
        const response = await fetch(
          `${base_url}/search?q=${encodeURIComponent(
            content
          )}&page=1&limit=10&bar=true&include_variations=true&load_parent=true`
        );
        const data = await response.text();
        resultElement.innerHTML = CentralCart.sanitizeHTML(data);
        resultElement.classList.remove('hidden');

        if (typeof publishEvent === 'function') {
          publishEvent('search', { search: content });
        }
      } catch (error) {
        resultElement.innerHTML = '<div class="p-2 text-red-500">Erro ao buscar</div>';
        resultElement.classList.remove('hidden');
      }
    },
  });

  document.addEventListener('click', (e) => {
    if (!inputElement.contains(e.target) && !resultElement.contains(e.target)) {
      resultElement.classList.add('hidden');
    }
  });
}

function initRevealObserver() {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  document.querySelectorAll('.reveal-fade-up').forEach((el) => {
    revealObserver.observe(el);
  });
}

function initPageEntranceMotion() {
  if (window.__coxinhaPageEntranceMotionInit) return;
  window.__coxinhaPageEntranceMotionInit = true;

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mediaQuery.matches) return;

  const groups = [
    { selector: '.rank-banner', step: 0, style: 'hero', scale: 0.9 },
    { selector: '.rank-brand-logo', step: 1, style: 'hero', scale: 0.62 },
    { selector: '.brand-pill', step: 2, style: 'hero', scale: 0.7 },
    { selector: '.rank-render', step: 2, style: 'art', scale: 0.68 },
    { selector: '.mobile-store-header', step: 1, style: 'hero', scale: 0.82 },
    { selector: '.category-sidebar', step: 3, style: 'nav', scale: 0.86 },
    { selector: '.category-section-heading', step: 5, style: 'section', scale: 0.84 },
    { selector: '.product-card', step: 6, style: 'card', scale: 0.72, stagger: 42, limit: 24 },
    { selector: '.faq-item', step: 6, style: 'card', scale: 0.78, stagger: 48, limit: 16 },
    { selector: '.coxinha-content-panel, .coxinha-empty-state', step: 5, style: 'section', scale: 0.84 },
    { selector: '.coxinha-footer-stage > *', step: 7, style: 'section', scale: 0.86, stagger: 45 },
  ];

  const animated = new Set();
  groups.forEach((group) => {
    const nodes = Array.from(document.querySelectorAll(group.selector));
    const limitedNodes = typeof group.limit === 'number' ? nodes.slice(0, group.limit) : nodes;

    limitedNodes.forEach((node, index) => {
      if (!(node instanceof HTMLElement) || animated.has(node)) return;
      animated.add(node);
      const delay = (group.step * 62) + (index * (group.stagger || 34));
      node.classList.add('page-enter');
      if (group.style) {
        node.setAttribute('data-enter-style', group.style);
      }
      node.style.setProperty('--enter-delay', `${Math.min(delay, 1050)}ms`);
      node.style.setProperty('--enter-start-scale', String(group.scale || 0.82));
      node.addEventListener('animationend', () => {
        node.classList.remove('page-enter');
        node.removeAttribute('data-enter-style');
        node.style.removeProperty('--enter-delay');
        node.style.removeProperty('--enter-start-scale');
      }, { once: true });
    });
  });

  if (animated.size === 0) return;

  document.documentElement.classList.remove('page-motion-prep');
}

async function loadCategory(categoryId, element, currentPackage = null) {
  const url = currentPackage
    ? `/search?category_id=${categoryId}&current_package=${currentPackage}&limit=10`
    : `/search?category_id=${categoryId}&package_list=true&limit=1000`;

  const content = await fetch(url).then((res) => res.text());

  element.innerHTML = CentralCart.sanitizeHTML(content);

  if (window.lucide) lucide.createIcons();

  const similarSlider = document.getElementById('similar-packages-slider');
  if (currentPackage && similarSlider) {
    const slider = new KeenSlider(similarSlider, {
      slides: {
        perView: 5,
        spacing: 8,
      },
      breakpoints: {
        '(max-width: 1024px)': {
          slides: {
            perView: 2,
            spacing: 4,
          },
        },
      },
    });

    document.getElementById('similar-slider-prev')?.addEventListener('click', () => slider.prev());
    document.getElementById('similar-slider-next')?.addEventListener('click', () => slider.next());
  }

  initRevealObserver();
}

(() => {
  initPageEntranceMotion();
  initRevealObserver();

  document.querySelectorAll('.package-list').forEach((element) => {
    new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadCategory(
              entry.target.dataset.categoryId,
              element,
              entry.target.dataset.currentPackage
            );
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '0px 0px 0px 0px',
        threshold: 0.1,
      }
    ).observe(element);
  });
})();

(() => {
  handleSearch('#search-bar', '#search-result');
  handleSearch('#search-bar-mobile', '#search-result-mobile');
})();

(() => {
  const licenseContainers = document.querySelectorAll('.license-key[data-license-raw]');

  licenseContainers.forEach((container) => {
    const raw = container.getAttribute('data-license-raw') || '';
    const formatted = container.getAttribute('data-license-formatted') || null;

    const valueToProcess = formatted || raw;

    let parsed;

    try {
      parsed = JSON.parse(valueToProcess);
    } catch {
      const row = container.parentElement;
      if (!row) return;

      if (row.querySelector('[data-action="copy"]')) return;

      row.classList.add('flex', 'items-center', 'justify-between', 'gap-1');

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'text-xs group';
      copyBtn.setAttribute('data-action', 'copy');
      copyBtn.setAttribute('data-content', raw);
      copyBtn.setAttribute('data-is-copied', 'false');
      copyBtn.innerHTML = `
        <i data-lucide="check" class="size-3.5 hidden group-data-[is-copied=true]:block"></i>
        <i data-lucide="copy" class="size-3.5 hidden group-data-[is-copied=false]:block"></i>
      `;

      row.appendChild(copyBtn);

      if (window.lucide) {
        lucide.createIcons();
      }

      return;
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      const row = container.parentElement;
      if (!row) return;

      if (row.querySelector('[data-action="copy"]')) return;

      row.classList.add('flex', 'items-center', 'justify-between', 'gap-1');

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'text-xs group';
      copyBtn.setAttribute('data-action', 'copy');
      copyBtn.setAttribute('data-content', raw);
      copyBtn.setAttribute('data-is-copied', 'false');
      copyBtn.innerHTML = `
        <i data-lucide="check" class="size-3.5 hidden group-data-[is-copied=true]:block"></i>
        <i data-lucide="copy" class="size-3.5 hidden group-data-[is-copied=false]:block"></i>
      `;

      row.appendChild(copyBtn);

      if (window.lucide) {
        lucide.createIcons();
      }

      return;
    }

    container.innerHTML = '';
    container.classList.add('space-y-2');

    Object.entries(parsed).forEach(([label, value]) => {
      const row = document.createElement('div');
      row.className = 'space-y-1';

      const labelEl = document.createElement('span');
      labelEl.className = 'text-sm font-medium text-muted-foreground';
      labelEl.textContent = String(label);

      const field = document.createElement('div');
      field.className =
        'w-full min-h-9 px-3 py-2 rounded-md border bg-background flex items-center justify-between gap-2';

      const valueEl = document.createElement('span');
      valueEl.className = 'break-all line-clamp-3 flex-1';
      valueEl.textContent = String(value ?? '');

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'group flex-shrink-0';
      copyBtn.setAttribute('data-action', 'copy');
      copyBtn.setAttribute('data-content', String(value ?? ''));
      copyBtn.setAttribute('data-is-copied', 'false');
      copyBtn.innerHTML = `
        <i data-lucide="check" class="size-3.5 hidden group-data-[is-copied=true]:block"></i>
        <i data-lucide="copy" class="size-3.5 hidden group-data-[is-copied=false]:block"></i>
      `;

      field.appendChild(valueEl);
      field.appendChild(copyBtn);

      row.appendChild(labelEl);
      row.appendChild(field);

      container.appendChild(row);
    });

    if (window.lucide) {
      lucide.createIcons();
    }
  });
})();

document.querySelectorAll('[data-action=copy]').forEach((element) => {
  const content = element.getAttribute('data-content');

  element.addEventListener('click', () => {
    window.navigator.clipboard.writeText(content);
    element.disabled = true;
    element.setAttribute('data-is-copied', 'true');

    setTimeout(() => {
      element.disabled = false;
      element.setAttribute('data-is-copied', 'false');
    }, 1500);

    toast.success('Conteúdo copiado com sucesso.');
  });
});

document.querySelectorAll('[data-action="copy-all-keys"]').forEach((button) => {
  button.addEventListener('click', () => {
    const licenseGroup = button.closest('[data-license-group]');
    if (!licenseGroup) return;

    const licenseKeys = Array.from(licenseGroup.querySelectorAll('.license-key[data-license-raw]'))
      .map((el) => el.getAttribute('data-license-raw') || '')
      .filter((key) => key);

    if (licenseKeys.length === 0) {
      toast.error('Nenhuma chave encontrada para copiar.');
      return;
    }

    const keysText = licenseKeys.join('\n');
    navigator.clipboard
      .writeText(keysText)
      .then(() => {
        button.disabled = true;
        button.setAttribute('data-is-copied', 'true');

        setTimeout(() => {
          button.disabled = false;
          button.setAttribute('data-is-copied', 'false');
        }, 2000);

        toast.success(`${licenseKeys.length} chave(s) copiada(s) com sucesso.`);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Erro ao copiar as chaves.');
      });
  });
});

document.querySelectorAll('[data-action="download-keys"]').forEach((button) => {
  button.addEventListener('click', () => {
    const licenseGroup = button.closest('[data-license-group]');
    if (!licenseGroup) return;

    const licenseKeys = Array.from(licenseGroup.querySelectorAll('.license-key[data-license-raw]'))
      .map((el) => el.getAttribute('data-license-raw') || '')
      .filter((key) => key);

    if (licenseKeys.length === 0) {
      toast.error('Nenhuma chave encontrada para baixar.');
      return;
    }

    const packageName = button.getAttribute('data-package-name') || 'Produto';

    const keysText = licenseKeys.join('\n');
    const blob = new Blob([keysText], { type: 'text/plain;charset=utf-8' });

    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `${licenseKeys.length}x - ${packageName}.txt`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    URL.revokeObjectURL(url);

    button.disabled = true;
    button.setAttribute('data-is-downloaded', 'true');

    setTimeout(() => {
      button.disabled = false;
      button.setAttribute('data-is-downloaded', 'false');
    }, 2000);

    toast.success(`${licenseKeys.length} chave(s) baixada(s) com sucesso.`);
  });
});

function toggleMobileCategories() {
  const dropdown = document.getElementById('mobile-categories-dropdown');
  const button = document.getElementById('mobile-category-toggle');
  if (!dropdown || !button) return;
  const isOpen = dropdown.getAttribute('data-state') === 'open';
  const nextState = isOpen ? 'closed' : 'open';
  dropdown.setAttribute('data-state', nextState);
  button.setAttribute('data-state', nextState);
}

function toggleMobileCategoryGroup(categoryId) {
  const subcategories = document.querySelector(`[data-category="${categoryId}"]`);
  if (!subcategories) return;
  const button = subcategories.previousElementSibling;
  const isOpen = subcategories.getAttribute('data-state') === 'open';
  const nextState = isOpen ? 'closed' : 'open';
  subcategories.setAttribute('data-state', nextState);
  if (button) button.setAttribute('data-state', nextState);
}

function closeMobileCategories() {
  const dropdown = document.getElementById('mobile-categories-dropdown');
  const button = document.getElementById('mobile-category-toggle');
  if (dropdown) dropdown.setAttribute('data-state', 'closed');
  if (button) button.setAttribute('data-state', 'closed');
  document
    .querySelectorAll('.mobile-category-group > button')
    .forEach((el) => el.setAttribute('data-state', 'closed'));
  document.querySelectorAll('.mobile-subcategories').forEach((sub) => {
    sub.setAttribute('data-state', 'closed');
  });
}

function toggleCategoryDropdown(catId) {
  const targetDropdown = document.querySelector(`[data-id="${catId}"]`);
  if (!targetDropdown) return;
  const targetButton = targetDropdown.previousElementSibling;
  const isOpen = targetDropdown.getAttribute('data-state') === 'open';
  const nextState = isOpen ? 'closed' : 'open';
  document.querySelectorAll('.cat-dropdown').forEach((el) => {
    if (el.dataset.id !== String(catId)) {
      el.setAttribute('data-state', 'closed');
      const button = el.previousElementSibling;
      if (button) button.setAttribute('data-state', 'closed');
    }
  });
  targetDropdown.setAttribute('data-state', nextState);
  if (targetButton) targetButton.setAttribute('data-state', nextState);
}

document.addEventListener('click', function (e) {
  const mobileToggle = document.getElementById('mobile-category-toggle');
  const mobileDropdown = document.getElementById('mobile-categories-dropdown');
  if (!mobileToggle || !mobileDropdown) return;
  if (!mobileToggle.contains(e.target) && !mobileDropdown.contains(e.target)) {
    window.closeMobileCategories();
  }
});

document.addEventListener('click', function (e) {
  if (!e.target.closest('.sidebar-categories-menu')) {
    document.querySelectorAll('.cat-dropdown').forEach((el) => {
      el.setAttribute('data-state', 'closed');
      const button = el.previousElementSibling;
      if (button) button.setAttribute('data-state', 'closed');
    });
  }
});

function prepareCustomFieldsDialog(packageId, packageName) {
  const dialogId = 'custom-fields';
  const dialogElement = document.getElementById(`dialog-${dialogId}`);
  if (!dialogElement) return null;

  const titleElement = document.getElementById(`dialog-${dialogId}-title`);
  if (titleElement) {
    titleElement.textContent = packageName;
  }

  const fieldsContainer = dialogElement.querySelector('[data-custom-fields-fields]');
  if (!fieldsContainer) return null;

  const fieldsScript = document.querySelector(`[data-package-fields="${packageId}"]`);
  if (fieldsScript) {
    try {
      const fields = JSON.parse(fieldsScript.textContent || '[]');
      if (typeof window.CustomFields?.render === 'function') {
        window.CustomFields.render(fields);
      }
    } catch (e) {
      console.warn('Erro ao parsear campos do pacote:', e);
    }
  }

  return dialogId;
}

function preparePackageDialog({ dialogId }) {
  const normalizedId = dialogId.startsWith('dialog-') ? dialogId : `dialog-${dialogId}`;
  const dialogElement = document.getElementById(normalizedId);
  if (!dialogElement) return;

  const container = dialogElement.querySelector('[data-package-dialog]');
  if (!container) return;

  const hasVariations = container.dataset.hasVariations === 'true';
  if (!hasVariations) return;

  const purchaseButton = container.querySelector('[data-package-card-button]');
  const variationButtons = Array.from(
    container.querySelectorAll('[data-action="select-variation"]')
  );
  const priceEl = container.querySelector('[data-dialog-price]');
  const selectionWarning = container.querySelector('[data-dialog-selection-warning]');
  if (!purchaseButton || variationButtons.length === 0) return;

  const basePriceLabel = (priceEl?.dataset?.basePriceLabel || priceEl?.textContent || '').trim();
  const variationsScript = container.querySelector('[data-package-variations]');
  let variationsList = [];
  if (variationsScript) {
    try {
      variationsList = JSON.parse(variationsScript.textContent || '[]');
    } catch (error) {
      console.warn('Não foi possível ler as variações do pacote:', error);
    }
  }

  if (variationsList.length === 0) return;
  const markSelected = (id) => {
    variationButtons.forEach((el) => {
      const vid = parseInt(el.getAttribute('data-variation-id'));
      const isSel = vid === id;
      el.setAttribute('data-selected', String(isSel));
    });
  };

  const formatPrice = (value) => {
    if (typeof CentralCart?.formatPrice === 'function') {
      return CentralCart.formatPrice(value, store.currency);
    }
    return typeof value === 'number'
      ? value.toLocaleString('pt-BR', { style: 'currency', currency: store.currency || 'BRL' })
      : basePriceLabel;
  };

  let selectedVariation = null;

  const updatePrice = (variation) => {
    if (!priceEl) return;
    if (variation && variation.pricing && typeof variation.pricing.price === 'number') {
      priceEl.textContent = formatPrice(variation.pricing.price);
    } else {
      priceEl.textContent = basePriceLabel;
    }
  };

  const clearSelection = () => {
    selectedVariation = null;
    markSelected(null);
    updatePrice(null);
    if (selectionWarning) selectionWarning.classList.remove('hidden');
    purchaseButton.disabled = true;
    purchaseButton.removeAttribute('data-variation-fields');
    purchaseButton.dispatchEvent(new CustomEvent('package:clear-variation', { bubbles: false }));
  };

  const selectVariation = (variation) => {
    if (!variation) return;
    selectedVariation = variation;
    markSelected(variation.id);
    updatePrice(variation);
    if (selectionWarning) selectionWarning.classList.add('hidden');
    purchaseButton.disabled = !variation.stock?.available;
    const fields = Array.isArray(variation.fields) ? variation.fields : [];
    purchaseButton.setAttribute('data-variation-fields', JSON.stringify(fields));

    const packageId = container.dataset.packageId;
    const fieldsScript = container.querySelector('[data-package-fields]');
    if (fieldsScript && packageId) {
      fieldsScript.textContent = JSON.stringify(fields);
    }

    const customFieldsContainer = container.querySelector('[data-dialog-custom-fields-container]');
    const customFieldsFields = container.querySelector('[data-dialog-custom-fields-fields]');
    const variationFieldsContainer = document.querySelector(
      `[data-variation-fields-container][data-variation-id="${variation.id}"]`
    );

    if (customFieldsContainer && customFieldsFields) {
      if (variationFieldsContainer && fields.length > 0) {
        customFieldsFields.innerHTML = variationFieldsContainer.innerHTML;
        customFieldsContainer.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
        if (typeof window.CustomFields?.afterRender === 'function') {
          window.CustomFields.afterRender(customFieldsFields);
        }
      } else if (fields.length > 0 && typeof window.CustomFields?.render === 'function') {
        window.CustomFields.render(fields);
        customFieldsContainer.classList.remove('hidden');
      } else {
        customFieldsContainer.classList.add('hidden');
        customFieldsFields.innerHTML = '';
      }
    }

    purchaseButton.dispatchEvent(
      new CustomEvent('package:select-variation', { detail: { variation }, bubbles: false })
    );
  };

  variationButtons.forEach((el) => {
    if (el.dataset.dialogVariationReady === 'true') return;
    el.dataset.dialogVariationReady = 'true';
    el.addEventListener('click', () => {
      const vid = parseInt(el.getAttribute('data-variation-id'));
      const v = variationsList.find((x) => x.id === vid);
      if (v) {
        selectVariation(v);
      }
    });
  });

  if (variationsList.length > 0) {
    selectVariation(variationsList[0]);
  } else {
    clearSelection();
  }
}

function withProgrammaticScrollBlocked(callback, duration = 5000) {
  if (typeof window.__coxinhaFreezeScroll === 'function') {
    window.__coxinhaFreezeScroll(duration + 1000);
    return callback();
  }

  const scrollingElement = document.scrollingElement || document.documentElement;
  const startX = window.scrollX || window.pageXOffset || scrollingElement.scrollLeft || 0;
  const startY = window.scrollY || window.pageYOffset || scrollingElement.scrollTop || 0;
  const htmlStyle = document.documentElement.style;
  const bodyStyle = document.body.style;
  const originalScrollTo = window.scrollTo;
  const originalScrollBy = window.scrollBy;
  const originalScrollIntoView = Element.prototype.scrollIntoView;
  const originalFocus = HTMLElement.prototype.focus;
  const originalScrollRestoration = 'scrollRestoration' in history ? history.scrollRestoration : null;
  let active = true;
  let minDurationElapsed = false;
  let waitingForAsyncWork = false;
  let cleanupTimer = null;
  let safetyTimer = null;
  const previous = {
    htmlScrollBehavior: htmlStyle.scrollBehavior,
    bodyScrollBehavior: bodyStyle.scrollBehavior,
    overflowAnchor: htmlStyle.overflowAnchor,
    bodyOverflowAnchor: bodyStyle.overflowAnchor,
    bodyPosition: bodyStyle.position,
    bodyTop: bodyStyle.top,
    bodyLeft: bodyStyle.left,
    bodyRight: bodyStyle.right,
    bodyWidth: bodyStyle.width,
  };

  htmlStyle.scrollBehavior = 'auto';
  bodyStyle.scrollBehavior = 'auto';
  htmlStyle.overflowAnchor = 'none';
  bodyStyle.overflowAnchor = 'none';

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  const restore = () => {
    if (!active) return;
    scrollingElement.scrollLeft = startX;
    scrollingElement.scrollTop = startY;
    document.documentElement.scrollLeft = startX;
    document.documentElement.scrollTop = startY;
    document.body.scrollLeft = startX;
    document.body.scrollTop = startY;
    try {
      originalScrollTo.call(window, startX, startY);
    } catch (_) {}
  };

  const blockScroll = () => {
    restore();
  };

  const cleanup = () => {
    if (!active) return;
    active = false;
    window.removeEventListener('scroll', onScroll, true);
    window.removeEventListener('wheel', releaseForUserScroll, true);
    window.removeEventListener('touchmove', releaseForUserScroll, true);
    window.removeEventListener('keydown', releaseForUserScroll, true);
    clearTimeout(cleanupTimer);
    clearTimeout(safetyTimer);

    try {
      window.scrollTo = originalScrollTo;
      window.scrollBy = originalScrollBy;
      Element.prototype.scrollIntoView = originalScrollIntoView;
      HTMLElement.prototype.focus = originalFocus;
    } catch (_) {}
    if ('scrollRestoration' in history && originalScrollRestoration !== null) {
      history.scrollRestoration = originalScrollRestoration;
    }
    htmlStyle.scrollBehavior = previous.htmlScrollBehavior;
    bodyStyle.scrollBehavior = previous.bodyScrollBehavior;
    htmlStyle.overflowAnchor = previous.overflowAnchor;
    bodyStyle.overflowAnchor = previous.bodyOverflowAnchor;
    bodyStyle.position = previous.bodyPosition;
    bodyStyle.top = previous.bodyTop;
    bodyStyle.left = previous.bodyLeft;
    bodyStyle.right = previous.bodyRight;
    bodyStyle.width = previous.bodyWidth;
    try {
      originalScrollTo.call(window, startX, startY);
    } catch (_) {}
  };

  const maybeCleanup = () => {
    if (!active || !minDurationElapsed || waitingForAsyncWork) return;
    cleanup();
  };

  const releaseForUserScroll = (event) => {
    if (event.type === 'keydown') {
      const scrollKeys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '];
      if (!scrollKeys.includes(event.key)) return;
    }
    cleanup();
  };

  try {
    window.scrollTo = blockScroll;
    window.scrollBy = blockScroll;
    Element.prototype.scrollIntoView = blockScroll;
    HTMLElement.prototype.focus = function focusWithoutScroll(options) {
      const nextOptions = typeof options === 'object' && options !== null ? options : {};
      try {
        return originalFocus.call(this, { ...nextOptions, preventScroll: true });
      } catch (_) {
        return originalFocus.call(this);
      }
    };
  } catch (_) {
    // Some browsers expose these as read-only; direct scroll restoration still runs below.
  }

  const onScroll = () => {
    if (!active) return;
    requestAnimationFrame(restore);
  };

  window.addEventListener('scroll', onScroll, true);
  window.addEventListener('wheel', releaseForUserScroll, { capture: true, passive: true });
  window.addEventListener('touchmove', releaseForUserScroll, { capture: true, passive: true });
  window.addEventListener('keydown', releaseForUserScroll, true);

  let result;
  try {
    result = callback();
    if (result && typeof result.then === 'function') {
      waitingForAsyncWork = true;
      result.then(() => {
        waitingForAsyncWork = false;
        restore();
        maybeCleanup();
      }, () => {
        waitingForAsyncWork = false;
        restore();
        maybeCleanup();
      });
    }
    restore();
  } finally {
    requestAnimationFrame(restore);
    window.setTimeout(restore, 0);
    window.setTimeout(restore, 40);
    window.setTimeout(restore, 140);
    window.setTimeout(restore, 320);
    window.setTimeout(restore, 700);
    window.setTimeout(restore, 1400);
    window.setTimeout(restore, 2400);
    window.setTimeout(restore, 3600);
    cleanupTimer = window.setTimeout(() => {
      minDurationElapsed = true;
      restore();
      maybeCleanup();
    }, duration);
    safetyTimer = window.setTimeout(cleanup, duration + 5000);
  }

  return result;
}

function animateCartDrop(button) {
  const cartTarget = document.querySelector('.cart-navbar .open-cart');
  const sourceRect = button.getBoundingClientRect();
  const targetRect = cartTarget?.getBoundingClientRect();
  const cardImage = button.closest('.product-card')?.querySelector('.product-image-frame img, img');

  const startX = sourceRect.left + sourceRect.width / 2;
  const startY = sourceRect.top + sourceRect.height / 2;
  const endX = targetRect ? targetRect.left + targetRect.width / 2 : window.innerWidth / 2;
  const endY = targetRect
    ? targetRect.top + targetRect.height / 2
    : window.innerHeight - Math.max(34, (window.visualViewport?.offsetTop || 0) + 34);

  const drop = document.createElement('span');
  drop.className = 'cart-drop';
  drop.style.left = `${startX}px`;
  drop.style.top = `${startY}px`;
  drop.style.setProperty('--cart-drop-x', `${endX - startX}px`);
  drop.style.setProperty('--cart-drop-y', `${endY - startY}px`);

  if (cardImage?.src) {
    drop.style.backgroundImage = `url("${cardImage.src}")`;
  }

  document.body.appendChild(drop);

  window.setTimeout(() => {
    drop.remove();
    const navbar = document.querySelector('.coxinha-nav-actions.cart-navbar');
    if (!navbar) return;
    navbar.classList.remove('cart-pulse');
    void navbar.offsetWidth;
    navbar.classList.add('cart-pulse');
  }, 760);
}

function initPackageCardButtons() {
  const buttons = document.querySelectorAll('[data-package-card-button]');
  if (!buttons.length) return;

  buttons.forEach((button) => {
    if (!button || button.dataset.packageCardReady === 'true') return;

    const packageIdAttr = button.getAttribute('data-package-id');
    const parentPackageId = Number(packageIdAttr);
    if (!parentPackageId || Number.isNaN(parentPackageId)) return;

    let currentPackageId = parentPackageId;

    const labelEl = button.querySelector('[data-button-label]');
    const defaultText = button.getAttribute('data-text-default') || 'Comprar';
    const activeText = button.getAttribute('data-text-active') || 'Ver carrinho';
    const outOfStockText = button.getAttribute('data-text-out-of-stock') || 'Sem estoque';
    let stockStatus = button.getAttribute('data-stock');
    const originalStockStatus = stockStatus;
    const dialogId = button.getAttribute('data-dialog-id');
    const buttonContext = button.getAttribute('data-button-context') || 'card';
    const hasVariations = button.getAttribute('data-has-variations') === 'true';
    const requiresVariationSelection = hasVariations && buttonContext === 'dialog';

    if (requiresVariationSelection) {
      button.disabled = true;
    }

    const setState = (state) => {
      button.dataset.state = state;
      if (labelEl)
        labelEl.textContent =
          state === 'active' ? activeText : state === 'out-of-stock' ? outOfStockText : defaultText;
    };

    const syncWithCart = () => {
      try {
        const packages = (() => {
          try {
            if (typeof Cart?.getPackages === 'function') {
              const list = Cart.getPackages();
              if (Array.isArray(list) && list.length > 0) return list;
            }

            const stored = localStorage.getItem('cart') || localStorage.getItem('centralcart_cart');
            if (stored) {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed)) {
                return parsed
                  .map((item) => {
                    if (item?.package) return item.package;
                    return item;
                  })
                  .filter(Boolean);
              }
            }
          } catch (storageError) {
            console.warn('Não foi possível ler o carrinho do localStorage:', storageError);
          }
          return [];
        })();

        const getNumeric = (value) => {
          const n = Number(value);
          return Number.isNaN(n) ? null : n;
        };

        const checkId =
          hasVariations && currentPackageId !== parentPackageId
            ? currentPackageId
            : parentPackageId;

        const inCart =
          Array.isArray(packages) &&
          packages.some((pkg) => {
            const directId = getNumeric(pkg.id ?? pkg.package_id ?? pkg?.package?.id);
            return directId !== null && directId === checkId;
          });

        setState(
          inCart || stockStatus === '0'
            ? 'active'
            : stockStatus === 'false'
            ? 'out-of-stock'
            : 'default'
        );
      } catch (error) {
        console.warn('Não foi possível sincronizar o botão do pacote com o carrinho:', error);
      }
    };

    button.addEventListener('package:select-variation', (event) => {
      const variation = event.detail?.variation;
      if (!variation) return;

      const variationId = Number(variation.id ?? variation.package_id);
      if (!variationId || Number.isNaN(variationId)) return;

      currentPackageId = variationId;
      stockStatus = variation?.stock?.available ? 'true' : 'false';

      button.setAttribute('data-package-id', String(currentPackageId));
      button.setAttribute('data-stock', stockStatus);

      if (stockStatus === 'false') {
        button.disabled = true;
        setState('out-of-stock');
      } else {
        button.disabled = false;
        syncWithCart();
      }
    });

    button.addEventListener('package:clear-variation', () => {
      currentPackageId = parentPackageId;
      stockStatus = originalStockStatus;

      button.setAttribute('data-package-id', String(parentPackageId));
      button.setAttribute('data-stock', stockStatus);

      if (requiresVariationSelection) {
        button.disabled = true;
      } else {
        button.disabled = stockStatus === 'false';
      }

      if (stockStatus === 'false') {
        setState('out-of-stock');
      } else {
        setState('default');
      }
    });

    const handlePackageCardButtonClick = (event = {}) => {
      event.preventDefault?.();
      event.stopPropagation?.();
      event.stopImmediatePropagation?.();

      if (button.dataset.addingToCart === 'true') return;

      if (button.dataset.state === 'active') {
        if (typeof openCart === 'function') {
          withProgrammaticScrollBlocked(() => {
            if (dialogId && typeof closeDialog === 'function') {
              closeDialog(dialogId);
            }
            openCart();
          });
        } else {
          window.location.href = '/checkout';
        }
        return;
      }

      if (hasVariations && buttonContext !== 'dialog') {
        if (dialogId && typeof openDialog === 'function') {
          withProgrammaticScrollBlocked(() => {
            openDialog(dialogId);
            requestAnimationFrame(() => {
              preparePackageDialog({ dialogId });
            });
          });
        }
        return;
      }

      let fields = [];
      const fieldsAttr = button.getAttribute('data-variation-fields');
      if (fieldsAttr) {
        try {
          fields = JSON.parse(fieldsAttr);
        } catch (e) {
          console.warn('Erro ao parsear campos customizados:', e);
        }
      }

      if (!fields || fields.length === 0) {
        // Try to get fields from dialog if buttonContext is 'dialog'
        if (buttonContext === 'dialog') {
          const container = button.closest('[data-package-dialog]');
          if (container) {
            const fieldsScript = container.querySelector('[data-package-fields]');
            if (fieldsScript) {
              try {
                fields = JSON.parse(fieldsScript.textContent || '[]');
              } catch (e) {
                console.warn('Erro ao parsear campos do pacote:', e);
              }
            }
          }
        } else {
          // Try to get fields from script tag in the page (for card context)
          const fieldsScript = document.querySelector(
            `[data-package-fields="${currentPackageId}"]`
          );
          if (fieldsScript) {
            try {
              fields = JSON.parse(fieldsScript.textContent || '[]');
            } catch (e) {
              console.warn('Erro ao parsear campos do pacote:', e);
            }
          }
        }
      }

      if (Array.isArray(fields) && fields.length > 0) {
        let packageName = 'Produto';

        if (buttonContext === 'dialog') {
          const dialogElement = button.closest('[id^="dialog-"]');
          packageName =
            dialogElement?.querySelector('h2')?.textContent ||
            button.closest('[data-package-dialog]')?.querySelector('h2')?.textContent ||
            'Produto';
        } else {
          // For card context, try to get name from the dialog or card
          const dialogElement = document.getElementById(`dialog-${dialogId}`);
          if (dialogElement) {
            const titleEl = dialogElement.querySelector('h2');
            if (titleEl) {
              packageName = titleEl.textContent;
            }
          }
          // If still not found, try to get from the card itself
          if (packageName === 'Produto') {
            const cardElement = button.closest('[class*="package"]');
            if (cardElement) {
              const nameEl = cardElement.querySelector('p.text-2xl');
              if (nameEl) {
                packageName = nameEl.textContent.trim();
              }
            }
          }
        }

        if (dialogId && typeof closeDialog === 'function' && buttonContext === 'dialog') {
          withProgrammaticScrollBlocked(() => {
            closeDialog(dialogId);
          }, 700);
        }

        setTimeout(() => {
          const fieldsScript = document.querySelector(
            `[data-package-fields="${currentPackageId}"]`
          );
          if (fieldsScript) {
            fieldsScript.textContent = JSON.stringify(fields);
          }

          document.dispatchEvent(
            new CustomEvent('package:prepare-custom-fields', {
              detail: { packageId: currentPackageId },
              bubbles: false,
            })
          );

          const customFieldsDialogId = prepareCustomFieldsDialog(currentPackageId, packageName);
          if (!customFieldsDialogId) return;

          const handleAddToCart = (e) => {
            if (e.detail.packageId === currentPackageId) {
              if (typeof addToCart === 'function') {
                withProgrammaticScrollBlocked(() => {
                  const addPromise = addToCart({
                    packageId: currentPackageId,
                    fields: e.detail.fields,
                    openDrawer: false,
                  });
                  setState('active');
                  return addPromise;
                });
              }
              document.removeEventListener('package:add-to-cart-with-fields', handleAddToCart);
            }
          };
          document.addEventListener('package:add-to-cart-with-fields', handleAddToCart);

          if (typeof openDialog === 'function') {
            withProgrammaticScrollBlocked(() => {
              openDialog(customFieldsDialogId);
            }, 700);
          }
        }, 300);
        return;
      }

      if (typeof addToCart !== 'function') return;

      button.dataset.addingToCart = 'true';
      try {
        withProgrammaticScrollBlocked(() => {
          const addPromise = addToCart({ packageId: currentPackageId, fields: {}, openDrawer: false });
          setState('active');
          return addPromise;
        });
      } finally {
        button.dataset.addingToCart = 'false';
      }
    };

    button.__packageCardClickHandler = handlePackageCardButtonClick;
    button.addEventListener('click', handlePackageCardButtonClick, true);

    document.addEventListener('cart:updated', syncWithCart);

    button.dataset.packageCardReady = 'true';
    syncWithCart();
  });
}

function handleCopyIpToClipboard(ip = '', store_type) {
  if (!ip) return;

  const button = document.querySelectorAll('#copy-ip');
  const copyTypes = ['MINECRAFT', 'GTA-SA', 'HYTALE'];

  button.forEach((btn) => {
    old_texts.push(btn.innerHTML);

    if (btn.tagName === 'BUTTON') {
      btn.disabled = true;
    } else {
      btn.innerHTML = copyTypes.includes(store_type) ? 'IP copiado' : 'Redirecionando...';
    }
  });

  if (copyTypes.includes(store_type)) {
    navigator.clipboard.writeText(ip);
    callNotification('IP copiado com sucesso!', 'success');
  } else {
    window.location.href = store_type.toLowerCase() + `://connect/${ip}`;
  }

  setTimeout(() => {
    button.forEach((btn, index) => {
      btn.innerHTML = old_texts[index];
      btn.disabled = false;
    });
  }, 3000);
}

(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const openParam = urlParams.get('open');
  if (openParam !== null) {
    setTimeout(() => {
      openDialog('package-' + openParam);
    }, 300);
  }
})();

// Mobile Drawer Functions
const mobileDrawer = document.getElementById('mobile-drawer');

function toggleMobileMenu() {
  if (!mobileDrawer) return;

  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.setProperty('--scrollbar-width', scrollbarWidth + 'px');
  document.body.classList.add('cart-open');

  mobileDrawer.setAttribute('style', 'display: flex;');
  mobileDrawer.setAttribute('data-state', 'open');

  if (window.lucide) lucide.createIcons();
}

function closeMobileMenu() {
  if (!mobileDrawer) return;

  mobileDrawer.setAttribute('data-state', 'closed');
  document.body.classList.remove('cart-open');
  document.documentElement.style.removeProperty('--scrollbar-width');

  setTimeout(() => {
    mobileDrawer.setAttribute('style', 'display: none;');
  }, 400);
}

if (mobileDrawer) {
  mobileDrawer.addEventListener('click', (event) => {
    if (event.target === mobileDrawer) closeMobileMenu();
  });
}


(() => {
  if (window.__numberOnlyInit) return;
  window.__numberOnlyInit = true;

  document.addEventListener("keypress", function (event) {
    var target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (!target.classList.contains("number-only")) return;
    if (event.key && event.key.length === 1 && !/\d/.test(event.key)) {
      event.preventDefault();
    }
  });

  document.addEventListener("input", function (event) {
    var target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (!target.classList.contains("number-only")) return;
    var original = target.value;
    var clean = original.replace(/\D+/g, "");
    if (clean !== original) {
      var pos = target.selectionStart;
      target.value = clean;
      try {
        var newPos = Math.max(0, (pos || 0) - (original.length - clean.length));
        target.setSelectionRange(newPos, newPos);
      } catch (e) {}
    }
  });
})();
