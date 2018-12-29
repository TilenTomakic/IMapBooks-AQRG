import { PredictService } from "../predict/predict";
import { DataService }    from "../data/data";

module.exports = function (i, callback) {
  (async () => {
    const dataService = new DataService();
    await dataService.init();

    const testRow        = dataService.data[ i ];
    const predictService = new PredictService(dataService.without(i));
    await predictService.init();
    const tests = await Promise.all([ 'A', 'B', 'C' ].map(modelId => predictService.predict({
      "modelId"         : modelId as any,
      "question"        : testRow.question,
      "questionResponse": testRow.answer
    })));
    callback(null, tests);
  })();
};