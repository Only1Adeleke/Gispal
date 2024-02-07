const joi = require('joi');
const {
  options, isCountOnly, include, select 
} = require('../commonFilterValidation');

const createSchema = joi.object({
  isDeleted: joi.boolean(),
  name: joi.string().allow(null).allow(''),
  price: joi.number().allow(0),
  features: joi.any(),
  duration_months: joi.number().integer().allow(0)
}).unknown(true);

const updateSchema = joi.object({
  isDeleted: joi.boolean(),
  name: joi.string().allow(null).allow(''),
  price: joi.number().allow(0),
  features: joi.any(),
  duration_months: joi.number().integer().allow(0),
  id: joi.number().integer()
}).unknown(true);

let keys = ['query', 'where'];
let filterValidationSchema = joi.object({
  options: options,
  ...Object.fromEntries(keys.map(key => [key, joi.object({
    isDeleted: joi.alternatives().try(joi.array().items(),joi.boolean(),joi.object()),
    name: joi.alternatives().try(joi.array().items(),joi.string(),joi.object()),
    price: joi.alternatives().try(joi.array().items(),joi.number(),joi.object()),
    features: joi.alternatives().try(joi.array().items(),joi.any(),joi.object()),
    duration_months: joi.alternatives().try(joi.array().items(),joi.number().integer(),joi.object()),
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