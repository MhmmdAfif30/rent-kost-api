const Joi = require("joi");

const InsertContractsSchema = Joi.object({
    users_id: Joi.number().integer().min(1).required(),
    start_date: Joi.date().required(),
    end_date: Joi.date().required()
});

const updateContractSchema = Joi.object({
    users_id: Joi.number().integer().min(1).optional().allow(null),
    start_date: Joi.date().optional().allow(null),
    end_date: Joi.date().optional().allow(null)
});

module.exports = {
    InsertContractsSchema,
    updateContractSchema,
};