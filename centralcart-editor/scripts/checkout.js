const checkoutElement = document.querySelector('#checkout');

function collectCheckoutFields() {
  const container = document.getElementById('checkout_fields');
  const result = {};

  if (!container) return result;

  container.querySelectorAll('[data-field-id]').forEach((element) => {
    const fieldId = element.getAttribute('data-field-id');
    const fieldType = element.getAttribute('data-field-type');
    if (!fieldId) return;

    if (fieldType === 'SELECT') {
      const select = element.querySelector('select');
      if (select && select.value) result[fieldId] = select.value;
    } else if (fieldType === 'ROBLOX') {
      const value = element.getAttribute('data-value') || '';
      if (value) result[fieldId] = value;
    } else {
      const input = element.querySelector('input');
      const value = (input?.value || '').trim();
      if (value) result[fieldId] = value;
    }
  });

  return result;
}

CentralCart.PixCheckout.init({
  getSelectedButton: () =>
    checkoutElement.querySelector('[data-payment-method][data-selected="true"]'),
});

document.addEventListener('pix:requirements-changed', (event) => {
  const { requireDocument, requirePhone } = event.detail || {};

  const docField = checkoutElement.querySelector('input[name="client_document"]');
  if (docField) {
    const storeRequiresDoc = docField.getAttribute('data-required') === 'true';
    if (requireDocument || storeRequiresDoc) docField.classList.remove('hidden');
    else docField.classList.add('hidden');
  }

  const phoneWrapper = checkoutElement.querySelector('#phone-field-wrapper');
  if (phoneWrapper) {
    const phoneMode = phoneWrapper.getAttribute('data-phone-mode') || 'DISABLED';
    const showPhone = requirePhone || phoneMode === 'OPTIONAL' || phoneMode === 'REQUIRED';
    if (showPhone) {
      phoneWrapper.classList.remove('hidden');
      PhoneInput.init(phoneWrapper);
      const phoneInput = phoneWrapper.querySelector('input[name="client_phone"]');
      if (phoneInput) {
        phoneInput.placeholder =
          phoneMode === 'OPTIONAL' && !requirePhone ? 'Telefone (opcional)' : 'Telefone';
      }
    } else {
      phoneWrapper.classList.add('hidden');
    }
  }
});

(function handleSelectPaymentMethod() {
  const buttons = checkoutElement.querySelectorAll('[data-payment-method]');
  const creditCardForm = document.getElementById('creditcard-form');

  buttons.forEach((element, index) => {
    const paymentMethod = element.getAttribute('data-payment-method');

    element.addEventListener('click', () => {
      if (element.getAttribute('data-selected') === 'true') return;

      checkoutElement
        .querySelectorAll('[data-payment-method][data-selected="true"]')
        .forEach((el) => el.setAttribute('data-selected', 'false'));

      element.setAttribute('data-selected', 'true');
      window.selectedGateway = paymentMethod;

      const rawFee = element.getAttribute('data-fee');
      const feeValue = rawFee && rawFee !== 'null' && rawFee !== '' ? parseFloat(rawFee) : 0;
      const isPercentageFee = element.getAttribute('data-is-percentage-fee') === 'true';

      window.selectedGatewayData = {
        provider: element.getAttribute('data-provider') || null,
        payeeCode: element.getAttribute('data-payee-code') || null,
        maxInstallments: parseInt(element.getAttribute('data-max-installments') || '12', 10),
        fee: feeValue,
        isPercentageFee: isPercentageFee,
      };

      document.dispatchEvent(new CustomEvent('gateway:changed'));

      const docField = checkoutElement.querySelector('input[name="client_document"]');
      if (docField) IMask(docField, { mask: '000.000.000-00' });

      if (creditCardForm) {
        if (paymentMethod === 'CREDITCARD') {
          creditCardForm.classList.remove('hidden');
          CreditCardHandler.init(checkoutElement, {
            onBrandChange: (brand) => {
              const iconEl = document.getElementById('card-brand-icon');
              if (!iconEl) return;

              if (!brand) {
                iconEl.innerHTML = '';
                return;
              }

              iconEl.innerHTML = `<img src="https://cdn.centralcart.io/public/gateway-icons/${brand.toLowerCase()}.svg" alt="${brand}" class="size-6" onerror="this.style.display='none'" onload="this.style.display=''" />`;
            },
          });
        } else {
          creditCardForm.classList.add('hidden');
        }
      }
    });

    if (index === 0) element.click();
  });
})();

