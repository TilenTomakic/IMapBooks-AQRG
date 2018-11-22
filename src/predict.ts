import { PredictRequest, PredictResponse } from "./server/interfaces";

export const predictService = new class {
  async predict(data: PredictRequest): Promise<PredictResponse> {
    return null;
  }
};
