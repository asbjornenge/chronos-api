# Chronos API

A flexible task runner designed for [docker](https://www.docker.com/) based cloud environments.

In Chronos you can add tasks to run at specific times defined in [cron](https://en.wikipedia.org/wiki/Cron) syntax. Each task can have multiple steps. Steps are executed in order and `stdout` and `stderr` are stored for each execution. 

Chronos is split into two components; an [app](https://github.com/asbjornenge/chronos-app) and an [api](https://github.com/asbjornenge/chronos-api) (this repo).

You need to run both to have an operational application. For instruction on how to run the APP, check out the app repo :point_up:

## Install

Chronos uses [postgres](https://www.postgresql.org/) as it's database to store tasks, steps and execs.

Create a database, user and load schema:

```
create database chronos;
create user chronos with encrypted password 'chronos';
grant all privileges on database chronos to chronos;
psql -U chronos -h postgres -d chronos < schema/schema.sql
```

## Run

### Start the api

```
docker run -p 3001:3001 -e DB_HOST=postgres -it asbjornenge/chronos-api:latest 
```

Supported environment variables:

```
env       default      wat
--
DB_HOST   localhost    postgres hostname / ip
DB_PORT   5432         postgres port
DB_USER   chronos      postgres username
DB_PASS   chronos      postgres password
DB_NAME   chronos      postgres database
```

### Run the app

Refer to the [app](https://github.com/asbjornenge/chronos-app) repo for instruction on running the app and start using Chronos :tada:

**NB!** The app exects the `api` service to be availble on the `/api` path.

## Metrics

Chronos API also exports [prometheus](https://prometheus.io/) metrics for it's backups (success/failure) on the `/metrics` path.

```
curl localhost:3001/metrics
```

enjoy. 
