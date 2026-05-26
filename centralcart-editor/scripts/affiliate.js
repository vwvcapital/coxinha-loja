async function submitBecomeAffiliate(event) {
  event.preventDefault();

  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const refCodeInput = document.getElementById('affiliate-ref-code');

  if (!refCodeInput) return;

  const rawRefCode = refCodeInput.value.trim();

  if (!rawRefCode) {
    toast.error('Informe um código para o seu link de afiliado.');
    return;
  }

  const normalizedRefCode = rawRefCode;
  const sanitizedRefCode = normalizedRefCode.replace(/[^A-Za-z0-9_-]/g, '');

  if (sanitizedRefCode !== normalizedRefCode) {
    toast.error('Use apenas letras e números.');
    return;
  }

  if (sanitizedRefCode.length < 3) {
    toast.error('Informe um código com pelo menos 3 caracteres.');
    return;
  }

  submitBtn.disabled = true;

  try {
    await CentralCart.becomeAffiliate({ ref_code: sanitizedRefCode });
    toast.success('Cadastro de afiliado realizado com sucesso!');
    closeDialog('become-affiliate');
    window.location.reload();
  } catch (error) {
    toast.error(
      error.data?.errors?.[0]?.message || 'Não foi possível concluir seu cadastro como afiliado.'
    );
  } finally {
    submitBtn.disabled = false;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
}

async function updateWithdrawSettings() {
  const form = document.getElementById('withdraw-settings-form');
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const fullName = document.getElementById('withdraw-full-name').value.trim();
  const pixKeyType = document.getElementById('withdraw-pix-key-type').value;
  const pixKey = document.getElementById('withdraw-pix-key').value.trim();
  const cpfCnpj = document.getElementById('withdraw-cpf-cnpj').value.trim();

  if (!fullName || !pixKeyType || !pixKey || !cpfCnpj) {
    toast.error('Preencha todos os campos');
    return;
  }

  submitBtn.disabled = true;
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Salvando...';

  try {
    await CentralCart.updateAffiliateWithdrawSettings({
      full_name: fullName,
      pix_key: pixKey,
      pix_key_type: pixKeyType,
      cpf_cnpj: cpfCnpj,
    });

    toast.success('Configurações salvas com sucesso!');

    closeDialog('withdraw-settings');
  } catch (error) {
    toast.error(error.data?.errors?.[0]?.message || 'Erro ao salvar configurações');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

function formatCurrencyInput(input) {
  const currency = store.currency;

  let digits = input.value.replace(/\D/g, '');

  if (digits === '') {
    input.value = '';
    return;
  }

  const numericValue = parseInt(digits, 10) / 100;

  if (currency === 'BRL') {
    input.value = numericValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else {
    input.value = numericValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}

(function () {
  function initWithdrawDialog() {
    const withdrawDialog = document.getElementById('dialog-withdraw');
    if (!withdrawDialog) {
      setTimeout(initWithdrawDialog, 100);
      return;
    }

    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-state') {
          if (withdrawDialog.getAttribute('data-state') === 'open') {
            const amountInput = document.getElementById('withdraw-amount');
            if (amountInput) {
              amountInput.value = '';
            }
          }
        }
      });
    });

    observer.observe(withdrawDialog, {
      attributes: true,
      attributeFilter: ['data-state'],
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWithdrawDialog);
  } else {
    initWithdrawDialog();
  }
})();

function parseCurrencyValue(formattedValue) {
  if (!formattedValue) return 0;

  const currency = store.currency;

  if (currency === 'BRL') {
    const numericString = formattedValue.replace(/\./g, '').replace(',', '.');
    return parseFloat(numericString) || 0;
  } else {
    const numericString = formattedValue.replace(/,/g, '');
    return parseFloat(numericString) || 0;
  }
}

async function requestWithdraw() {
  const form = document.getElementById('withdraw-form');
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const amountInput = document.getElementById('withdraw-amount');
  const formattedAmount = amountInput.value.trim();

  if (!formattedAmount) {
    toast.error('Informe o valor do saque');
    return;
  }

  const amount = parseCurrencyValue(formattedAmount);

  if (amount <= 0) {
    toast.error('O valor deve ser maior que zero');
    return;
  }

  const minWithdrawElement = document.querySelector('[data-min-withdraw]');
  if (minWithdrawElement) {
    const minWithdraw = parseFloat(minWithdrawElement.getAttribute('data-min-withdraw'));
    if (amount < minWithdraw) {
      const minWithdrawFormatted = minWithdrawElement.textContent;
      toast.error(`O valor mínimo para saque é ${minWithdrawFormatted}`);
      return;
    }
  }

  submitBtn.disabled = true;
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Processando...';

  try {
    await CentralCart.requestAffiliateWithdraw({
      amount: amount,
    });

    toast.success('Solicitação de saque enviada com sucesso!');

    closeDialog('withdraw');
    window.location.reload();
  } catch (error) {
    toast.error(error.data?.errors?.[0]?.message || 'Erro ao solicitar saque');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

function openTransactionMessage(transactionId) {
  const messageContent = document.getElementById('transaction-message-content');
  const messageElement = document.querySelector(
    `span[data-transaction-message-id="${transactionId}"]`
  );

  if (messageContent && messageElement) {
    messageContent.textContent = messageElement.textContent;
    openDialog('transaction-message');

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
}