window.Checkout = Object.assign(window.Checkout || {}, {
  getSelectedGateway() {
    return window.selectedGateway || null;
  },
});

(function initPlayerAccountSelector() {
  if (!checkoutElement) return;
  if (window.__coxinhaPlayerSelectorReady) return;

  const playerTypeInput = checkoutElement.querySelector('input[name="player_type"]');
  const nickInput = checkoutElement.querySelector('input[name="client_identifier"]');
  const nickWrap = checkoutElement.querySelector('[data-player-nick-wrap]');
  const hint = checkoutElement.querySelector('[data-player-hint]');
  const buttons = checkoutElement.querySelectorAll('[data-player-type]');

  if (!playerTypeInput || !nickInput || !buttons.length) return;
  window.__coxinhaPlayerSelectorReady = true;

  const hints = {
    java_original: 'Use exatamente o nick da sua conta Java original.',
    java_pirata: 'O sistema vai salvar com * no inicio do nick.',
    bedrock: 'O sistema vai salvar com . no inicio do nick.',
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedType = button.getAttribute('data-player-type') || '';
      playerTypeInput.value = selectedType;

      buttons.forEach((item) => {
        const isSelected = item === button;
        item.setAttribute('aria-pressed', String(isSelected));
        item.setAttribute('data-selected', String(isSelected));
      });

      if (nickWrap) nickWrap.classList.remove('hidden');
      if (hint) hint.textContent = hints[selectedType] || 'Informe o nick do jogador.';
      nickInput.focus();
    });
  });
})();

function normalizePlayerIdentifier(type, rawNick) {
  const cleanNick = String(rawNick || '').trim().replace(/^[*.]+/, '');

  if (!type || !cleanNick) {
    return '';
  }

  if (type === 'java_pirata') {
    return `*${cleanNick}`;
  }

  if (type === 'bedrock') {
    return `.${cleanNick}`;
  }

  return cleanNick;
}

(function initAddressAutofill() {
  const addressSection = document.getElementById('address-section');
  if (!addressSection) return;

  const cepInput = addressSection.querySelector('input[name="address_cep"]');
  const streetInput = addressSection.querySelector('input[name="address_street"]');
  const neighborhoodInput = addressSection.querySelector('input[name="address_neighborhood"]');
  const cityInput = addressSection.querySelector('input[name="address_city"]');
  const stateInput = addressSection.querySelector('input[name="address_state"]');
  const cepLoading = document.getElementById('cep-loading');
  const cepError = document.getElementById('cep-error');

  if (!cepInput) return;

  let debounceTimer;

  cepInput.addEventListener('input', (e) => {
    cepInput.value = CentralCart.formatCEP(cepInput.value);
    if (cepError) cepError.textContent = '';

    const clean = cepInput.value.replace(/\D/g, '');
    clearTimeout(debounceTimer);

    if (clean.length === 8) {
      debounceTimer = setTimeout(() => fetchCep(clean), 300);
    }
  });

  async function fetchCep(cep) {
    try {
      if (cepLoading) cepLoading.classList.remove('hidden');
      if (cepError) cepError.textContent = '';

      const data = await CentralCart.fetchCEP(cep);

      if (streetInput && data.logradouro) streetInput.value = data.logradouro;
      if (neighborhoodInput && data.bairro) neighborhoodInput.value = data.bairro;
      if (cityInput && data.localidade) cityInput.value = data.localidade;
      if (stateInput && data.uf) stateInput.value = data.uf;

      const numberInput = addressSection.querySelector('input[name="address_number"]');
      if (numberInput) numberInput.focus();
    } catch (err) {
      if (cepError) cepError.textContent = err.message || 'CEP não encontrado.';
    } finally {
      if (cepLoading) cepLoading.classList.add('hidden');
    }
  }
})();

