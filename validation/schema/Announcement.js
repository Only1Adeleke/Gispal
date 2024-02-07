const joi = require('joi');
const {
  options, isCountOnly, include, select 
} = require('../commonFilterValidation');

const createSchema = joi.object({
  isDeleted: joi.boolean(),
  title: joi.string().allow(null).allow(''),
  content: joi.any(),
  user_id: joi.number().integer().allow(0),
  created_at: joi.date().options({ convert: true }).allow(null).allow('')
}).unknown(true);

const updateSchema = joi.object({
  isDeleted: joi.boolean(),
  title: joi.string().allow(null).allow(''),
  content: joi.any(),
  user_id: joi.number().integer().allow(0),
  created_at: joi.date().options({ convert: true }).allow(null).allow(''),
  id: joi.number().integer()
}).unknown(true);

let keys = ['query', 'where'];
let filterValidationSchema = joi.object({
  options: options,
  ...Object.fromEntries(keys.map(key => [key, joi.object({
    isDeleted: joi.alternatives().try(joi.array().items(),joi.boolean(),joi.object()),
    title: joi.alternatives().try(joi.array().items(),joi.string(),joi.object()),
    content: joi.alternatives().try(joi.array().items(),joi.any(),joi.object()),
    user_id: joi.alternatives().try(joi.array().items(),joi.number().integer(),joi.object()),
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