[![Build Status](https://travis-ci.com/TilenTomakic/IMapBooks-AQRG.svg?branch=master)](https://travis-ci.com/TilenTomakic/IMapBooks-AQRG)
[![](https://img.shields.io/docker/automated/tilen/sag.svg)](https://hub.docker.com/r/tilen/sag)
[![](https://img.shields.io/docker/build/tilen/sag.svg)](https://hub.docker.com/r/tilen/sag)
[![](https://img.shields.io/microbadger/image-size/tilen%2Fsag.svg)](https://hub.docker.com/r/tilen/sag)

# IMapBooks-AQRG

## Usage
You must have docker installed. 

Run `docker run --network host --name tilen-sag --rm tilen/sag`, wait for `Server is ready.` message and open your browser at http://localhost:8080


## IMapBooks - assignment tasks
- [x] Different models creation:
  - [x] Model (“A”) using only text used to make inference and one correct answer. <<< tdif na story in Answer.
  - [x] Model (“B”) using existing answers along with their scores and other story data.
  - [x] Model (“C”) using all the data from the dataset and additional resources (e.g. ConceptNet).

- [x] Calculate inter-rater agreement and scores of each rater w.r.t final
score.
- [x] Official scores are Fmacro and Fmicro.
- [x] HTTP server implementation
