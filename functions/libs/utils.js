const crypto = require('crypto');

const toHttps = (value) => {
  if (!value) return;

  if (value.match('^https://')) {
    return value;
  } else if (value.match('^http://')) {
    return value.replace('http://', 'https://');
  } else if (value.match('^//')) {
    return value.replace('//', 'https://');
  } else if (value.match('^/')) {
    return value.replace('^/', 'https://');
  } else {
    return `https//:${value}`;
  }
};

const getHashKey = (apiKey, apiSecret) => {
  const apiHeaderTime = Math.floor(Date.now() / 1000); //console.log(`apiHeaderTime=[${apiHeaderTime}]`);
  const sha1Algorithm = 'sha1';
  const sha1Hash = crypto.createHash(sha1Algorithm);
  const data4Hash = apiKey + apiSecret + apiHeaderTime;
  sha1Hash.update(data4Hash);
  const hash4Header = sha1Hash.digest('hex');

  return {
    apiHeaderTime,
    hash4Header
  };
};

module.exports = {
  toHttps,
  getHashKey
};
