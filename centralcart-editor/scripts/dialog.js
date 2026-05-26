class Dialog {
  constructor() {
    this.activeDialogs = new Set();
    this.init();
  }

  init() {
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('dialog-overlay')) {
        const dialogId = e.target.id.replace('dialog-overlay-', '');
        this.closeDialog(dialogId);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeDialogs.size > 0) {
        const lastDialog = Array.from(this.activeDialogs).pop();
        this.closeDialog(lastDialog);
      }
    });

    document.querySelectorAll('.dialog').forEach((element) => {
      element.addEventListener('click', (event) => {
        if (event.target === element) this.closeDialog(element.id.split('dialog-')[1]);
      });
    });
  }

  openDialog(dialogId) {
    const element = document.getElementById(`dialog-${dialogId}`);
    if (!element) return;

    if (this.activeDialogs.size === 0) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
      document.body.classList.add('dialog-open');
    }

    element.style.display = 'flex';
    element.setAttribute('data-state', 'open');
    this.activeDialogs.add(dialogId);
  }

  closeDialog(dialogId) {
    const element = document.getElementById(`dialog-${dialogId}`);
    if (!element) return;

    element.setAttribute('data-state', 'closed');
    setTimeout(() => {
      element.style.display = 'none';
    }, 200);

    this.activeDialogs.delete(dialogId);

    if (this.activeDialogs.size === 0) {
      document.body.classList.remove('dialog-open');
      if (!document.body.classList.contains('cart-open')) {
        document.documentElement.style.removeProperty('--scrollbar-width');
      }
    }
  }
}

const dialog = new Dialog();

function openDialog(dialogId) {
  dialog.openDialog(dialogId);

  if (typeof preparePackageDialog === 'function') {
    preparePackageDialog({ dialogId });
  }
}

function closeDialog(dialogId) {
  dialog.closeDialog(dialogId);
}