(function initCheckoutRendering() {
  if (!checkoutElement) return;

  const packagesList = checkoutElement.querySelector('#packages-list');
  const emptyPackagesHTML = checkoutElement.querySelector('#empty-packages')?.outerHTML || '';
  const pricing = checkoutElement.querySelector('#pricing');
  const coupon = checkoutElement.querySelector('#coupon');
  const couponInput = coupon?.querySelector('input');
  const couponButton = coupon?.querySelector('button');
  const couponError = coupon?.querySelector('#coupon-error');

  /** @type {null | { id:number, coupon:string, type:'PERCENTAGE'|'PRICE', value:number, applies_to?: number[] }} */
  let appliedDiscount = null;

  function setCouponButtonState(state) {
    if (!couponButton) return;
    couponButton.setAttribute('data-state', state);
  }

  function computeTotals() {
    const subtotal = window.Cart?.calculateTotal?.() || 0;

    let couponDiscount = 0;
    if (appliedDiscount && subtotal > 0) {
      const applicableSubtotal = subtotal;

      if (appliedDiscount.type === 'PERCENTAGE') {
        couponDiscount = applicableSubtotal * (Number(appliedDiscount.value || 0) / 100);
      } else if (appliedDiscount.type === 'PRICE') {
        couponDiscount = Math.min(Number(appliedDiscount.value || 0), applicableSubtotal);
      }
    }

    let gatewayDiscount = 0;
    let feeValue = 0;
    const gatewayData = window.selectedGatewayData;
    if (gatewayData && gatewayData.fee !== 0 && subtotal > 0) {
      if (gatewayData.fee < 0) {
        const absFee = Math.abs(gatewayData.fee);
        if (gatewayData.isPercentageFee) {
          gatewayDiscount = subtotal * (absFee / 100);
        } else {
          gatewayDiscount = absFee;
        }
      } else {
        const afterDiscount = Math.max(0, subtotal - couponDiscount);
        if (gatewayData.isPercentageFee) {
          feeValue = afterDiscount * (gatewayData.fee / 100);
        } else {
          feeValue = gatewayData.fee;
        }
      }
    }

    const totalDiscount = couponDiscount + gatewayDiscount;
    const total = Math.max(0, subtotal - totalDiscount + feeValue);
    return { subtotal, discountValue: totalDiscount, feeValue, total };
  }

  function updatePricingUI() {
    if (!pricing) return;
    const { subtotal, discountValue, feeValue, total } = computeTotals();
    const subtotalEl = pricing.querySelector('.subtotal-value');
    const discountEl = pricing.querySelector('.discount-value');
    const feeEl = pricing.querySelector('.fee-value');
    const feeRow = document.getElementById('fee-row');
    const totalEl = pricing.querySelector('.total-value');
    const payButtonPrice = document.querySelector('#pay-button-price');

    if (subtotalEl) subtotalEl.textContent = CentralCart.formatPrice(subtotal, store.currency);
    if (discountEl) discountEl.textContent = CentralCart.formatPrice(discountValue, store.currency);
    if (feeRow) {
      if (feeValue > 0) {
        feeRow.classList.remove('hidden');
        if (feeEl) feeEl.textContent = CentralCart.formatPrice(feeValue, store.currency);
      } else {
        feeRow.classList.add('hidden');
      }
    }
    if (totalEl) totalEl.textContent = CentralCart.formatPrice(total, store.currency);
    if (payButtonPrice) payButtonPrice.textContent = CentralCart.formatPrice(total, store.currency);

    document.dispatchEvent(
      new CustomEvent('checkout:totals-updated', {
        detail: { subtotal, total, feeValue, discountValue },
      }),
    );
  }

  function renderPackages() {
    if (!packagesList) return;
    const pkgs = window.Cart?.getPackages?.() || [];
    if (!pkgs.length) {
      packagesList.innerHTML = emptyPackagesHTML;
      updatePricingUI();
      return;
    }

    packagesList.innerHTML = getCheckoutItemsRender(pkgs);
    try {
      window.lucide?.createIcons?.();
    } catch {}
    updatePricingUI();
    initCartActionListeners(packagesList);
  }

  function renderCheckoutFields() {
    const container = document.getElementById('checkout_fields');
    const fields = getScriptData('__centralcart_checkout_fields', []);
    if (!container) return;

    if (!Array.isArray(fields) || fields.length === 0) {
      container.classList.add('hidden');
      return;
    }

    let cartIds = new Set();
    const cartItems = Cart.get();
    cartIds = new Set((cartItems || []).map((i) => parseInt(i.id)));

    const applicable = fields.filter((field) => {
      if (field?.name === 'client_identifier') return false;

      const arr = Array.isArray(field.applies_to) ? field.applies_to : [];
      if (arr.includes(-1)) return true;
      if (cartIds.size === 0) return false;
      return arr.some((pid) => cartIds.has(pid));
    });

    if (applicable.length === 0) {
      container.classList.add('hidden');
      return;
    }

    container.classList.remove('hidden');
    const html = getCheckoutFieldsRender(applicable);
    container.innerHTML = html;

    CustomFields.afterRender(container);
  }

  async function applyCoupon(code) {
    if (!code) {
      if (couponError) couponError.textContent = 'Informe um cupom válido';
      return;
    }
    try {
      if (couponError) couponError.textContent = '';
      const { data } = await CentralCart.getDiscount(code);
      if (!data) {
        throw new Error(data?.message || 'Cupom inválido');
      }
      const discount = data;
      const cartIds = Cart.get().map((i) => parseInt(i.id));
      const appliesToAll = discount.applies_to.includes(-1);
      if (!appliesToAll && cartIds.length > 0) {
        const hasIneligible = cartIds.some((id) => !discount.applies_to.includes(id));
        if (hasIneligible) {
          throw new Error(
            'O cupom de desconto não é aplicável para um ou mais itens no seu carrinho.'
          );
        }
      }
      appliedDiscount = discount;
      localStorage.setItem('cart-discount', JSON.stringify({ coupon: discount.coupon, discount }));
      setCouponButtonState('remove');
      renderPackages();
    } catch (err) {
      if (couponError)
        couponError.textContent = err?.message || 'Não foi possível aplicar este cupom';
      appliedDiscount = null;
      localStorage.removeItem('cart-discount');
      setCouponButtonState('apply');
      updatePricingUI();
    }
  }

  function removeCoupon() {
    appliedDiscount = null;
    localStorage.removeItem('cart-discount');
    setCouponButtonState('apply');
    if (couponError) couponError.textContent = '';
    if (couponInput) couponInput.value = '';
    updatePricingUI();
  }

  async function restoreCoupon() {
    try {
      const raw = localStorage.getItem('cart-discount');
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (couponInput && saved?.coupon) couponInput.value = saved.coupon;
      await applyCoupon(saved?.coupon);
    } catch {}
  }

  async function init() {
    try {
      await window.Cart?.calculate?.();
      renderPackages();
      renderCheckoutFields();
      await restoreCoupon();
    } catch (err) {}
  }

  couponButton?.addEventListener('click', async () => {
    if (appliedDiscount) {
      removeCoupon();
      return;
    }
    await applyCoupon(couponInput?.value?.trim());
  });

  init();

  document.addEventListener('cart:updated', () => {
    renderPackages();
    renderCheckoutFields();
  });

  document.addEventListener('gateway:changed', () => {
    updatePricingUI();
  });
})();

