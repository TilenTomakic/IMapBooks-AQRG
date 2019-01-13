import { Server }            from "./server/server";
import { DataService }       from "./data/data";
import { PredictService }    from "./predict/predict";
import { ClassifierConst }   from "./classifier/const";

DataService.readyMode     = true;
ClassifierConst.readyMode = true;

console.log('=======================');
console.log('Starting server, PLEASE WAIT.');
console.log('=======================');

(new DataService())
  .init()
  .then(dataService => {
    return (new PredictService(dataService)).init();
  })
  .then(predictService => {
    const server = new Server(predictService);
    server.listen();
    console.log('Server ready.');
    console.log('=======================');
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
