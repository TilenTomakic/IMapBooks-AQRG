import { DataService }    from "../data/data";
import * as workerFarm    from "worker-farm";

const workers = workerFarm({
  maxConcurrentCallsPerWorker: 1,
  maxConcurrentWorkers       : 4
}, require.resolve('./fork'));

let validateProm: Promise<any>;
let gi = 0;

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

async function runSingleTest(i, dataService) {
  return new Promise((r, e) => {
    workers(i, function (err, tests) {
      console.log((++gi) + "/" + dataService.data.length);
      if (err) {
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

export async function _validate() {
  console.log('Started validation test!');

  const dataService = new DataService();
  await dataService.init();

  let queue = [];
  for (let i = 0; i < dataService.data.length; i++) {
    queue.push(runSingleTest(i, dataService));
  }
  await Promise.all(queue);

  return dataService.data.map(x => x.toStats());
}
