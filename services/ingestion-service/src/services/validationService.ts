import Joi from 'joi';
import { RawTelemetry } from '../models/RawTelemetry';

const telemetrySchema = Joi.object({
  tenantId: Joi.string().required(),
  vendorId: Joi.string().required(),
  deviceId: Joi.string().required(),
  timestamp: Joi.string().isoDate().required(),
  payload: Joi.object().required(),
});

export class ValidationService {
  validateTelemetry(data: any): { valid: boolean; error?: string; value?: RawTelemetry } {
    const { error, value } = telemetrySchema.validate(data);
    
    if (error) {
      return { valid: false, error: error.details[0].message };
    }
    
    return { valid: true, value: value as RawTelemetry };
  }

  validateBatch(data: any[]): { valid: boolean; errors: string[]; validItems: RawTelemetry[] } {
    const errors: string[] = [];
    const validItems: RawTelemetry[] = [];

    data.forEach((item, index) => {
      const result = this.validateTelemetry(item);
      if (result.valid && result.value) {
        validItems.push(result.value);
      } else {
        errors.push(`Item ${index}: ${result.error}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      validItems,
    };
  }
}

export const validationService = new ValidationService();
