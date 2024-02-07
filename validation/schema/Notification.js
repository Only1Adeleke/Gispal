const joi = require('joi');
const {
  options, isCountOnly, include, select 
} = require('../commonFilterValidation');

const createSchema = joi.object({
  isDeleted: joi.boolean(),
  user_id: joi.number().integer().allow(0),
  content: joi.string().allow(null).allow(''),
  is_read: joi.boolean(),
  created_at: joi.date().options({ convert: true }).allow(null).allow('')
}).unknown(true);

const updateSchema = joi.object({
  isDeleted: joi.boolean(),
  user_id: joi.number().integer().allow(0),
  content: joi.string().allow(null).allow(''),
  is_read: joi.boolean(),
  created_at: joi.date().options({ convert: true }).allow(null).allow(''),
  id: joi.number().integer()
}).unknown(true);

let keys = ['query', 'where'];
let filterValidationSchema = joi.object({
  options: options,
  ...Object.fromEntries(keys.map(key => [key, joi.object({
    isDeleted: joi.alternatives().try(joi.array().items(),joi.boolean(),joi.object()),
    user_id: joi.alternatives().try(joi.array().items(),joi.number().integer(),joi.object()),
    content: joi.alternatives().try(joi.array().items(),joi.string(),joi.object()),
    is_read: joi.alternatives().try(joi.array().items(),joi.boolean(),joi.object()),
    created_at: joi.alternatives().try(joi.array().items(),joi.date().options({ convert: true }),joi.object()),
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