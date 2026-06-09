const Joi = require("joi");

const registerSchema = Joi.object({
  fullname: Joi.string().min(3).max(100).required(),
  username: Joi.string().alphanum().min(3).max(50).required(),
  email: Joi.string().email().required(),
  address: Joi.string().optional().allow(null),
  contact_phone: Joi.string()
    .pattern(/^(?:\+62|0)8\d{7,12}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Phone number must be a valid Indonesian number in format +628XXXXXXXXX'
    }),
  password: Joi.string()
    .min(8)
    .pattern(/[A-Z]/, 'uppercase letter')
    .pattern(/[a-z]/, 'lowercase letter')
    .pattern(/\d/, 'number')
    .pattern(/[!@#$%^&*(),.?":{}|<>]/, 'special character')
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.name': 'Password must contain at least one {#name}'
    })
});

const loginSchema = Joi.object({
  identifier: Joi.string().required(),
  password: Joi.string().required(),
  captcha: Joi.string().required(),
  captchaText: Joi.string().required()
});

module.exports = {
  registerSchema,
  loginSchema,
};