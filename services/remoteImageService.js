const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

/**
 * Upload images to the remote product images API.
 * Expected remote endpoint: `${BASE_URL}/products/{id}/upload-images`
 * Payload: images[] (multipart/form-data)
 * Response shape (example):
 * { success: true, data: { urls: [ { url: 'http://...', is_main: false }, ... ] } }
 *
 * @param {number|string} productId - ID used in the remote URL
 * @param {Array} files - Multer file objects (disk storage)
 * @param {Object} reqHeaders - Incoming request headers (to forward Authorization if available)
 * @returns {Promise<{ linkList: string[], raw?: any, error?: any }>} List of URL strings on success
 */
async function uploadProductImagesToRemote(productId, files, reqHeaders = {}) {
  try {
    if (!files || files.length === 0) return { linkList: [] };

    const base = 'https://thenirmanstore.com/api';
    const url = `${base.replace(/\/$/, '')}/products/${productId}/upload-images`;

    console.log('Uploading images to remote for product ID:', productId);
    console.log(base);
    console.log(url);
    const form = new FormData();

    for (const file of files) {
      const fullPath = file.path || (file.destination && file.filename ? path.join(file.destination, file.filename) : null);
      if (!fullPath || !fs.existsSync(fullPath)) continue;
      // Use originalname when available so remote receives a nicer filename
      form.append('images[]', fs.createReadStream(fullPath), file.originalname || file.filename);
    }

    const headers = { ...form.getHeaders() };
    // Forward Authorization header if available
    if (reqHeaders && (reqHeaders.authorization || reqHeaders.Authorization)) {
      headers['Authorization'] = reqHeaders.authorization || reqHeaders.Authorization;
    }

    const resp = await axios.post(url, form, { headers, timeout: 30000 });
    const data = resp && resp.data ? resp.data : {};

    // Normalize various possible response shapes
    let urlsArr = [];
    if (data && data.data && Array.isArray(data.data.urls)) {
      urlsArr = data.data.urls;
    } else if (Array.isArray(data.urls)) {
      urlsArr = data.urls;
    }

    const linkList = urlsArr
      .map((u) => (typeof u === 'string' ? u : (u && u.url ? u.url : null)))
      .filter(Boolean);

    return { linkList, raw: data };
  } catch (error) {
    console.error('Remote image upload failed:', error?.response?.data || error.message);
    return { linkList: [], error };
  }
}

module.exports = { uploadProductImagesToRemote };
