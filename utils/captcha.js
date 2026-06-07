const svgCaptcha = require('svg-captcha');

function createCaptcha() {
  const captcha = svgCaptcha.create({ size: 5, noise: 7, color: true });
  return { svg: captcha.data, text: captcha.text };
}

module.exports = { createCaptcha };