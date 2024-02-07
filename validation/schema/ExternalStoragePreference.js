const joi = require('joi');
const {
  options, isCountOnly, include, select 
} = require('../commonFilterValidation');

const createSchema = joi.object({
  isDeleted: joi.boolean(),
  user_id: joi.number().integer().allow(0),
  storage_location: joi.any()
}).unknown(true);

const updateSchema = joi.object({
  isDeleted: joi.boolean(),
  user_id: joi.number().integer().allow(0),
  storage_location: joi.any(),
  id: joi.number().integer()
}).unknown(true);

let keys = ['query', 'where'];
let filterValidationSchema = joi.object({
  options: options,
  ...Object.fromEntries(keys.map(key => [key, joi.object({
    isDeleted: joi.alternatives().try(joi.array().items(),joi.boolean(),joi.object()),
    user_id: joi.alternatives().try(joi.array().items(),joi.number().integer(),joi.object()),
    storage_location: joi.alternatives().try(joi.array().items(),joi.any(),joi.object()),
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