function bindParameters(sql, parameters = []) {
  const values = [];
  let result = '';
  let parameterIndex = 0;
  let state = 'sql';

  for (let index = 0; index < sql.length; index += 1) {
    const character = sql[index];
    const next = sql[index + 1];

    if (state === 'single' || state === 'double' || state === 'backtick') {
      result += character;
      if (character === (state === 'single' ? "'" : state === 'double' ? '"' : '`')) {
        if (next === character) {
          result += next;
          index += 1;
        } else {
          state = 'sql';
        }
      } else if (character === '\\' && state === 'single' && next) {
        result += next;
        index += 1;
      }
      continue;
    }

    if (state === 'line-comment') {
      result += character;
      if (character === '\n') state = 'sql';
      continue;
    }

    if (state === 'block-comment') {
      result += character;
      if (character === '*' && next === '/') {
        result += next;
        index += 1;
        state = 'sql';
      }
      continue;
    }

    if (character === "'" || character === '"' || character === '`') {
      state = character === "'" ? 'single' : character === '"' ? 'double' : 'backtick';
      result += character;
      continue;
    }
    if (character === '-' && next === '-') {
      state = 'line-comment';
      result += '--';
      index += 1;
      continue;
    }
    if (character === '/' && next === '*') {
      state = 'block-comment';
      result += '/*';
      index += 1;
      continue;
    }
    if (character !== '?') {
      result += character;
      continue;
    }

    if (parameterIndex >= parameters.length) {
      throw new Error('SQL parameter count does not match the number of placeholders.');
    }
    const value = parameters[parameterIndex];
    parameterIndex += 1;
    if (Array.isArray(value)) {
      if (value.length === 0) {
        result += 'NULL';
      } else {
        result += value.map((item) => {
          values.push(item);
          return `$${values.length}`;
        }).join(', ');
      }
    } else {
      values.push(value);
      result += `$${values.length}`;
    }
  }

  if (parameterIndex !== parameters.length) {
    throw new Error('SQL parameter count does not match the number of placeholders.');
  }
  return { sql: result, values };
}

function prepareSql(sql) {
  let prepared = sql.replace(/INSERT\s+IGNORE\s+INTO/gi, 'INSERT INTO').trim().replace(/;$/, '');
  const ignoreInsert = /^\s*INSERT\s+IGNORE\s+INTO\b/i.test(sql);
  const insertMatch = prepared.match(/^\s*INSERT\s+INTO\s+("?[\w]+"?)/i);
  const isInsert = Boolean(insertMatch);

  if (ignoreInsert && !/\bON\s+CONFLICT\b/i.test(prepared)) {
    prepared += ' ON CONFLICT DO NOTHING';
  }
  if (isInsert && !/\bRETURNING\b/i.test(prepared)) {
    prepared += ' RETURNING *';
  }
  return { sql: prepared, table: insertMatch?.[1]?.replace(/"/g, '').toLowerCase() };
}

module.exports = { bindParameters, prepareSql };
