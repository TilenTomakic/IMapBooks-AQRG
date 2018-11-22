import { predictService } from "./predict";

describe('Predict test', () => {
  it('A model', async (done) => {
    const res = await predictService.predict({
      "modelId": "A",
      "question": "How does Shiranna feel?",
      "questionResponse": "She is a little bit nervous."
    });
    expect(res.score).toBe(1);

    done();
  });
});


