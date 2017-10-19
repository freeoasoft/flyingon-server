URL('/test', true);

GET(`select * from test${
    WHERE(IIF('{#0}', 'f1={#0}?', ''))
}`);

POST(`insert into test(${ FOR('@', '{name}') }) values(${ FOR('@', '{value}?') })`);

PUT(`update test set ${ FOR('@', '{name}={value}?') } where f1={#0}?`);

DELETE('delete from test where f1={#0}?');
