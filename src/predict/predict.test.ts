import { PredictService } from "./predict";
import { DataService }    from "../data/data";
import { Server }         from "../server/server";

const dataService = new DataService();
let predictService: PredictService;

beforeAll(() => {
  return dataService
    .init()
    .then(dataService => {
      return (new PredictService(dataService)).init();
    })
    .then(ps => {
      predictService = ps;
      const server = new Server(ps);
      server.listen();
    })
});

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

  it('B model', async (done) => {
    const res = await predictService.predict({
      "modelId": "B",
      "question": "How does Shiranna feel?",
      "questionResponse": "She is a little bit nervous."
    });
    expect(res.score).toBe(1);

    done();
  });

  it('C model', async (done) => {
    const res = await predictService.predict({
      "modelId": "C",
      "question": "How does Shiranna feel?",
      "questionResponse": "She is a little bit nervous."
    });
    expect(res.score).toBe(1);

    done();
  });
});