(function initCheckoutSubmit() {
  if (!checkoutElement) return;

  const payButton = checkoutElement.querySelector('#pay-button');
  if (!payButton) return;

  function setLoading(state) {
    try {
      if (state) {
        payButton.setAttribute('disabled', 'true');
        payButton.setAttribute('aria-busy', 'true');
        payButton.classList.add('opacity-80');

        if (!payButton.dataset.originalHtml) {
          payButton.dataset.originalHtml = payButton.innerHTML;
        }

        payButton.innerHTML = `<div class="flex items-center justify-center gap-2">${Spinner({
          size: 6,
        })}</div>`;
      } else {
        payButton.removeAttribute('disabled');
        payButton.removeAttribute('aria-busy');
        payButton.classList.remove('opacity-80');

        if (payButton.dataset.originalHtml) {
          payButton.innerHTML = payButton.dataset.originalHtml;
        }
      }
    } catch {}
  }

  payButton.addEventListener('click', async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const termsCheckbox = checkoutElement.querySelector('#terms-checkbox');
      if (!termsCheckbox?.checked) {
        toast.error('Você deve aceitar os termos e condições para continuar.');
        return;
      }

      const gateway = Checkout?.getSelectedGateway?.();
      const name = checkoutElement.querySelector('input[name="client_name"]')?.value?.trim();
      const email = checkoutElement.querySelector('input[name="client_email"]')?.value?.trim();
      const playerType = checkoutElement.querySelector('input[name="player_type"]')?.value?.trim();
      const playerNick = checkoutElement
        .querySelector('input[name="client_identifier"]')
        ?.value?.trim();
      const normalizedPlayerNick = normalizePlayerIdentifier(playerType, playerNick);
      const discord = checkoutElement.querySelector('input[name="client_discord"]')?.value?.trim();
      const document = checkoutElement
        .querySelector('input[name="client_document"]')
        ?.value?.trim();
      let phone = '';
      const phoneWrapperEl = checkoutElement.querySelector('#phone-field-wrapper');
      if (phoneWrapperEl && !phoneWrapperEl.classList.contains('hidden')) {
        const rawPhone = checkoutElement.querySelector('input[name="client_phone"]')?.value?.trim();
        if (rawPhone) {
          phone = PhoneInput.toE164(rawPhone, PhoneInput.getCountryCode());
        }
      }

      const rawCart = Cart.get() || [];
      const parsedCart = rawCart.map((item) => ({
        package_id: parseInt(item.id),
        quantity: parseInt(item.quantity || 1, 10),
        fields: item.fields || {},
      }));

      let coupon;
      try {
        const saved = JSON.parse(localStorage.getItem('cart-discount') || 'null');
        coupon = saved?.coupon;
      } catch {}

      let clientAddress;
      const addressEl = checkoutElement.querySelector('#address-section');
      if (addressEl && !addressEl.classList.contains('hidden')) {
        const cep = addressEl.querySelector('input[name="address_cep"]')?.value?.trim();
        const street = addressEl.querySelector('input[name="address_street"]')?.value?.trim();
        const number = addressEl.querySelector('input[name="address_number"]')?.value?.trim();
        const complement = addressEl.querySelector('input[name="address_complement"]')?.value?.trim();
        const neighborhood = addressEl.querySelector('input[name="address_neighborhood"]')?.value?.trim();
        const city = addressEl.querySelector('input[name="address_city"]')?.value?.trim();
        const state = addressEl.querySelector('input[name="address_state"]')?.value?.trim();

        if (!cep || !street || !number || !neighborhood || !city || !state) {
          toast.error('Preencha todos os campos de endereço obrigatórios.');
          return;
        }

        clientAddress = { cep, street, number, complement, neighborhood, city, state };
      }

      if (!playerType) {
        toast.error('Escolha se voce joga no Java original, Java pirata ou Bedrock.');
        return;
      }

      if (!normalizedPlayerNick) {
        toast.error('Informe o nick do jogador.');
        return;
      }

      const checkoutFields = collectCheckoutFields();
      checkoutFields.client_identifier = normalizedPlayerNick;

      const payload = {
        gateway,
        client_email: email,
        client_name: name,
        client_phone: phone,
        fields: checkoutFields,
        client_discord: discord,
        terms: termsCheckbox.checked,
      };

      if (clientAddress) payload.client_address = clientAddress;
      if (document) payload.client_document = document;
      if (coupon) payload.coupon = coupon;
      if (parsedCart && parsedCart.length) payload.cart = parsedCart;

      if (gateway === 'CREDITCARD') {
        const { payment_token } = await CreditCardHandler.generateToken();
        payload.payment_token = payment_token;
        payload.installments = CreditCardHandler.getInstallments();
      }

      const { data } = await CentralCart.checkout(payload);

      const { checkout_url, order_id, status } = data;

      const cartContents = Cart.getPackages().map((pkg) => ({
        id: pkg.id,
        name: pkg.name,
        quantity: pkg.quantity,
        price: pkg.pricing.price,
      }));

      CentralCart.track('initiate_checkout', {
        value: Cart.calculateTotal(),
        currency: store.currency,
        transaction_id: order_id,
        contents: cartContents,
      });

      Cart.clear();

      if (status === 'APPROVED') {
        location.href = `/order/${order_id}`;
      } else {
        if (gateway === 'PIX') {
          location.href = `/payment/${order_id}`;
        } else {
          location.href = checkout_url;
        }
      }
    } catch (err) {
      const msg =
        err?.data?.errors?.[0]?.message ||
        err?.message ||
        'Não foi possível processar o seu pedido.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  });
})();
