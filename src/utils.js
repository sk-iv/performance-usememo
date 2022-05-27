import cn from "classnames";
// use setTimeout and requestAnimationFrame to wait for a complete render, with all the dom stuff done befor incrementing the counter
// https://stackoverflow.com/questions/26556436/react-after-render-code
export function onNextFrame(callback) {
  setTimeout(function() {
    window.requestAnimationFrame(callback);
  }, 0);
}

export const superComplicatedValueComputation = (value) => {
  const complexObject = {
    values: []
  };
  for (let i = 0; i <= 5000; i++) {
    complexObject.values.push(value);
  }
  return `hard ${value}`;
};

export const mediumValueComputation = (value) => {
  for (let i = 0; i < 1; ++i) {
    JSON.parse(JSON.stringify({ i }));
  }
  return value;
};

function median(values){
  if(values.length ===0) throw new Error("No inputs");

  values.sort(function(a,b){
    return a-b;
  });

  var half = Math.floor(values.length / 2);
  
  if (values.length % 2)
    return values[half];
  
  return (values[half - 1] + values[half]) / 2.0;
}

export const easyValueComputation = (value) => {
  const easyValue = cn('foo', { bar: true, duck: false }, 'baz', { [value]: true });
  return easyValue;
};

export const parseResults = (results) => {
  const sortedResults = results.reduce((accumulator, result) => {
    if (!accumulator[result.scenarioId]) {
      accumulator[result.scenarioId] = {};
    }

    accumulator[result.scenarioId][result.run] = result;

    return accumulator;
  }, {});

  const parsedResults = Object.keys(sortedResults).reduce((accumulator, scenarioKey) => {
    const scenario = sortedResults[scenarioKey];
    if (!accumulator[scenarioKey]) {
      accumulator[scenarioKey] = {
        name: "",
        averageUpdateDuration: 0,
        averageActualDuration: 0,
        averageMountActualDuration: 0,
        averageRerenderDuration: 0,
        averageNotMountRerenderDuration: 0,

        scenario: {},
        actualDuration: 0,
        mountActualDuration: 0,
        rerenderDuration: 0,
        notMountRerenderDuration: 0,
        updateDuration: 0
      };
    }

    accumulator[scenarioKey].scenario = scenario;
    accumulator[scenarioKey].name = scenario[0].id;

    accumulator[scenarioKey].actualDuration = Object.values(scenario).reduce(
      (sum, result) => {
        return sum + result.actualDuration;
      },
      0
    );

    accumulator[scenarioKey].averageActualDuration =
      accumulator[scenarioKey].actualDuration / Object.keys(scenario).length;

    accumulator[scenarioKey].medianActualDuration = median(Object.values(scenario).map((row) => row.actualDuration));

    accumulator[scenarioKey].mountActualDuration = Object.values(scenario)
      .filter(result => result.phase === "mount")
      .reduce((sum, result) => {
        return sum + result.actualDuration;
      }, 0);

    accumulator[scenarioKey].mountActualDuration = Object.values(scenario)
      .filter(result => result.phase === "mount")
      .reduce((sum, result) => {
        return sum + result.actualDuration;
      }, 0);

    accumulator[scenarioKey].averageMountActualDuration =
      accumulator[scenarioKey].mountActualDuration /
      Object.values(scenario).filter(result => result.phase === "mount").length;

    accumulator[scenarioKey].medianMountActualDuration = median(
      Object.values(scenario).reduce((sum, row) => {
        if (row.phase !== "mount") return sum
        return [...sum, row.actualDuration]
      }, [])
    );

    accumulator[scenarioKey].rerenderDuration = Object.values(scenario)
      .filter(result => result.valueChanged)
      .reduce((sum, result) => {
        return sum + result.actualDuration;
      }, 0);

    accumulator[scenarioKey].averageRerenderDuration =
      accumulator[scenarioKey].rerenderDuration /
      Object.values(scenario).filter(result => result.valueChanged).length;

    accumulator[scenarioKey].medianRerenderDuration = median(
      Object.values(scenario).reduce((sum, row) => {
        if (!row.valueChanged) return sum
        return [...sum, row.actualDuration]
      }, [])
    );

    accumulator[scenarioKey].notMountRerenderDuration = Object.values(scenario)
      .filter(result => result.valueChanged && result.phase !== "mount")
      .reduce((sum, result) => {
        return sum + result.actualDuration;
      }, 0);

    accumulator[scenarioKey].averageNotMountRerenderDuration =
      accumulator[scenarioKey].notMountRerenderDuration /
      Object.values(scenario).filter(
        result => result.valueChanged && result.phase !== "mount"
      ).length;

    accumulator[scenarioKey].updateDuration = Object.values(scenario)
      .filter(result => !result.valueChanged && result.phase !== "mount")
      .reduce((sum, result) => {
        return sum + result.actualDuration;
      }, 0);

    accumulator[scenarioKey].averageUpdateDuration =
      accumulator[scenarioKey].updateDuration /
      Object.values(scenario).filter(
        result => !result.valueChanged && result.phase !== "mount"
      ).length;

    return accumulator;
  }, {});

  return parsedResults;
};
