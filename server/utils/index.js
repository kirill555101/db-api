const getFilteredColumns = (data) => Object.keys(data).filter((key) => data[key] !== '');

const getFilteredValues = (data) => Object.values(data).filter((value) => value !== '');

const getFilteredKeyValues = (data) => {
  return Object
    .entries(data)
    .filter((_, value) => value !== '')
    .reduce((prev, [k, v]) => {
      prev[k] = v;
      return prev;
    }, {});
};

const getArrayWithIntId = (data) => data.map((d) => ({ ...d, id: parseInt(d.id) }));

const constructPathString = (pathArray) => `{${pathArray.join(', ')}}`;

const getValueString = (arrayOfPostObjects) => {
  let resultQuery = ``;

  for (let i = 0; i < arrayOfPostObjects.length; i++) {
    const valuesInArray = getFilteredValues(arrayOfPostObjects[i]);
    let val = `( (SELECT nickname FROM users WHERE nickname='${valuesInArray[0]}'), `;

    for (let j = 1; j < valuesInArray.length; j++) {
      val += j === 2
        ? valuesInArray[j]
        : "'" + valuesInArray[j] + "'";

      if (j !== valuesInArray.length - 1) {
        val += ', ';
      }
    }

    resultQuery += val;
    resultQuery += i === arrayOfPostObjects.length - 1
      ? ") "
      : "), ";
  }

  return resultQuery;
};

const forumSerializer = (forumsArray) => {
  return forumsArray.map((forum) => {
    const { about, email, fullname, nickname } = forum;
    return { about, email, fullname, nickname };
  });
};

const createPairsQuery = (pairs) => {
  return pairs
    .map(([first, second]) => `((SELECT nickname FROM users WHERE nickname='${first}'), '${second}')`)
    .join(', ');
};

export default {
  getFilteredColumns, getFilteredValues, getFilteredKeyValues, getArrayWithIntId,
  constructPathString, getValueString, forumSerializer, createPairsQuery
};
