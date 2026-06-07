const Joi = require("joi");

// Insert Payments Validation
const insertPaymentsSchema = Joi.object({
    invoices_id: Joi.number().integer().min(1).required(),
    type_payment: Joi.string().max(255).valid('cash', 'transfer', 'credit_card', 'e_wallet', 'midtrans').required(),
    photo: Joi.string().optional().allow(""),
    is_approve: Joi.boolean().optional().allow(""),
    is_active: Joi.boolean().default(true)
});

// Update Payments Validation
const updatePaymentsSchema = Joi.object({
    invoices_id: Joi.number().integer().min(1).optional(),
    type_payment: Joi.string().max(255).valid('cash', 'transfer', 'credit_card', 'e_wallet', 'midtrans').optional(),
    photo: Joi.string().max(255).optional().allow(""),
    is_approve: Joi.boolean().optional(),
    is_active: Joi.boolean().optional()
});

module.exports = {
    insertPaymentsSchema,
    updatePaymentsSchema
};