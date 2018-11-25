export interface PredictRequest {
  modelId:          'A' | 'B' | 'C';
  question:         string;
  questionResponse: string;
}


export interface PredictResponse {
  score:       number;
  probability?: number;
}
