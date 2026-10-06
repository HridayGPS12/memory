(function () {
  var PROJECT_ID = 29756;
  var LOGIN_EMAIL = 'memory-vault@local.invalid';
  var loginForm = document.getElementById('login-form');
  var passwordInput = document.getElementById('passcode');
  var submitButton = document.getElementById('login-submit');
  var status = document.getElementById('login-status');
  var toggle = document.getElementById('toggle-password');

  function setStatus(message, kind) {
    status.textContent = message || '';
    status.dataset.kind = kind || '';
  }

  function saveTokens(data) {
    sessionStorage.setItem('tenant_token', data.token);
    sessionStorage.setItem('tenant_refresh', data.refresh_token);
    localStorage.setItem('tenant_token', data.token);
    localStorage.setItem('tenant_refresh', data.refresh_token);
    document.cookie = 'tenant_token=' + encodeURIComponent(data.token) + '; path=/; max-age=86400; SameSite=Lax; Secure';
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var visible = passwordInput.type === 'password';
      passwordInput.type = visible ? 'text' : 'password';
      toggle.setAttribute('aria-pressed', visible ? 'true' : 'false');
      toggle.setAttribute('aria-label', visible ? 'Hide passcode' : 'Show passcode');
      passwordInput.focus();
    });
  }

  loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    var password = passwordInput.value;
    if (!password) {
      setStatus('Enter the shared passcode to continue.', 'error');
      passwordInput.focus();
      return;
    }
    submitButton.disabled = true;
    submitButton.setAttribute('aria-busy', 'true');
    setStatus('Opening your private memory box…', '');
    try {
      var response = await fetch('https://api.websitepublisher.ai/iapi/project/' + PROJECT_ID + '/tenant-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: LOGIN_EMAIL, password: password })
      });
      var data = await response.json();
      if (!response.ok || !data.success || !data.token) {
        throw new Error(data.message || 'That passcode did not unlock the vault. Try again.');
      }
      saveTokens(data);
      setStatus('Your memories are ready.', 'success');
      window.location.replace('memories.html');
    } catch (error) {
      setStatus(error.message || 'We could not connect just now. Please try again.', 'error');
      submitButton.disabled = false;
      submitButton.removeAttribute('aria-busy');
      passwordInput.select();
    }
  });
})();
