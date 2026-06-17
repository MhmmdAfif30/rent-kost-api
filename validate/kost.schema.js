const Joi = require("joi");

const InsertKostSchema = Joi.object({
    contract_id: Joi.number().integer().min(1).required(),
    is_due_date: Joi.boolean().required(),
    amount: Joi.number().integer().required(),
    quantity: Joi.number().integer().required(),
    fee: Joi.number().integer().optional().allow(null),
    total: Joi.number().integer().required(),
    is_active: Joi.boolean().required()
});

const updateKostSchema = Joi.object({
    contract_id: Joi.number().integer().min(1).required(),
    is_due_date: Joi.boolean().required(),
    amount: Joi.number().integer().required(),
    quantity: Joi.number().integer().required(),
    fee: Joi.number().integer().optional().allow(null),
    total: Joi.number().integer().required(),
    is_active: Joi.boolean().required()
});

module.exports = {
    updateKostSchema,
    InsertKostSchema,
};