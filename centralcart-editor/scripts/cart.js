let initCalc = false;
let lastCartNavbarCount = null;

const cartDrawer = document.getElementById('cart-drawer');

function openCart() {
  if (document.body.classList.contains('checkout-page')) return;
  if (!cartDrawer) return;

  if (!initCalc) {
    Cart.calculate().then(updateDrawerItems);
    initCalc = true;
  }
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.setProperty('--scrollbar-width', scrollbarWidth + 'px');
  document.body.classList.add('cart-open');

  cartDrawer.setAttribute('style', 'display: flex;');
  cartDrawer.setAttribute('data-state', 'open');
}

function closeCart() {
  if (!cartDrawer) return;

  cartDrawer.setAttribute('data-state', 'closed');
  document.body.classList.remove('cart-open');
  document.documentElement.style.removeProperty('--scrollbar-width');

  setTimeout(() => {
    cartDrawer.setAttribute('style', 'display: none;');
  }, 400);
}

if (cartDrawer) {
  cartDrawer.addEventListener('click', (event) => {
    if (event.target === cartDrawer) closeCart();
  });
}

function addToCart({ packageId, quantity = 1, fields = {}, openDrawer = false }) {
  const cartItems = Cart.get();
  const existingItem = Array.isArray(cartItems)
    ? cartItems.find((item) => item.id === Number(packageId))
    : null;
  let calculationPromise = null;

  Cart.add(packageId, quantity, fields);
  updateCartBadge();

  if (!existingItem) {
    calculationPromise = Cart.calculate().then(() => {
      updateDrawerItems();

      const packageData = Cart.getPackages().find((pkg) => pkg.id === packageId);

      CentralCart.track('add_to_cart', {
        value: Cart.calculateTotal(),
        currency: store.currency,
        transaction_id: packageId,
        contents: [
          { id: packageId, name: packageData.name, quantity: 1, price: packageData.pricing.price },
        ],
      });
    });

  }

  if (openDrawer) openCart();

  try {
    document.dispatchEvent(new CustomEvent('cart:updated'));
  } catch (_) {}

  return calculationPromise || Promise.resolve();
}

function cartAction(element, action) {
  const itemRoot = element.closest('[data-package-id]');
  const packageId = itemRoot ? itemRoot.getAttribute('data-package-id') : element.id;

  try {
    switch (action) {
      case 'increase':
        Cart.increase(packageId);
        break;
      case 'decrease':
        Cart.decrease(packageId);
        break;
      case 'input':
        const quantity = parseInt(element.value) || 1;
        Cart.update(packageId, quantity);
        break;
      case 'remove':
        Cart.remove(packageId);
        break;
    }

    Cart.revalidateQuantity();
    updateDrawerItems();
    updateCartBadge();
    try {
      document.dispatchEvent(new CustomEvent('cart:updated'));
    } catch {}
  } catch (error) {
    console.error('Cart action error:', error);
  }
}

function initCartActionListeners(container) {
  if (!container) return;
  if (container.getAttribute && container.getAttribute('data-cart-listeners-attached') === 'true') {
    return;
  }

  const onClick = (e) => {
    const target = e.target.closest('[data-cart-action]');
    if (!target) return;
    if (!container.contains(target)) return;
    const action = target.getAttribute('data-cart-action');
    if (!action || action === 'input') return;
    cartAction(target, action);
  };

  const onBlur = (e) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.getAttribute('data-cart-action') !== 'input') return;
    if (!container.contains(target)) return;
    cartAction(target, 'input');
  };

  container.addEventListener('click', onClick);
  container.addEventListener('blur', onBlur, true);

  if (container.setAttribute) container.setAttribute('data-cart-listeners-attached', 'true');
}

function updateCartBadge() {
  if (document.body.classList.contains('checkout-page')) return;
  const count = Cart.getCount();
  const shouldAnimateCartNavbar = count > 0 && (lastCartNavbarCount === null || lastCartNavbarCount < 1);
  const cartButtons = document.querySelectorAll('.open-cart');
  const navbars = document.querySelectorAll('.cart-navbar');

  navbars.forEach((navbar) => {
    navbar.classList.toggle('cart-empty', count < 1);
    navbar.classList.toggle('cart-has-items', count > 0);

    if (!navbar.classList.contains('coxinha-nav-actions')) return;

    if (count < 1) {
      navbar.classList.remove('cart-enter', 'cart-pulse');
      return;
    }

    if (shouldAnimateCartNavbar) {
      navbar.classList.remove('cart-enter');
      void navbar.offsetWidth;
      navbar.classList.add('cart-enter');
    }
  });

  cartButtons.forEach((cartButton) => {
    const existingBadge = cartButton.querySelector('.cart-badge');
    if (existingBadge) {
      existingBadge.remove();
    }

    cartButton.classList.toggle('cart-empty', count < 1);
    cartButton.classList.toggle('cart-has-items', count > 0);
    cartButton.disabled = count < 1;
    cartButton.setAttribute('aria-hidden', count > 0 ? 'false' : 'true');

    if (count > 0) {
      const badge = document.createElement('span');
      badge.className =
        'cart-badge absolute -top-2 -right-2 bg-primary border border-2 border-background text-xs rounded-full h-5 w-5 flex items-center justify-center';
      badge.textContent = count > 99 ? '99+' : count;
      cartButton.style.position = 'relative';
      cartButton.appendChild(badge);
    }
  });

  lastCartNavbarCount = count;
}

window.addEventListener('load', () => {
  updateCartBadge();
  if (typeof initPackageCardButtons === 'function') {
    initPackageCardButtons();
  }
});
