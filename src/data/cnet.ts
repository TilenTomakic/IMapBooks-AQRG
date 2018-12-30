import * as fs from "fs-extra";

const fetch = require("node-fetch");

export const conceptNet = new class {
  i = 0;

  data: {
    [ word: string ]: {
      related: {
        '@id': string,
        weight: number
      }[],
      '@id': string;
    }
  } = {};

  constructor() {
    this.data = fs.readJSONSync('./data/cnet.json');
  }

  async save() {
    console.log('Saving cnet.');
    this.i = 0;
    await fs.writeJSON('./data/cnet.json', this.data);
  }

  async getRelated(word: string) {
    const x = await this.get(word);
    return (x.related || []).reduce((a, x) => ({ ...a, [x['@id'].split('/').pop()]: x.weight }), {})
  }


  getRelatedFromLocal(word: string) {
    if (!this.data[ word ]) {
      return {};
    }
    const x = this.data[ word ];
    return (x.related || []).reduce((a, x) => ({ ...a, [x['@id'].split('/').pop()]: x.weight }), {})
  }

  async get(word: string) {
    if (!this.data[ word ]) {
      console.log('Getting cnet word ' + word);
      const res = await fetch(` http://api.conceptnet.io/related/c/en/${ word }?filter=/c/en`);

      if (res.status === 429) {
        await this.save();
        console.log('Too Many Requests (60 per 1 minute). Wait mode activated.');
        console.log('Currently have ' + Object.keys(this.data).length +  ' items.');
        await new Promise(r => {
          setTimeout(() => {
            r();
          }, 1000 * 61)
        });
        return this.get(word);
      }

      this.data[ word ] = await res.json();
      this.i++;
      if (this.i > 1) {
        await this.save();
      }
    } else {
      // console.log('Already have ' + word);
    }

    return this.data[ word ];
  }
};
