export interface PredictRequest {
  modelId:          string;
  question:         string;
  questionResponse: string;
}


export interface PredictResponse {
  score:       number;
  probability?: number;
}
