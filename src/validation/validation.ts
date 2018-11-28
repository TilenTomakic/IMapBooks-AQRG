import { DataService }    from "../data/data";
import { PredictService } from "../predict/predict";

let validateProm: Promise<any>;

export async function validate(): Promise<{
  question: any;
  answer: any;
  rating: any;
  testA: any;
  testB: any;
  testC: any;
}[]> {
  return validateProm = validateProm || _validate();
}

export async function _validate() {
  console.log('Started validation test!');

  const dataService = new DataService();
  await dataService.init();

  for (let i = 0; i < dataService.data.length; i++) {
    const testRow        = dataService.data[ i ];
    const predictService = new PredictService(dataService.without(i));
    await predictService.init();

    const tests   = await Promise.all([ 'A', 'B', 'C' ].map(modelId => predictService.predict({
      "modelId"         : modelId as any,
      "question"        : testRow.question,
      "questionResponse": testRow.answer
    })));
    testRow.testA = tests[ 0 ];
    testRow.testB = tests[ 1 ];
    testRow.testC = tests[ 2 ];
  }

  return dataService.data.map(x => x.toStats());
}
