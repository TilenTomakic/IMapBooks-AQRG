import { validate }        from "./validation";
import { PredictResponse } from "../server/interfaces";
import { DataService }     from "../data/data";

DataService.readyMode = true;

let resOrig: {
  question: string;
  answer: string;
  rating: 0 | 0.5 | 1;
  testA: PredictResponse;
  testB: PredictResponse;
  testC: PredictResponse;
}[];

describe('Predict test', () => {
  it('Validate', async () => {
    resOrig = await validate(10);
  });

  it('A model', () => {
    const res   = resOrig.filter(x => x.testA !== 'SKIP' as any);
    const score = (res
      .reduce((a, r) => r.rating === r.testA.score ? ++a : a, 0) / res.length * 100);
    expect(score).toBeGreaterThan(30);
  });

  it('B model', () => {
    const res   = resOrig.filter(x => x.testB !== 'SKIP' as any);
    const score = (res
      .reduce((a, r) => r.rating === r.testB.score ? ++a : a, 0) / res.length * 100);
    expect(score).toBeGreaterThan(40);
  });

  it('C model', () => {
    const res   = resOrig.filter(x => x.testC !== 'SKIP' as any);
    const score = (res
      .reduce((a, r) => r.rating === r.testC.score ? ++a : a, 0) / res.length * 100);
    expect(score).toBeGreaterThan(60);
  });
});
