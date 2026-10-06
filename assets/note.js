(function () {
  var PROJECT_ID = 29756;
  var NOTE_FILE_ID = 928;
  var AUDIO_FILE_ID = 925;
  var token = sessionStorage.getItem('tenant_token') || localStorage.getItem('tenant_token');
  var refreshToken = sessionStorage.getItem('tenant_refresh') || localStorage.getItem('tenant_refresh');
  var status = document.getElementById('note-status');
  var content = document.getElementById('note-content');
  var noteImage = document.getElementById('private-note-image');
  var audio = document.getElementById('voice-recording');

  function clearTokens() {
    sessionStorage.removeItem('tenant_token');
    sessionStorage.removeItem('tenant_refresh');
    localStorage.removeItem('tenant_token');
    localStorage.removeItem('tenant_refresh');
    document.cookie = 'tenant_token=; path=/; max-age=0; SameSite=Lax; Secure';
  }
  function saveTokens(data) {
    token = data.token;
    refreshToken = data.refresh_token;
    sessionStorage.setItem('tenant_token', token);
    sessionStorage.setItem('tenant_refresh', refreshToken);
    localStorage.setItem('tenant_token', token);
    localStorage.setItem('tenant_refresh', refreshToken);
    document.cookie = 'tenant_token=' + encodeURIComponent(token) + '; path=/; max-age=86400; SameSite=Lax; Secure';
  }
  async function postAuth(endpoint, payload) {
    var response = await window.MemoryVaultApi.tenantAuth(endpoint, payload);
    return response.data;
  }
  async function verifyOrRefresh() {
    if (!token) return false;
    try {
      var verified = await postAuth('verify', {token:token});
      if (verified.valid) return true;
      if (!refreshToken) return false;
      var renewed = await postAuth('refresh', {refresh_token:refreshToken});
      if (!renewed.success || !renewed.token || !renewed.refresh_token) return false;
      saveTokens(renewed);
      verified = await postAuth('verify', {token:token});
      return !!verified.valid;
    } catch (error) { return false; }
  }
  async function downloadUrl(fileId) {
    var response = await window.MemoryVaultApi.memberAction('download', {file_id:fileId}, token);
    if (!response || !response.data || !response.data.success) {
      var message=response&&response.data&&response.data.error&&response.data.error.message;
      throw new Error(message||'A private memory could not be opened.');
    }
    var result=response.data.result||{};
    if (!result.url) throw new Error('A private memory link could not be created.');
    return result.url;
  }
  async function lock() {
    var oldToken=token;
    clearTokens();
    try { await postAuth('logout',{token:oldToken}); } catch(error) { /* local lock still works */ }
    window.location.replace('login.html');
  }
  async function start() {
    status.textContent='Checking your private session…';
    if (!token) { window.location.replace('login.html'); return; }
    if (!await verifyOrRefresh()) { clearTokens(); window.location.replace('login.html'); return; }
    status.textContent='Connecting to the private vault…';
    try {
      status.textContent='Opening your private love letter…';
      noteImage.src=await downloadUrl(NOTE_FILE_ID);
      status.textContent='Preparing the private voice note…';
      audio.src=await downloadUrl(AUDIO_FILE_ID);
      audio.load();
      content.hidden=false;
      status.textContent='';
    } catch(error) {
      status.textContent=error.message||'The private note could not be opened. Please refresh and try again.';
      status.dataset.kind='error';
    }
  }
  noteImage.addEventListener('error',function(){status.textContent='The private letter could not be displayed. Please refresh and try again.';status.dataset.kind='error';});
  document.getElementById('lock-button').addEventListener('click',lock);
  start();
})();