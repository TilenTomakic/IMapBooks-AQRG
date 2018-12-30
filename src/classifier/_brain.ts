import { AnswerClass }     from "../data/data";
import * as fs             from "fs-extra";
import * as hash           from 'object-hash';
import * as brain          from 'brain.js';
import { ClassifierConst } from "./const";
import { PredictResponse } from "../server/interfaces";

export class BarinClassifierService {

  net = new brain.NeuralNetwork();

  constructor(public forModel: 'b' | 'c') {
  }

  classify(answer: AnswerClass) {
    let x;
    if (this.forModel === 'b') {
      x = this.net.run(answer.toClassifyVectors());
    } else {
      x = this.net.run(answer.toClassifyVectorWithExtra());
    }
    return x;
  }

  classifyAsPredictResponse(answer: AnswerClass): PredictResponse {
    const x       = this.classify(answer);
    const bestKey = Object.keys(x).sort((a, b) => x[ b ] - x[ a ])[ 0 ];
    return {
      score      : +bestKey,
      probability: x[ bestKey ]
    }
  }

  async train(dataArray: { input: any, output: any }[]) {
    this.net.train(dataArray);
  }

  getData(answersGroup: AnswerClass[]) {
    return answersGroup.map(x => {
      if (this.forModel === 'b') {
        return { input: x.toTrainVectors(), output: { [ x.rating ]: 1 } }
      } else {
        return { input: x.toTrainVectorWithExtra(), output: { [ x.rating ]: 1 } }
      }
    })
  }

  async init(answersGroup: AnswerClass[]) {
    const data = this.getData(answersGroup);
    const id   = hash(data, {
      unorderedObjects: true,
      unorderedArrays : true
    });
    let file   = './data/brain/validation-' + this.forModel + '/';
    if (ClassifierConst.readyMode || ClassifierConst.trainMode) {
      file = './data/brain/server-' + this.forModel + '/';
    }
    await fs.ensureDir(file);
    file = file + id + '.json';

    if (fs.existsSync(file)) {
      console.log('BRAIN: Loading classifier ' + answersGroup[ 0 ].question + ' > ' + id);

      let netJson = await fs.readJSON(file);
      this.net.fromJSON(netJson);
    } else {
      console.log('BRAIN: Classifying ' + file + ' > ' + answersGroup[ 0 ].question);

      if (ClassifierConst.readyMode) {
        throw new Error('ClassifierService is in ready mode but file was not found');
      }

      await this.train(data);

      await fs.writeJSON(file, this.net.toJSON());
    }
  }
}


/*
 const browser = await puppeteer.launch({
 headless: false
 });
 const page    = await browser.newPage();
 await page.setContent(`<!DOCTYPE html>
 <html lang="en">
 <head>
 <meta charset="UTF-8">
 <title>Training</title>
 <script src="https://cdn.rawgit.com/BrainJS/brain.js/master/browser.js"></script>
 </head>
 <body>
 <script>
 const data = ${ JSON.stringify(dataArray) };
 const net = new brain.NeuralNetworkGPU();
 net.train(data);
 document.write(JSON.stringify(output));
 </script>
 </body>
 </html>`, {
 timeout: 0
 });
 // await new Promise(r => {
 //   page.on('domcontentloaded' as any, () => {
 //   });
 // });
 const bodyHandle = await page.$('body');
 const html       = await page.evaluate(body => body.innerHTML, bodyHandle);
 await bodyHandle.dispose();
 await browser.close();*/
