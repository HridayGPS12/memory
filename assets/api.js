(function () {
  'use strict';

  var PROJECT_ID = 29756;
  var API_ROOT = 'https://api.websitepublisher.ai/iapi/project/' + PROJECT_ID;

  async function request(path, options) {
    options = options || {};
    var headers = { Accept: 'application/json' };
    if (options.token) headers.Authorization = 'Bearer ' + options.token;
    var body = options.form;
    if (!body) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body || {});
    }
    var response = await fetch(API_ROOT + path, {
      method: 'POST',
      headers: headers,
      body: body
    });
    var payload = await response.json();
    if (payload && payload.data && typeof payload.data.success === 'boolean') {
      payload = payload.data;
    }
    if (!response.ok && (!payload || payload.success !== true)) {
      throw new Error((payload && (payload.message || (payload.error && payload.error.message))) || 'The private vault could not connect.');
    }
    return { data: payload };
  }

  window.MemoryVaultApi = {
    tenantAuth: function (endpoint, body) {
      return request('/tenant-auth/' + encodeURIComponent(endpoint), { body: body });
    },
    memberAction: function (endpoint, body, token) {
      return request('/gated-files/' + encodeURIComponent(endpoint), { body: body, token: token });
    },
    memberUpload: function (file, title, token) {
      var form = new FormData();
      form.append('file', file);
      form.append('title', title);
      return request('/gated-files/put-upload', { form: form, token: token });
    }
  };
})();
