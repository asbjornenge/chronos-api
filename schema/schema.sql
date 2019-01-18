CREATE TABLE IF NOT EXISTS tasks (
  id            serial PRIMARY KEY,
  name          varchar(100),
  cron          varchar(100),
  paused        boolean,
  created       timestamp not null,
  updated       timestamp not null
);

CREATE TABLE IF NOT EXISTS steps (
  id            serial PRIMARY KEY,
  task          integer REFERENCES tasks,
  command       text,
  timeout       integer,
  created       timestamp not null,
  updated       timestamp not null
);

CREATE TABLE IF NOT EXISTS execs (
  id            serial PRIMARY KEY,
  step          integer REFERENCES steps,
  stdout        text,
  stderr        text,
  exitcode      integer,
  time_start    timestamp not null,
  time_end      timestamp not null
);

ALTER TABLE steps ADD COLUMN name varchar(100);
