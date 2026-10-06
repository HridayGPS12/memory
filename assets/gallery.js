(function () {
  var PROJECT_ID = 29756;
  var API_BASE = '/iapi/project/' + PROJECT_ID + '/tenant-auth/';
  var PAGE_SIZE = 50;
  var MAX_FILE_BYTES = 26214400;
  var TOKEN_COOKIE = 'tenant_token';
  var gallery = document.getElementById('gallery-grid');
  var emptyState = document.getElementById('empty-state');
  var uploadButton = document.getElementById('upload-button');
  var emptyUploadButton = document.getElementById('empty-upload-button');
  var photoInput = document.getElementById('photo-input');
  var captionInput = document.getElementById('memory-caption');
  var uploadStatus = document.getElementById('upload-status');
  var count = document.getElementById('memory-count');
  var logoutButton = document.getElementById('logout-button');
  var loadMoreWrap = document.getElementById('load-more-wrap');
  var loadMoreButton = document.getElementById('load-more');
  var dialog = document.getElementById('photo-dialog');
  var lightboxImage = document.getElementById('lightbox-image');
  var lightboxCaption = document.getElementById('lightbox-caption');
  var sapi;
  var currentToken = sessionStorage.getItem('tenant_token') || localStorage.getItem('tenant_token');
  var currentRefresh = sessionStorage.getItem('tenant_refresh') || localStorage.getItem('tenant_refresh');
  var visibleCount = 0;
  var totalCount = 0;
  var busy = false;
  var toastTimer;

  function clearTokens() {
    sessionStorage.removeItem('tenant_token');
    sessionStorage.removeItem('tenant_refresh');
    localStorage.removeItem('tenant_token');
    localStorage.removeItem('tenant_refresh');
    document.cookie = TOKEN_COOKIE + '=; path=/; max-age=0; SameSite=Lax; Secure';
    if (sapi && typeof sapi.clearBearer === 'function') sapi.clearBearer();
  }

  function saveTokens(data) {
    currentToken = data.token;
    currentRefresh = data.refresh_token;
    sessionStorage.setItem('tenant_token', currentToken);
    sessionStorage.setItem('tenant_refresh', currentRefresh);
    localStorage.setItem('tenant_token', currentToken);
    localStorage.setItem('tenant_refresh', currentRefresh);
    document.cookie = TOKEN_COOKIE + '=' + encodeURIComponent(currentToken) + '; path=/; max-age=86400; SameSite=Lax; Secure';
    if (sapi) sapi.setBearer(currentToken);
  }

  async function postAuth(endpoint, payload) {
    var response = await fetch(API_BASE + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    return response.json();
  }

  function setUploadStatus(message, kind) {
    uploadStatus.textContent = message || '';
    uploadStatus.dataset.kind = kind || '';
  }

  function showToast(message) {
    var toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove('is-visible'); }, 3200);
  }

  function readableDate(value) {
    if (!value) return '';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(date);
  }

  function safeTitle(item) {
    if (item.title && String(item.title).trim()) return String(item.title).trim();
    return String(item.filename || 'A little forever').replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
  }

  async function verifyOrRefresh() {
    if (!currentToken) return false;
    try {
      var verified = await postAuth('verify', { token: currentToken });
      if (verified.valid) return true;
      if (!currentRefresh) return false;
      var renewed = await postAuth('refresh', { refresh_token: currentRefresh });
      if (!renewed.success || !renewed.token || !renewed.refresh_token) return false;
      saveTokens(renewed);
      verified = await postAuth('verify', { token: currentToken });
      return !!verified.valid;
    } catch (error) {
      return false;
    }
  }

  async function getDownloadUrl(fileId) {
    var response = await sapi.call('POST', '/execute/gated-files/download', { file_id: fileId });
    if (!response || !response.data || !response.data.success) {
      var message = response && response.data && response.data.error && response.data.error.message;
      throw new Error(message || 'A private photo could not be opened.');
    }
    var result = response.data.result || {};
    if (!result.url) throw new Error('A private photo link could not be created.');
    return result.url;
  }

  function createPhotoCard(item, url) {
    var card = document.createElement('article');
    card.className = 'photo-card';
    var open = document.createElement('button');
    open.type = 'button';
    open.className = 'photo-open';
    open.setAttribute('aria-label', 'View ' + safeTitle(item));
    var image = document.createElement('img');
    image.src = url;
    image.alt = safeTitle(item);
    image.loading = 'eager';
    image.decoding = 'async';
    open.appendChild(image);
    open.addEventListener('click', function () {
      lightboxImage.src = url;
      lightboxImage.alt = safeTitle(item);
      lightboxCaption.textContent = safeTitle(item);
      dialog.showModal();
    });
    var caption = document.createElement('div');
    caption.className = 'photo-caption';
    var title = document.createElement('strong');
    title.textContent = safeTitle(item);
    caption.appendChild(title);
    var dateText = readableDate(item.created_at);
    if (dateText) {
      var time = document.createElement('time');
      time.textContent = dateText;
      caption.appendChild(time);
    }
    card.appendChild(open);
    card.appendChild(caption);
    return card;
  }

  async function loadPage(offset, append) {
    if (busy) return;
    busy = true;
    if (!append) {
      gallery.replaceChildren();
      visibleCount = 0;
      totalCount = 0;
      setUploadStatus('Gathering your saved moments…', '');
    }
    try {
      var response = await sapi.call('POST', '/execute/gated-files/list-mine', { limit: PAGE_SIZE, offset: offset });
      if (!response || !response.data || !response.data.success) {
        throw new Error('Your private photos could not be loaded. Please unlock the vault again.');
      }
      var files = (response.data.result && response.data.result.files) || [];
      var total = Number(response.data.result && response.data.result.total);
      if (Number.isFinite(total)) totalCount = total;
      var urls = await Promise.all(files.map(async function (file) {
        try { return await getDownloadUrl(file.file_id); }
        catch (error) { return null; }
      }));
      files.forEach(function (file, index) {
        if (urls[index]) gallery.appendChild(createPhotoCard(file, urls[index]));
      });
      visibleCount += files.length;
      count.textContent = String(totalCount || visibleCount);
      var hasMore = files.length === PAGE_SIZE && (totalCount === 0 || visibleCount < totalCount);
      loadMoreWrap.hidden = !hasMore;
      emptyState.hidden = visibleCount > 0;
      setUploadStatus('', '');
      if (files.length && !gallery.children.length) {
        throw new Error('Your gallery is available, but its photos could not be delivered just now. Please refresh.');
      }
    } catch (error) {
      setUploadStatus(error.message || 'We could not open your private gallery.', 'error');
      if (!gallery.children.length) emptyState.hidden = true;
    } finally {
      busy = false;
    }
  }

  async function uploadPhotos(files) {
    if (!files.length) return;
    var caption = captionInput.value.trim();
    var completed = 0;
    for (var i = 0; i < files.length; i += 1) {
      var file = files[i];
      if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
        showToast('Choose a JPG, PNG, WebP or GIF photo.');
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        showToast(file.name + ' is larger than the 25 MB photo limit.');
        continue;
      }
      var title = caption || file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
      setUploadStatus('Saving ' + (i + 1) + ' of ' + files.length + ' to private storage…', '');
      uploadButton.disabled = true;
      try {
        var response = await sapi.callUpload('/execute/gated-files/put-upload', { file: file, title: title });
        if (!response || !response.data || !response.data.success) {
          var reason = response && response.data && response.data.error && response.data.error.message;
          throw new Error(reason || 'This photo could not be saved.');
        }
        completed += 1;
      } catch (error) {
        showToast(error.message || 'A photo could not be saved.');
      }
    }
    uploadButton.disabled = false;
    photoInput.value = '';
    if (completed) {
      captionInput.value = '';
      showToast(completed === 1 ? 'A new memory is safely tucked away.' : completed + ' memories are safely tucked away.');
      await loadPage(0, false);
    } else {
      setUploadStatus('', '');
    }
  }

  async function logout() {
    var token = currentToken;
    clearTokens();
    try { await postAuth('logout', { token: token }); } catch (error) { /* local lock still succeeds */ }
    window.location.replace('/login.html');
  }

  async function start() {
    if (!currentToken) {
      window.location.replace('/login.html');
      return;
    }
    var valid = await verifyOrRefresh();
    if (!valid) {
      clearTokens();
      window.location.replace('/login.html');
      return;
    }
    if (!window.WP || typeof window.WP.sapi !== 'function') {
      setUploadStatus('The private gallery could not connect. Refresh the page and try again.', 'error');
      return;
    }
    sapi = WP.sapi(PROJECT_ID);
    sapi.setBearer(currentToken);
    await loadPage(0, false);
  }

  uploadButton.addEventListener('click', function () { photoInput.click(); });
  emptyUploadButton.addEventListener('click', function () { photoInput.click(); });
  photoInput.addEventListener('change', function () { uploadPhotos(Array.from(photoInput.files || [])); });
  logoutButton.addEventListener('click', logout);
  loadMoreButton.addEventListener('click', function () { loadPage(visibleCount, true); });
  document.getElementById('close-dialog').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', function () { lightboxImage.removeAttribute('src'); });
  start();
})();
