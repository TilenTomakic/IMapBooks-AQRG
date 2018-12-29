[![Build Status](https://travis-ci.com/TilenTomakic/IMapBooks-AQRG.svg?branch=master)](https://travis-ci.com/TilenTomakic/IMapBooks-AQRG)
[![](https://img.shields.io/docker/automated/jrottenberg/ffmpeg.svg)](https://hub.docker.com/r/tilen/sag)
[![](https://img.shields.io/docker/build/jrottenberg/ffmpeg.svg)](https://hub.docker.com/r/tilen/sag)
[![](https://img.shields.io/microbadger/image-size/tilen%2Fsag.svg)](https://hub.docker.com/r/tilen/sag)

# IMapBooks-AQRG

## Usage
You must have docker installed. Run command `docker run -p 8080:8080 tilen/sag`.
> Open your browser http://localhost:8080


## IMapBooks - assignment tasks
- [x] Different models creation:
  - [x] Model (“A”) using only text used to make inference and one correct answer. <<< tdif na story in Answer.
  - [x] Model (“B”) using existing answers along with their scores and other story data.
  - [x] Model (“C”) using all the data from the dataset and additional resources (e.g. ConceptNet).

- [ ] Calculate inter-rater agreement and scores of each rater w.r.t final
score.
- [ ] Ideas/experiments for the Slovene language (OPTIONAL, bonus
points).
- [ ] Official scores are Fmacro and Fmicro.
- [x] HTTP server implementation
