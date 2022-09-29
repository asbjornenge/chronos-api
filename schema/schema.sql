CREATE TABLE IF NOT EXISTS tasks (
  id            serial PRIMARY KEY,
  name          varchar(100),
  cron          varchar(100),
  paused        boolean,
  created       timestamp not null,
  updated       timestamp not null,
  category      integer REFERENCES 
);

CREATE TABLE IF NOT EXISTS steps (
  id            serial PRIMARY KEY,
  task          integer REFERENCES tasks ON DELETE CASCADE,
  command       text,
  timeout       integer,
  created       timestamp not null,
  updated       timestamp not null,
  stdoutRegex   text
);

CREATE TABLE IF NOT EXISTS execs (
  id            serial PRIMARY KEY,
  step          integer REFERENCES steps ON DELETE CASCADE,
  stdout        text,
  stderr        text,
  exitcode      integer,
  time_start    timestamp not null,
  time_end      timestamp not null,
);

CREATE TABLE IF NOT EXISTS secrets (
  id            serial PRIMARY KEY,
  name          varchar(100),
  secretvalue   text,
  created       timestamp not null,
  updated       timestamp not null
);

CREATE TABLE IF NOT EXISTS category (
  id            serial PRIMARY KEY,
  name          varchar(100),
)

CREATE TABLE IF NOT EXISTS categoryPermissionMapping (
  id            serial PRIMARY KEY
  userGroup     integer REFERENCES userGroups ON DELETE CASCADE
  category      integer REFERENCES category ON DELETE CASCADE
) 

CREATE TABLE IF NOT EXISTS userGroups (
  id            serial PRIMARY KEY
  name          varchar(100)
  isAdmin       boolean
)

CREATE TABLE IF NOT EXISTS userGroupMembership (
  id            serial PRIMARY KEY
  userId        varchar(100)
  userGroup     integer REFERENCES userGroups ON DELETE CASCADE
)

ALTER TABLE steps ADD COLUMN name varchar(100);
ALTER TABLE steps ADD COLUMN sort_order integer;
ALTER TABLE steps ADD COLUMN stdoutRegex text;

ALTER TABLE execs ADD COLUMN completed boolean;

ALTER TABLE "execs"
ALTER COLUMN "time_end" TYPE TIMESTAMP,
ALTER COLUMN "time_end" DROP NOT NULL,
ALTER COLUMN "time_end" DROP DEFAULT;

ALTER TABLE tasks ADD COLUMN "pauseToggeled" TIMESTAMP NULL;

ALTER TABLE tasks ADD COLUMN "acknowledged" boolean NULL;

/* 
ALTER TABLE steps DROP CONSTRAINT steps_task_fkey, ADD CONSTRAINT steps_task_fkey FOREIGN KEY (task) REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE execs DROP CONSTRAINT execs_step_fkey, ADD CONSTRAINT execs_step_fkey FOREIGN KEY (step) REFERENCES steps(id) ON DELETE CASCADE;
*/
