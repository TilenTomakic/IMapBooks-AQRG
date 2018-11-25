import { validate }        from "./validation";
import { PredictResponse } from "../server/interfaces";

let res: {
  question: string;
  answer: string;
  rating: 0 | 0.5 | 1;
  testA: PredictResponse;
  testB: PredictResponse;
  testC: PredictResponse;
}[];

describe('Predict test', () => {
  it('Validate', async (done) => {
    res = await validate();
    done();
  });

  it('A model', () => {
    for (const row of res) {
      expect(row.testA.score).toBe(row.rating);
    }
  });

  it('B model', () => {
    for (const row of res) {
      expect(row.testB.score).toBe(row.rating);
    }
  });

  it('C model', () => {
    for (const row of res) {
      expect(row.testC.score).toBe(row.rating);
    }
  });
});


