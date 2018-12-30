import { AnswerClass, DataService } from "./data";
import * as md5                     from "md5";
import * as fs                      from "fs-extra";
import * as serialize               from 'serialization';
import * as puppeteer               from 'puppeteer';

function classifierFun() {
  const limdu = require('limdu');
  return new limdu.classifiers.NeuralNetwork();
}

export class ClassifierService {

  static readyMode = false;
  static trainMode = false;

  intentClassifier: any;

  constructor(public forModel: string) {
  }

  classify(answer: AnswerClass) {
    if (this.forModel === 'b') {
      return this.intentClassifier.classify(answer.toTrainVect());
    } else {
      return this.intentClassifier.classify(answer.toClassifyVectWithExtra());
    }
  }

  chrome() {
    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // await page.goto(`file:${path.join(__dirname, 'test.html')}`);
    // await page.screenshot({path: 'example.png'});
    // await browser.close();
  }

  async init(answersGroup: AnswerClass[]) {
    const id = md5(answersGroup.map(x => x.rating + ':' + x.answer).join(';'));
    let file = './data/train-' + this.forModel + '/';
    if (ClassifierService.readyMode || ClassifierService.trainMode) {
      file = './data/trainReady-' + this.forModel + '/';
    }
    await fs.ensureDir(file);
    file = file + id + '.json';

    if (fs.existsSync(file)) {
      // console.log('Loading classifier ' + answersGroup[0].question + ' > ' + id);
      let limduClassifierSavedString = await fs.readFile(file);
      this.intentClassifier          = serialize.fromString(limduClassifierSavedString, __dirname);
    } else {
      if (ClassifierService.readyMode) {
        throw new Error('ClassifierService is in ready mode but file was not found');
      }

      console.log('Classifying ' + file + ' > ' + answersGroup[ 0 ].question);
      this.intentClassifier = classifierFun();
      this.intentClassifier.trainBatch(
        answersGroup.map(x => {
          if (this.forModel === 'b') {
            return { input: x.toTrainVect(), output: x.rating }
          } else {
            return { input: x.toTrainVectWithExtra(), output: x.rating }
          }
        })
      );
      const limduClassifierExportString = serialize.toString(this.intentClassifier, classifierFun);
      await fs.writeFile(file, limduClassifierExportString);
    }
  }
}