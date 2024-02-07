const joi = require('joi');
const {
  options, isCountOnly, include, select 
} = require('../commonFilterValidation');

const createSchema = joi.object({
  isDeleted: joi.boolean(),
  user_id: joi.number().integer().allow(0),
  amount: joi.any(),
  status: joi.number().integer().allow(0),
  payment_gateway: joi.string().allow(null).allow(''),
  transaction_date: joi.date().options({ convert: true }).allow(null).allow('')
}).unknown(true);

const updateSchema = joi.object({
  isDeleted: joi.boolean(),
  user_id: joi.number().integer().allow(0),
  amount: joi.any(),
  status: joi.number().integer().allow(0),
  payment_gateway: joi.string().allow(null).allow(''),
  transaction_date: joi.date().options({ convert: true }).allow(null).allow(''),
  id: joi.number().integer()
}).unknown(true);

let keys = ['query', 'where'];
let filterValidationSchema = joi.object({
  options: options,
  ...Object.fromEntries(keys.map(key => [key, joi.object({
    isDeleted: joi.alternatives().try(joi.array().items(),joi.boolean(),joi.object()),
    user_id: joi.alternatives().try(joi.array().items(),joi.number().integer(),joi.object()),
    amount: joi.alternatives().try(joi.array().items(),joi.any(),joi.object()),
    status: joi.alternatives().try(joi.array().items(),joi.number().integer(),joi.object()),
    payment_gateway: joi.alternatives().try(joi.array().items(),joi.string(),joi.object()),
    transaction_date: joi.alternatives().try(joi.array().items(),joi.date().options({ convert: true }),joi.object()),
    id: joi.any()
  }).unknown(true),])),
  isCountOnly: isCountOnly,
  include: joi.array().items(include),
  select: select
}).unknown(true);

module.exports = {
  createSchema,
  updateSchema,
  filterValidationSchema
};