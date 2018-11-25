import { DataService }    from "../data/data";
import { PredictService } from "../predict/predict";

let validateProm: Promise<any>;

export async function validate() {
  return validateProm = validateProm || _validate();
}

export async function _validate() {
  console.log('Started validation test!');

  const all = new DataService();
  await all.init();

  for (let i = 0; i < all.data.length; i++) {
    const testRow = all.data[i];
    const dataService = new DataService();
    await dataService.init();
    const predictService = new PredictService(dataService);
    await predictService.init();

    const tests = await Promise.all(['A', 'B', 'C'].map(modelId => predictService.predict({
      "modelId": modelId as any,
      "question": testRow.question,
      "questionResponse": testRow.answer
    })));
    testRow.testA = tests[0];
    testRow.testB = tests[1];
    testRow.testC = tests[2];
  }

  return all.data.map(x => x.toStats());
}