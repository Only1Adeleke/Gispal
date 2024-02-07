const joi = require('joi');
const {
  options, isCountOnly, include, select 
} = require('../commonFilterValidation');

const createSchema = joi.object({
  isDeleted: joi.boolean(),
  user_id: joi.number().integer().allow(0),
  file_name: joi.string().allow(null).allow(''),
  file_type: joi.string().allow(null).allow(''),
  file_size: joi.number().integer().allow(0),
  processed_at: joi.date().options({ convert: true }).allow(null).allow(''),
  status: joi.any()
}).unknown(true);

const updateSchema = joi.object({
  isDeleted: joi.boolean(),
  user_id: joi.number().integer().allow(0),
  file_name: joi.string().allow(null).allow(''),
  file_type: joi.string().allow(null).allow(''),
  file_size: joi.number().integer().allow(0),
  processed_at: joi.date().options({ convert: true }).allow(null).allow(''),
  status: joi.any(),
  id: joi.number().integer()
}).unknown(true);

let keys = ['query', 'where'];
let filterValidationSchema = joi.object({
  options: options,
  ...Object.fromEntries(keys.map(key => [key, joi.object({
    isDeleted: joi.alternatives().try(joi.array().items(),joi.boolean(),joi.object()),
    user_id: joi.alternatives().try(joi.array().items(),joi.number().integer(),joi.object()),
    file_name: joi.alternatives().try(joi.array().items(),joi.string(),joi.object()),
    file_type: joi.alternatives().try(joi.array().items(),joi.string(),joi.object()),
    file_size: joi.alternatives().try(joi.array().items(),joi.number().integer(),joi.object()),
    processed_at: joi.alternatives().try(joi.array().items(),joi.date().options({ convert: true }),joi.object()),
    status: joi.alternatives().try(joi.array().items(),joi.any(),joi.object()),
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