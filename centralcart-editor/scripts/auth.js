let currentEmail = '';

function setupOtpInputs() {
  const otpInputs = document.querySelectorAll('.otp-input');

  otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      const value = e.target.value;

      if (!/^\d*$/.test(value)) {
        e.target.value = '';
        return;
      }

      if (value && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        otpInputs[index - 1].focus();
      }
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

      if (pastedData.length === 6) {
        otpInputs.forEach((input, i) => {
          input.value = pastedData[i] || '';
        });
        otpInputs[5].focus();
      }
    });
  });
}

function showOtpStep(email) {
  currentEmail = email;
  document.getElementById('email-step').classList.add('hidden');
  document.getElementById('otp-step').classList.remove('hidden');
  document.getElementById('user-email').textContent = email;
  document.getElementById('back-to-email').classList.remove('hidden');
  document.querySelector('.submit-button').textContent = 'Verificar';

  document.querySelector('.otp-input').focus();
}

function showEmailStep() {
  document.getElementById('email-step').classList.remove('hidden');
  document.getElementById('otp-step').classList.add('hidden');
  document.getElementById('back-to-email').classList.add('hidden');
  document.querySelector('.submit-button').textContent = 'Entrar';
  document.getElementById('email').focus();
}

function getOtpCode() {
  const otpInputs = document.querySelectorAll('.otp-input');
  return Array.from(otpInputs)
    .map((input) => input.value)
    .join('');
}

document.addEventListener('DOMContentLoaded', setupOtpInputs);

document.getElementById('magic-link-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const emailStep = document.getElementById('email-step');
  const otpStep = document.getElementById('otp-step');

  if (!emailStep.classList.contains('hidden')) {
    const email = document.getElementById('email').value;

    if (!email) {
      toast.error('Por favor, insira seu email.');
      return;
    }

    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = Spinner({ size: 5 });

    try {
      await CentralCart.requestOtp(email);

      toast.success(
        'Código de verificação enviado para seu email! Verifique sua caixa de entrada.'
      );
      showOtpStep(email);
    } catch (error) {
      toast.error(error.data?.errors[0].message || 'Erro ao enviar código de verificação.');
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
    }
  } else {
    const otpCode = getOtpCode();

    if (otpCode.length !== 6) {
      toast.error('Por favor, insira o código de 6 dígitos.');
      return;
    }

    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = Spinner({ size: 5 });

    try {
      const result = await CentralCart.verifyOtp(currentEmail, otpCode);

      if (result.status === 200) {
        toast.success('Login realizado com sucesso!');
        window.location.href = '/account/orders';
      } else {
        toast.error(result.data?.message || 'Código inválido. Tente novamente.');
        document.querySelectorAll('.otp-input').forEach((input) => (input.value = ''));
        document.querySelector('.otp-input').focus();
      }
    } catch (error) {
      toast.error(error.data?.message || 'Erro ao verificar código.');
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
    }
  }
});

document.getElementById('back-to-email').addEventListener('click', () => {
  showEmailStep();
  document.querySelectorAll('.otp-input').forEach((input) => (input.value = ''));
});
