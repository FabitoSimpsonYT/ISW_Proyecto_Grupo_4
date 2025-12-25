import apiRoot from './root.service.js';

export default async function api(path, options = {}) {
  const method = (options.method || 'GET').toLowerCase();
  let data;

  if (options.body) {
    try {
      data = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    } catch (err) {
      // fallback: send raw body
      data = options.body;
    }
  }

  const config = {
    url: path,
    method,
    data,
  };

  const response = await apiRoot(config);
  return response.data;
}
