import Joi from 'joi';
import { logger } from './logger.js';

// Schema validation cho từng tool
const toolSchemas = {
  get_diff: Joi.object({
    repo: Joi.string().pattern(/^[^\/]+\/[^\/]+$/).required()
      .messages({
        'string.pattern.base': 'Repo phải có format org/name',
        'any.required': 'Repo là bắt buộc'
      }),
    commitId: Joi.string().min(7).max(40).required()
      .messages({
        'string.min': 'Commit ID phải có ít nhất 7 ký tự',
        'string.max': 'Commit ID không được quá 40 ký tự',
        'any.required': 'Commit ID là bắt buộc'
      }),
    paths: Joi.array().items(Joi.string()).optional(),
    maxPatchBytes: Joi.number().integer().min(1024).max(1048576).optional()
      .messages({
        'number.min': 'Max patch bytes phải ít nhất 1KB',
        'number.max': 'Max patch bytes không được quá 1MB'
      })
  }),

  run_ci: Joi.object({
    projectId: Joi.string().min(1).max(100).required()
      .messages({
        'any.required': 'Project ID là bắt buộc'
      }),
    testPlan: Joi.string().min(10).max(1000).required()
      .messages({
        'string.min': 'Test plan phải có ít nhất 10 ký tự',
        'string.max': 'Test plan không được quá 1000 ký tự',
        'any.required': 'Test plan là bắt buộc'
      }),
    runner: Joi.object({
      image: Joi.string().min(1).max(200).required()
        .messages({
          'any.required': 'Docker image là bắt buộc'
        }),
      workdir: Joi.string().min(1).max(200).optional(),
      cmd: Joi.array().items(Joi.string()).min(1).required()
        .messages({
          'array.min': 'Command phải có ít nhất 1 phần tử',
          'any.required': 'Command là bắt buộc'
        })
    }).required(),
    artifacts: Joi.array().items(Joi.string()).min(1).required()
      .messages({
        'array.min': 'Artifacts phải có ít nhất 1 phần tử',
        'any.required': 'Artifacts là bắt buộc'
      }),
    timeoutSec: Joi.number().integer().min(30).max(3600).optional()
      .messages({
        'number.min': 'Timeout phải ít nhất 30 giây',
        'number.max': 'Timeout không được quá 1 giờ'
      })
  }),

  get_coverage: Joi.object({
    reportId: Joi.string().min(1).max(100).required()
      .messages({
        'any.required': 'Report ID là bắt buộc'
      }),
    format: Joi.string().valid('lcov', 'cobertura').required()
      .messages({
        'any.only': 'Format phải là lcov hoặc cobertura',
        'any.required': 'Format là bắt buộc'
      })
  }),

  notify: Joi.object({
    channel: Joi.string().min(1).max(200).required()
      .messages({
        'any.required': 'Channel là bắt buộc'
      }),
    message: Joi.string().min(1).max(2000).required()
      .messages({
        'any.required': 'Message là bắt buộc',
        'string.max': 'Message không được quá 2000 ký tự'
      }),
    level: Joi.string().valid('info', 'warning', 'error').required()
      .messages({
        'any.only': 'Level phải là info, warning hoặc error',
        'any.required': 'Level là bắt buộc'
      })
  })
};

/**
 * Validate tool request
 * @param {string} toolName - Tên tool
 * @param {object} data - Dữ liệu cần validate
 * @returns {object} - Kết quả validation
 */
export const validateToolRequest = (toolName, data) => {
  try {
    const schema = toolSchemas[toolName];
    if (!schema) {
      return {
        isValid: false,
        errors: [`Tool '${toolName}' không được hỗ trợ`]
      };
    }

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      logger.warn('Validation failed', {
        toolName,
        errors,
        data
      });

      return {
        isValid: false,
        errors,
        value: null
      };
    }

    return {
      isValid: true,
      errors: [],
      value
    };

  } catch (validationError) {
    logger.error('Validation error', {
      toolName,
      error: validationError.message,
      data
    });

    return {
      isValid: false,
      errors: ['Lỗi validation không xác định'],
      value: null
    };
  }
};

/**
 * Sanitize input data
 * @param {object} data - Dữ liệu cần sanitize
 * @returns {object} - Dữ liệu đã được sanitize
 */
export const sanitizeInput = (data) => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Loại bỏ các ký tự nguy hiểm
      sanitized[key] = value
        .replace(/[<>]/g, '') // Loại bỏ < >
        .trim();
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? item.trim() : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};
