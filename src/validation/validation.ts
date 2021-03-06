import { DataService }    from "../data/data";
import * as workerFarm    from "worker-farm";
import { PredictService } from "../predict/predict";

// VALIDATION USED ONLY FOR A, FOR B AND C CROSS VALIDATION IS USED BY PROVIDED LIB!

const workers = workerFarm({
  maxConcurrentCallsPerWorker: 1,
  maxConcurrentWorkers       : 6
}, require.resolve('./fork'));

let validateProm: Promise<any>;
let gi = 0;

export async function validateWithWorkers(): Promise<{
  question: any;
  answer: any;
  rating: any;
  testA: any;
  testB: any;
  testC: any;
}[]> {
  return validateProm = validateProm || _validateWithWorkers();
}

async function runSingleTest(i, dataService) {
  return new Promise((r, e) => {
    workers(i, function (err, tests) {
      console.log((++gi) + "/" + dataService.data.length);
      if (err) {
        console.error(err);
        return e(err);
      }
      const testRow = dataService.data[ i ];
      testRow.testA = tests[ 0 ];
      testRow.testB = tests[ 1 ];
      testRow.testC = tests[ 2 ];

      r();
    });
  })
}

export async function _validateWithWorkers() {
  console.log('Started validation test with workers!');

  const dataService = new DataService();
  await dataService.init();

  let queue = [];
  for (let i = 0; i < dataService.data.length; i++) {
    queue.push(runSingleTest(i, dataService));
  }
  await Promise.all(queue);

  return dataService.data.map(x => x.toStats());
}

export async function validate(sample?: number): Promise<{
  question: any;
  answer: any;
  rating: any;
  testA: any;
  testB: any;
  testC: any;
}[]> {
  return validateProm = validateProm || _validate(sample);
}

export async function _validate(sample?: number) {
  console.log('Started validation test!');

  const dataService = new DataService();
  await dataService.init();

  for (let i = 0; i < dataService.data.length; i++) {
    const testRow        = dataService.data[ i ];
    if (sample) {
      if (i % sample !== 0) {
        testRow.testA = 'SKIP' as any;
        testRow.testB = 'SKIP' as any;
        testRow.testC = 'SKIP' as any;
        continue;
      }
    }

    console.log((i + 1) + "/" + dataService.data.length);
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