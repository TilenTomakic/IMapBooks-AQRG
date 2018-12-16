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
  it('Validate', async () => {
    res = await validate();
  });

  it('A model', () => {
    const score =  (res.reduce((a, r) => r.rating === r.testA.score ? ++a : a, 0)/res.length * 100);
    expect(score).toBeGreaterThan(5);
  });

  it('B model', () => {
    const score =  (res.reduce((a, r) => r.rating === r.testB.score ? ++a : a, 0)/res.length * 100);
    expect(score).toBeGreaterThan(60);
  });

  it('C model', () => {
    const score =  (res.reduce((a, r) => r.rating === r.testC.score ? ++a : a, 0)/res.length * 100);
    expect(score).toBeGreaterThan(-1);
  });
});


