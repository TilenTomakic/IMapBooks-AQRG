# IMapBooks-AQRG

## Usage
You must have docker and docker-compose installed. Then simply run `docker-compose up`.
> Open your browser http://localhost:8080

## Development setup
### Installation
Install `nodeJs` (https://nodejs.org/en/) and `yarn` (https://yarnpkg.com/en/). 
After that run command `yarn install`.

### Development
Run following commands:
```bash
$ yarn run build
$ yarn run start
```

## IMapBooks - assignment tasks
- [x] Different models creation:
  - [ ] Model (“A”) using only text used to make inference and one correct answer. <<< tdif na story in Answer.
  - [ ] Model (“B”) using existing answers along with their scores and other story data.
  - [ ] Model (“C”) using all the data from the dataset and additional resources (e.g. ConceptNet).

- [ ] Calculate inter-rater agreement and scores of each rater w.r.t final
score.
- [ ] Ideas/experiments for the Slovene language (OPTIONAL, bonus
points).
- [ ] Official scores are Fmacro and Fmicro.
- [x] HTTP server implementation
- [ ] Report by 19. 12 (3 page)
